import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferCheckedInstruction, getAccount, createAssociatedTokenAccountInstruction, getMint } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";

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

  console.log(`Payment requires mint: ${requiredMint.toString()}, amount: ${amount}`);

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
    console.log(`Found token account. Mint: ${requiredMint.toString()}, Balance: ${senderBalance}, Required: ${amount}`);
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
    console.log("Recipient token account exists");
  } catch (error) {
    recipientTokenAccountExists = false;
    console.log("Recipient token account doesn't exist, will create in transaction");
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
  console.log(`Transaction has ${transaction.instructions.length} instruction(s), expected ${expectedInstructions}`);
  if (transaction.instructions.length !== expectedInstructions) {
    throw new Error(`Transaction must have ${expectedInstructions} instructions for exact scheme, but has ${transaction.instructions.length}`);
  }

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  
  // CRITICAL: Fee payer MUST be set to facilitator's address from extra.feePayer
  // The facilitator can't "override" - it's baked into the transaction message
  // User will sign the transfer, facilitator will sign as fee payer during /settle
  if (!requirements.extra?.feePayer) {
    throw new Error("Payment requirements missing extra.feePayer (facilitator address)");
  }
  
  const facilitatorFeePayer = new PublicKey(requirements.extra.feePayer);
  transaction.feePayer = facilitatorFeePayer;
  console.log("Fee payer set to facilitator:", facilitatorFeePayer.toString());

  // Log transaction details before returning
  console.log("Transaction details:", {
    instructions: transaction.instructions.length,
    feePayer: transaction.feePayer?.toString(),
    recentBlockhash: transaction.recentBlockhash,
  });

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
  
  console.log("Serialized transaction length:", serializedTx.length);
  console.log("Base64 transaction (first 200 chars):", base64Tx.substring(0, 200));

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
  console.log("Created X-Payment header (first 100 chars):", xPaymentHeader.substring(0, 100));
  
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
  // Make initial request
  let response = await fetch(url, options);

  // If 402 Payment Required, handle payment flow
  if (response.status === 402) {
    console.log("Received 402 Payment Required, starting payment flow...");
    
    try {
      const data = await response.json();
      const requirements = data.accepts?.[0] || data.paymentRequirements;

      if (!requirements) {
        throw new Error("Invalid 402 response: missing payment requirements");
      }

      console.log("Payment requirements:", requirements);
      console.log("Payment requirements.extra:", requirements.extra);
      
      // Validate that extra.feePayer exists
      if (!requirements.extra?.feePayer) {
        throw new Error("Payment requirements missing extra.feePayer (facilitator address required)");
      }

      // Check if wallet is connected
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected or does not support signing");
      }

      console.log("Creating payment transaction...");
      // Create payment transaction (partially-signed, facilitator will add fee payer signature)
      const transaction = await createPaymentTransaction(
        requirements,
        wallet,
        connection
      );

      console.log("Signing transaction with wallet (partially-signed)...");
      // Sign transaction with wallet - this creates a PARTIALLY-SIGNED transaction
      // The facilitator will add its fee payer signature during /settle
      const signedTransaction = await wallet.signTransaction(transaction);

      // DO NOT send transaction to network ourselves!
      // The facilitator will submit it via /settle after verification
      console.log("Transaction signed (partially). NOT sending to network - facilitator will handle submission.");

      // Create X-Payment header from partially-signed transaction
      // The resource server's middleware will handle verification and settlement
      const xPaymentHeader = createXPaymentHeader(signedTransaction, requirements);

      console.log("Created X-Payment header, retrying request...");
      console.log("X-Payment header (first 100 chars):", xPaymentHeader.substring(0, 100));
      
      // Retry original request with X-Payment header
      // The middleware will decode this, call facilitator /verify and /settle, then return 200
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "X-Payment": xPaymentHeader,
        },
      });
      
      console.log(`Retry response status: ${response.status}`);
      
      // If successful, check for X-Payment-Response header with transaction signature
      if (response.status === 200) {
        const xPaymentResponse = response.headers.get("X-Payment-Response");
        if (xPaymentResponse) {
          try {
            const paymentResponse = JSON.parse(
              Buffer.from(xPaymentResponse, "base64").toString("utf-8")
            );
            console.log("✅ Payment successful! Transaction details:", {
              signature: paymentResponse.transaction,
              network: paymentResponse.network,
              payer: paymentResponse.payer,
            });
            console.log(`🔗 View on Solana Explorer: https://explorer.solana.com/tx/${paymentResponse.transaction}?cluster=devnet`);
          } catch (e) {
            console.log("Payment successful, but couldn't parse X-Payment-Response header");
          }
        } else {
          console.log("✅ Payment successful! (No X-Payment-Response header found)");
        }
      }
      
      // If still 402, log the response to see what's wrong
      if (response.status === 402) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Still getting 402 after payment. Response:", errorData);
        throw new Error("Payment verification failed. The X-Payment header was not accepted by the server.");
      }
    } catch (error) {
      console.error("Error in payment flow:", error);
      throw error;
    }
  }

  return response;
}

