import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferCheckedInstruction, getAccount, createAssociatedTokenAccountInstruction, getMint } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";

/**
 * Poll for transaction signature by checking recent transactions
 */
async function findTransactionSignature(
  connection: Connection,
  walletPubkey: PublicKey,
  recipientPubkey: PublicKey,
  amount: bigint,
  maxAttempts: number = 10
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Get recent signatures for the wallet
      const signatures = await connection.getSignaturesForAddress(walletPubkey, { limit: 5 });
      
      for (const sigInfo of signatures) {
        // Get transaction details
        const tx = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (!tx) continue;
        
        // Check if this transaction is recent (within last 30 seconds)
        const txTime = tx.blockTime ? tx.blockTime * 1000 : 0;
        const now = Date.now();
        if (now - txTime > 30000) {
          // Transaction is too old, skip
          continue;
        }
        
        // For now, return the first recent transaction signature
        // A more robust solution would decode and verify it's the correct transfer
        // But this is a reasonable heuristic: if payment just succeeded, the most recent
        // transaction from our wallet is likely the payment transaction
        return sigInfo.signature;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.error("Error polling for transaction");
    }
  }
  
  return null;
}

export interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset?: string;
  extra?: {
    feePayer?: string; // Facilitator's fee payer address
  };
}

export interface X402PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    transaction: string; // base64-encoded transaction
  };
}

/**
 * Creates a USDC payment transaction for x402 payment requirements
 */
async function createPaymentTransaction(
  requirements: PaymentRequirements,
  wallet: WalletContextState,
  connection: Connection
): Promise<Transaction> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  if (!requirements.asset) {
    throw new Error("Payment requirements missing asset (token mint address)");
  }

  const recipientPubkey = new PublicKey(requirements.payTo);
  
  // Use the mint address from payment requirements (backend specifies it)
  const requiredMint = new PublicKey(requirements.asset);
  const amount = BigInt(requirements.maxAmountRequired);


  // Get the user's token account for the required mint
  const senderTokenAddress = await getAssociatedTokenAddress(
    requiredMint,
    wallet.publicKey
  );

  // Check if user has the required token account and get balance
  let senderBalance = BigInt(0);
  try {
    const senderAccount = await getAccount(connection, senderTokenAddress);
    senderBalance = senderAccount.amount;
  } catch (error) {
    throw new Error(
      `Token account not found for required mint: ${requiredMint.toString()}. ` +
      `Please ensure you have this token in your wallet. ` +
      `You may need to receive some tokens first.`
    );
  }

  // Verify they have enough balance
  if (senderBalance < amount) {
    throw new Error(
      `Insufficient balance. Required: ${amount} (${Number(amount) / 1e6} tokens), ` +
      `Available: ${senderBalance} (${Number(senderBalance) / 1e6} tokens)`
    );
  }

  // Use the required mint from payment requirements
  const tokenMint = requiredMint;
  const recipientTokenAddress = await getAssociatedTokenAddress(
    tokenMint,
    recipientPubkey
  );

  // Check if recipient has a token account
  // According to x402 exact scheme spec, the transaction can include ATA creation if needed
  let recipientTokenAccountExists = false;
  try {
    await getAccount(connection, recipientTokenAddress);
    recipientTokenAccountExists = true;
  } catch (error) {
    recipientTokenAccountExists = false;
  }

  // Create payment transaction according to x402 exact scheme specification
  // The transaction MUST contain either 3 or 4 instructions in this exact order:
  // 1. Compute Budget: Set Compute Unit Limit
  // 2. Compute Budget: Set Compute Unit Price
  // 3. Optional: Associated Token Account Create (if destination ATA doesn't exist)
  // 4. SPL Token TransferChecked
  const transaction = new Transaction();

  // 1. Set Compute Unit Limit
  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200000, // Reasonable limit for token transfer
    })
  );

  // 2. Set Compute Unit Price (max 5 lamports per CU per spec)
  transaction.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1, // 1 microlamport = 0.000001 lamports per CU (well below 5 limit)
    })
  );

  // 3. Optional: Create recipient's token account if it doesn't exist
  if (!recipientTokenAccountExists) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        recipientTokenAddress, // associatedToken
        recipientPubkey, // owner
        tokenMint // mint
      )
    );
  }

  // 4. SPL Token TransferChecked (must use TransferChecked, not Transfer)
  const mintInfo = await getMint(connection, tokenMint);
  transaction.add(
    createTransferCheckedInstruction(
      senderTokenAddress, // source
      tokenMint, // mint
      recipientTokenAddress, // destination
      wallet.publicKey, // authority
      amount, // amount
      mintInfo.decimals // decimals
    )
  );

  // Verify transaction has correct number of instructions (3 or 4)
  const expectedInstructions = recipientTokenAccountExists ? 3 : 4;
  if (transaction.instructions.length !== expectedInstructions) {
    throw new Error(`Transaction must have ${expectedInstructions} instructions for exact scheme, but has ${transaction.instructions.length}`);
  }

  // CRITICAL: Fee payer MUST be set to facilitator's address from extra.feePayer
  // The facilitator can't "override" - it's baked into the transaction message
  // User will sign the transfer, facilitator will sign as fee payer during /settle
  if (!requirements.extra?.feePayer) {
    throw new Error("Payment requirements missing extra.feePayer (facilitator address)");
  }
  
  const facilitatorFeePayer = new PublicKey(requirements.extra.feePayer);
  transaction.feePayer = facilitatorFeePayer;

  // NOTE: Blockhash will be set right before signing to ensure it's fresh
  // Setting it here would make it stale by the time facilitator simulates it

  return transaction;
}

