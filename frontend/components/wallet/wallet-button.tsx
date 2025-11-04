"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { Wallet, LogOut, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface WalletButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function WalletButton({ className, variant = "default", size = "default" }: WalletButtonProps) {
  const { isConnected, walletAddress, connectWallet, disconnectWallet, isLoading, userRole } = useFreighterWallet()

  const formatAddress = (addr?: string | null) => {
    if (!addr || addr.length < 8) return addr || ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getRoleBadge = () => {
    switch (userRole) {
      case 'provider':
        return <Badge className="ml-2 bg-[#fa6724]">Provider</Badge>
      case 'holder':
        return <Badge className="ml-2 bg-[#07a6ec]">Holder</Badge>
      default:
        return null
    }
  }

  if (isConnected && walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={disconnectWallet}
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          {formatAddress(walletAddress)}
        </Button>
        {getRoleBadge()}
      </div>
    )
  }

  return (
    <Button
      onClick={connectWallet}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4 mr-2" />
      )}
      Connect Freighter Wallet
    </Button>
  )
}


