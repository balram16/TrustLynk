"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { 
  getAllClaims,
  getClaimStatusString,
  getClaimStatusColor,
  CLAIM_STATUS_APPROVED,
  CLAIM_STATUS_PENDING,
  CLAIM_STATUS_REJECTED,
  convertXLMToINR
} from "@/lib/blockchain"

export const dynamic = 'force-dynamic'

export default function ClaimPaymentsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { walletAddress, userRole } = useFreighterWallet()
  const { toast } = useToast()

  useEffect(() => {
    if (walletAddress && userRole === 'provider') {
      fetchClaims()
    }
  }, [walletAddress, userRole])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching claim payments from blockchain...")
      const blockchainClaims = await getAllClaims()
      
      const mappedClaims = blockchainClaims.map((c: any) => ({
        claim_id: c.claim_id,
        policy_id: c.policy_id,
        user_address: c.user_address,
        claim_amount: parseInt(c.claim_amount),
        claim_amount_inr: convertXLMToINR(parseInt(c.claim_amount)),
        aggregate_score: Number(c.aggregate_score),
        status: Number(c.status),
        status_string: getClaimStatusString(Number(c.status)),
        claimed_at: c.claimed_at,
        processed_at: c.processed_at,
      }))
      
      setClaims(mappedClaims)
      console.log("✅ Claim payments loaded from blockchain")
    } catch (error) {
      console.error("❌ Error fetching claim payments:", error)
      toast({
        title: "Error",
        description: "Failed to load claim payments from blockchain",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = {
    totalApproved: claims.filter(c => c.status === CLAIM_STATUS_APPROVED).length,
    totalPaid: claims
      .filter(c => c.status === CLAIM_STATUS_APPROVED)
      .reduce((sum, c) => sum + c.claim_amount_inr, 0),
    pendingApprovals: claims.filter(c => c.status === CLAIM_STATUS_PENDING).length,
    avgPayment: claims.filter(c => c.status === CLAIM_STATUS_APPROVED).length > 0
      ? Math.round(claims
          .filter(c => c.status === CLAIM_STATUS_APPROVED)
          .reduce((sum, c) => sum + c.claim_amount_inr, 0) / 
          claims.filter(c => c.status === CLAIM_STATUS_APPROVED).length)
      : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-lg">Loading payments from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Claim Payments</h1>
          <p className="text-muted-foreground">
            Automated payments processed by smart contracts
          </p>
        </div>
        <Button onClick={fetchClaims} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApproved}</div>
            <p className="text-xs text-muted-foreground">Auto-paid by contract</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{stats.totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Via smart contract</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.avgPayment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per claim</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Automated Smart Contract Payments</h3>
              <p className="text-sm text-blue-700">
                All approved claims are automatically paid by the smart contract. When a claim's fraud score is ≤ 30, 
                the contract instantly transfers funds to the claimant's wallet. No manual intervention needed!
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>How it works:</strong> Smart contract holds funds in escrow → Claim submitted → AI evaluates fraud score 
                → If approved (score ≤ 30) → Instant XLM transfer → User receives payment on-chain ✅
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments (Approved Claims)</CardTitle>
        </CardHeader>
        <CardContent>
          {claims.filter(c => c.status === CLAIM_STATUS_APPROVED).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No approved payments yet</p>
              <p className="text-sm mt-2">Approved claims will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims
                .filter(c => c.status === CLAIM_STATUS_APPROVED)
                .slice(0, 10)
                .map((claim) => (
                  <div key={claim.claim_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Claim #{claim.claim_id}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {claim.user_address.slice(0, 20)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-green-600">
                        ₹{claim.claim_amount_inr.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {claim.processed_at 
                          ? new Date(parseInt(claim.processed_at) * 1000).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Auto-Paid ✅
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {stats.pendingApprovals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals ({stats.pendingApprovals})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {claims
                .filter(c => c.status === CLAIM_STATUS_PENDING)
                .map((claim) => (
                  <div key={claim.claim_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Claim #{claim.claim_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Fraud Score: {claim.aggregate_score}/100
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ₹{claim.claim_amount_inr.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Approve & Pay
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

