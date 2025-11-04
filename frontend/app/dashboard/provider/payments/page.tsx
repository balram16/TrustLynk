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
  Wallet,
  TrendingUp
} from "lucide-react"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { 
  getAllPolicies,
  convertXLMToINR,
  getPolicyTypeString
} from "@/lib/blockchain"

export const dynamic = 'force-dynamic'

export default function PaymentsPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { walletAddress, userRole } = useFreighterWallet()
  const { toast } = useToast()

  useEffect(() => {
    if (walletAddress && userRole === 'provider') {
      fetchPolicies()
    }
  }, [walletAddress, userRole])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching payment data from blockchain...")
      const blockchainPolicies = await getAllPolicies()
      
      setPolicies(blockchainPolicies)
      console.log("✅ Payment data loaded from blockchain")
    } catch (error) {
      console.error("❌ Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payment data from blockchain",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real blockchain data
  const stats = {
    totalCollected: policies.reduce((sum, p) => sum + parseInt(p.yearly_premium), 0),
    totalPolicies: policies.length,
    avgPremium: policies.length > 0 
      ? Math.round(policies.reduce((sum, p) => sum + parseInt(p.yearly_premium), 0) / policies.length)
      : 0,
    byType: {
      health: policies
        .filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Health')
        .reduce((sum, p) => sum + parseInt(p.yearly_premium), 0),
      life: policies
        .filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Life')
        .reduce((sum, p) => sum + parseInt(p.yearly_premium), 0),
      auto: policies
        .filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Auto')
        .reduce((sum, p) => sum + parseInt(p.yearly_premium), 0),
    }
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
          <h1 className="text-3xl font-bold">Premium Payments</h1>
          <p className="text-muted-foreground">
            All payments processed via XLM on Stellar blockchain
          </p>
        </div>
        <Button onClick={fetchPolicies} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{stats.totalCollected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Yearly premiums</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">Generating premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.avgPremium.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per policy/year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">XLM</div>
            <p className="text-xs text-muted-foreground">Stellar blockchain</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Premium by Policy Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Health Insurance</span>
                <Badge className="bg-red-100 text-red-800">Health</Badge>
              </div>
              <p className="text-2xl font-bold">₹{stats.byType.health.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {policies.filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Health').length} policies
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Life Insurance</span>
                <Badge className="bg-blue-100 text-blue-800">Life</Badge>
              </div>
              <p className="text-2xl font-bold">₹{stats.byType.life.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {policies.filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Life').length} policies
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Auto Insurance</span>
                <Badge className="bg-green-100 text-green-800">Auto</Badge>
              </div>
              <p className="text-2xl font-bold">₹{stats.byType.auto.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {policies.filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Auto').length} policies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Wallet className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Blockchain-Based Payments</h3>
              <p className="text-sm text-blue-700">
                All premium payments are processed directly on the Stellar blockchain using XLM (Stellar Lumens). 
                When users purchase a policy, they pay the premium in XLM which is automatically converted from INR.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Benefits:</strong> Instant settlement • Transparent transactions • No intermediaries • 
                Automated escrow • Immutable payment records on-chain ✅
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Policy Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No policies purchased yet</p>
              <p className="text-sm mt-2">Policy purchases will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {policies.slice(0, 10).map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{policy.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Policy #{policy.id} • {getPolicyTypeString(Number(policy.policy_type))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      ₹{parseInt(policy.yearly_premium).toLocaleString()}/year
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₹{parseInt(policy.monthly_premium).toLocaleString()}/month
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