/**
 * Creates X-Payment header value from partially-signed transaction
 * 
 * According to x402 spec, the client sends the payment payload directly
 * as the X-Payment header. The resource server's middleware will handle
 * verification and settlement with the facilitator.
 */
function createXPaymentHeader(signedTransaction: Transaction, requirements: PaymentRequirements): string {
  // Serialize partially-signed transaction to base64
  // IMPORTANT: Transaction should be partially-signed (missing facilitator's fee payer signature)
  const serializedTx = signedTransaction.serialize({
    requireAllSignatures: false, // Partially-signed: facilitator will add its signature
    verifySignatures: false,
  });
  const base64Tx = Buffer.from(serializedTx).toString("base64");

  // Create payment payload according to x402 spec
  const paymentPayload: X402PaymentPayload = {
    x402Version: 1,
    scheme: requirements.scheme,
    network: requirements.network,
    payload: {
      transaction: base64Tx,
    },
  };

  // Base64-encode the payment payload for the X-Payment header
  // The middleware will decode this and forward to facilitator for verify/settle
  const xPaymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
  
  return xPaymentHeader;
}

/**
 * Wraps fetch with x402 payment handling for Solana
 */
export async function wrapFetchWithPaymentSolana(
  url: string,
  options: RequestInit = {},
  wallet: WalletContextState,
  connection: Connection,
  facilitatorUrl: string,
  apiUrl: string
): Promise<Response> {
  // Make initial request (should get 402 if unpaid)
  let response = await fetch(url, options);

  // If 402 Payment Required, handle payment flow
  if (response.status === 402) {
    try {
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Failed to parse 402 response as JSON`);
      }
      
      const requirements = data.accepts?.[0] || data.paymentRequirements;

      if (!requirements) {
        console.error("Invalid 402 response structure");
        throw new Error("Invalid 402 response: missing payment requirements");
      }
      
      // Validate that extra.feePayer exists
      if (!requirements.extra?.feePayer) {
        throw new Error("Payment requirements missing extra.feePayer (facilitator address required)");
      }

      // Check if wallet is connected
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected or does not support signing");
      }

      // Create payment transaction (partially-signed, facilitator will add fee payer signature)
      const transaction = await createPaymentTransaction(
        requirements,
        wallet,
        connection
      );

      // Get fresh blockhash right before signing to ensure it's not stale
      // This is critical - stale blockhashes cause simulation failures
      const { blockhash: freshBlockhash, lastValidBlockHeight: freshLastValidBlockHeight } = 
        await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = freshBlockhash;
      transaction.lastValidBlockHeight = freshLastValidBlockHeight;

      // Sign transaction with wallet - this creates a PARTIALLY-SIGNED transaction
      // The facilitator will add its fee payer signature during /settle
      const signedTransaction = await wallet.signTransaction(transaction);

      // DO NOT send transaction to network ourselves!
      // The facilitator will submit it via /settle after verification

      // Create X-Payment header from partially-signed transaction
      // The resource server's middleware will handle verification and settlement
      const xPaymentHeader = createXPaymentHeader(signedTransaction, requirements);
      
      // Retry original request with X-Payment header
      // The middleware will decode this, call facilitator /verify and /settle, then return 200
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "X-Payment": xPaymentHeader,
        },
      });
      
      // If successful, check for X-Payment-Response header with transaction signature
      if (response.status === 200) {
        let txSig: string | null = null;
        
        // First, try to get from X-Payment-Response header (if middleware sets it)
        const xPaymentResponse = response.headers.get("X-Payment-Response");
        if (xPaymentResponse) {
          try {
            const paymentResponse = JSON.parse(
              Buffer.from(xPaymentResponse, "base64").toString("utf-8")
            );
            txSig = paymentResponse.transaction;
          } catch (e) {
            // Payment successful but couldn't parse header
          }
        }
        
        // If no header, try to get signature by polling the network
        // The facilitator submits the transaction, so we can find it in recent transactions
        if (!txSig && wallet.publicKey && requirements.payTo) {
          try {
            const recipientPubkey = new PublicKey(requirements.payTo);
            const amount = BigInt(requirements.maxAmountRequired);
            
            // Poll for the transaction signature
            txSig = await findTransactionSignature(
              connection,
              wallet.publicKey,
              recipientPubkey,
              amount,
              5 // Try 5 times with 1 second intervals
            );
          } catch (e) {
            console.error("Error polling for transaction signature");
          }
        }
        
        // Store txSig in a custom header or return it somehow
        // We'll attach it to the response object for the caller to use
        // IMPORTANT: Clone the response body before reading it, so the caller can also read it
        const responseClone = response.clone();
        const responseBody = await response.text();
        
        if (txSig) {
          // Create a new response with the txSig in a custom header
          const newHeaders = new Headers(response.headers);
          newHeaders.set("X-Transaction-Signature", txSig);
          response = new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        } else {
          // Even without txSig, recreate response so body can be read
          response = new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
      }
      
      // If still 402, log the response to see what's wrong
      if (response.status === 402) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Payment verification failed");
        
        // Provide more detailed error message based on facilitator error
        const errorMsg = errorData.error || "Unknown error";
        if (errorMsg.includes("simulation_failed") || errorMsg.includes("transaction_simulation")) {
          throw new Error(
            `Transaction simulation failed: ${errorMsg}\n\n` +
            "Possible causes:\n" +
            "1. Blockhash is stale (should be fixed with fresh blockhash)\n" +
            "2. Transaction structure doesn't match facilitator expectations\n" +
            "3. Required accounts don't exist or are invalid\n" +
            "4. Network/RPC issues\n\n" +
            "Try again - the fresh blockhash should help."
          );
        }
        
        throw new Error(`Payment verification failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Payment flow error");
      throw error;
    }
  } else if (response.status !== 200) {
    // Not a 402 or 200 - handle error response
    try {
      const responseText = await response.text();
      // Recreate response so it can be read again
      response = new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (e) {
      console.error("Could not read response body");
    }
  }

  return response;
}

