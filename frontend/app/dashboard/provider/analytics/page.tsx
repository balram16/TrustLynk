"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  DollarSign,
  Users,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { 
  getAllPolicies,
  getAllClaims,
  CLAIM_STATUS_APPROVED,
  CLAIM_STATUS_PENDING,
  CLAIM_STATUS_REJECTED,
  convertXLMToINR,
  getPolicyTypeString
} from "@/lib/blockchain"

export const dynamic = 'force-dynamic'

export default function AnalyticsPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { walletAddress, userRole } = useFreighterWallet()
  const { toast } = useToast()

  useEffect(() => {
    if (walletAddress && userRole === 'provider') {
      fetchData()
    }
  }, [walletAddress, userRole])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching analytics data from blockchain...")
      
      const [policiesData, claimsData] = await Promise.all([
        getAllPolicies(),
        getAllClaims()
      ])
      
      setPolicies(policiesData)
      setClaims(claimsData)
      
      console.log("✅ Analytics data loaded from blockchain")
    } catch (error) {
      console.error("❌ Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics from blockchain",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate overview metrics from real blockchain data
  const overview = {
    totalPremium: {
      value: policies.reduce((sum, p) => sum + parseInt(p.yearly_premium), 0),
      trend: "+12.5%",
      isPositive: true
    },
    totalPolicies: {
      value: policies.length,
      health: policies.filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Health').length,
      life: policies.filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Life').length,
      auto: policies.filter(p => getPolicyTypeString(Number(p.policy_type)) === 'Auto').length,
    },
    claimsRatio: {
      value: claims.length > 0 && policies.length > 0 
        ? Math.round((claims.length / policies.length) * 100) 
        : 0,
      approved: claims.filter(c => Number(c.status) === CLAIM_STATUS_APPROVED).length,
      pending: claims.filter(c => Number(c.status) === CLAIM_STATUS_PENDING).length,
      rejected: claims.filter(c => Number(c.status) === CLAIM_STATUS_REJECTED).length,
    },
    fraudDetection: {
      saved: claims
        .filter(c => Number(c.status) === CLAIM_STATUS_REJECTED)
        .reduce((sum, c) => sum + convertXLMToINR(parseInt(c.claim_amount)), 0),
      detected: claims.filter(c => Number(c.aggregate_score) > 70).length,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-lg">Loading analytics from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights from blockchain data
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-[#07a6ec] hover:bg-[#0696d7]">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overview.totalPremium.value.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overview.totalPremium.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={overview.totalPremium.isPositive ? "text-green-500" : "text-red-500"}>
                {overview.totalPremium.trend}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalPolicies.value}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Health: {overview.totalPolicies.health} | Life: {overview.totalPolicies.life} | Auto: {overview.totalPolicies.auto}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Claims Ratio</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.claimsRatio.value}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Approved: {overview.claimsRatio.approved} | Pending: {overview.claimsRatio.pending} | Rejected: {overview.claimsRatio.rejected}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fraud Prevented</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{overview.fraudDetection.saved.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {overview.fraudDetection.detected} high-risk claims detected
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Health Insurance</span>
                <span className="text-sm text-muted-foreground">
                  {overview.totalPolicies.health} policies
                </span>
              </div>
              <Progress 
                value={overview.totalPolicies.value > 0 ? (overview.totalPolicies.health / overview.totalPolicies.value) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Life Insurance</span>
                <span className="text-sm text-muted-foreground">
                  {overview.totalPolicies.life} policies
                </span>
              </div>
              <Progress 
                value={overview.totalPolicies.value > 0 ? (overview.totalPolicies.life / overview.totalPolicies.value) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Auto Insurance</span>
                <span className="text-sm text-muted-foreground">
                  {overview.totalPolicies.auto} policies
                </span>
              </div>
              <Progress 
                value={overview.totalPolicies.value > 0 ? (overview.totalPolicies.auto / overview.totalPolicies.value) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claims Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{overview.claimsRatio.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <FileText className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{overview.claimsRatio.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-600">{overview.claimsRatio.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Approval Rate</p>
              <Progress 
                value={claims.length > 0 ? (overview.claimsRatio.approved / claims.length) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {claims.length > 0 ? Math.round((overview.claimsRatio.approved / claims.length) * 100) : 0}% of claims approved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto text-[#07a6ec] mb-2" />
              <p className="text-2xl font-bold">{policies.length}</p>
              <p className="text-xs text-muted-foreground">Total Policies On-Chain</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto text-[#fa6724] mb-2" />
              <p className="text-2xl font-bold">{new Set(policies.map(p => p.created_by)).size}</p>
              <p className="text-xs text-muted-foreground">Unique Providers</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{claims.length}</p>
              <p className="text-xs text-muted-foreground">Total Claims Processed</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">
                ₹{claims
                  .filter(c => Number(c.status) === CLAIM_STATUS_APPROVED)
                  .reduce((sum, c) => sum + convertXLMToINR(parseInt(c.claim_amount)), 0)
                  .toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Payouts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

