"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, Heart, Car, Home, Plane, User } from "lucide-react"

interface NFTInfoDialogProps {
  open: boolean
  onClose: () => void
  contractAddress: string
  tokenId: string
  policyTitle: string
  policyType: string
  purchaseDate?: string
  coverageAmount?: string
  premiumPaid?: string
  walletAddress?: string
}

const typeColors: Record<string, string> = {
  Health: "from-rose-500 to-pink-600",
  Life: "from-blue-500 to-indigo-600",
  Auto: "from-emerald-500 to-teal-600",
  Home: "from-amber-500 to-orange-600",
  Travel: "from-purple-500 to-violet-600",
  default: "from-[#fa6724] to-[#e55613]",
}

const typeIcons: Record<string, React.ReactNode> = {
  Health: <Heart className="h-8 w-8 text-white" />,
  Life: <User className="h-8 w-8 text-white" />,
  Auto: <Car className="h-8 w-8 text-white" />,
  Home: <Home className="h-8 w-8 text-white" />,
  Travel: <Plane className="h-8 w-8 text-white" />,
  default: <Shield className="h-8 w-8 text-white" />,
}

export function NFTInfoDialog({
  open,
  onClose,
  contractAddress,
  tokenId,
  policyTitle,
  policyType,
  purchaseDate,
  coverageAmount,
  premiumPaid,
  walletAddress,
}: NFTInfoDialogProps) {
  const gradient = typeColors[policyType] || typeColors.default
  const icon = typeIcons[policyType] || typeIcons.default

  const handleImportToMetaMask = async () => {
    if (!window.ethereum) return

    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC721",
          options: {
            address: contractAddress,
            tokenId: tokenId,
          },
        },
      })

      if (wasAdded) {
        console.log("NFT added to MetaMask successfully!")
      }
    } catch (error) {
      console.error("Error adding NFT to MetaMask:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-0">
        {/* NFT Card Header */}
        <div className={`bg-gradient-to-br ${gradient} p-6 text-white relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                {icon}
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                🔗 On-Chain
              </Badge>
            </div>

            <h2 className="text-xl font-bold mb-1">{policyTitle}</h2>
            <p className="text-white/70 text-sm">{policyType} Insurance Certificate</p>

            <div className="mt-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-300" />
              <span className="text-sm text-white/90 font-medium">Blockchain Verified</span>
            </div>
          </div>
        </div>

        {/* NFT Details */}
        <div className="p-5 space-y-4 bg-card">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">TrustLynk Policy NFT</p>
            <p className="text-2xl font-bold font-mono text-foreground">#{tokenId}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {coverageAmount && (
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Coverage</p>
                <p className="font-semibold truncate">{coverageAmount}</p>
              </div>
            )}
            {premiumPaid && (
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Premium Paid</p>
                <p className="font-semibold truncate">{premiumPaid}</p>
              </div>
            )}
            {purchaseDate && (
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Issued On</p>
                <p className="font-semibold">{new Date(purchaseDate).toLocaleDateString()}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Network</p>
              <p className="font-semibold">⛓ Hardhat</p>
            </div>
          </div>

          {/* Contract Info */}
          <div className="bg-muted/30 rounded-xl p-3 space-y-2 border border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
              <p className="text-xs font-mono text-foreground break-all">{contractAddress}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Token ID</p>
              <p className="text-xs font-mono font-bold text-foreground">{tokenId}</p>
            </div>
            {walletAddress && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Owner</p>
                <p className="text-xs font-mono text-foreground truncate">{walletAddress}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This certificate is stored immutably on the blockchain.
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={handleImportToMetaMask} variant="outline" className="w-full flex items-center justify-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="h-4 w-4" />
              Add to MetaMask Wallet
            </Button>
            <Button onClick={onClose} className={`w-full bg-gradient-to-r ${gradient} text-white hover:opacity-90`}>
              Close Certificate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
