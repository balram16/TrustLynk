"use client"

import React from "react"

// MetaMask wallet is a browser extension, no provider wrapper needed
// We use ethers.js directly in the wallet context

interface WalletProviderProps {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  return <>{children}</>
}
