"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import "@solana/wallet-adapter-react-ui/styles.css";

const FACILITATOR_URL = process.env.NEXT_PUBLIC_FACILITATOR_URL || "https://facilitator.payai.network";
const NETWORK = (process.env.NEXT_PUBLIC_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet;
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(NETWORK);

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
            <Navbar />
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-start justify-center px-4 sm:px-6 py-8 min-h-full">
                <div className="w-full max-w-4xl">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

