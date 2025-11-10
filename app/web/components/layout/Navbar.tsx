"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { XPDisplay } from "@/components/quiz/XPDisplay";

export function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 h-16 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-neutral-900">
      <div className="container mx-auto px-4 sm:px-6 h-full flex items-center justify-between max-w-7xl">
        {/* Left: Brand */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-200 font-mono text-lg font-semibold tracking-tight">
            CoinRush
          </span>
        </div>

        {/* Center: XP Display */}
        <div className="flex items-center">
          <XPDisplay />
        </div>

        {/* Right: Wallet */}
        <div className="flex items-center">
          {mounted ? (
            <WalletMultiButton className="!bg-neutral-900 hover:!bg-neutral-800 !text-neutral-100 !border-neutral-800 !rounded-lg" />
          ) : (
            <div className="h-10 w-32 bg-neutral-900 rounded-lg animate-pulse" />
          )}
        </div>
      </div>
    </nav>
  );
}

