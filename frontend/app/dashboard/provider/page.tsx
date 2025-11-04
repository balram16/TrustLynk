"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { WelcomeModal } from "@/components/provider/welcome-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Shield,
  FileText,
  ArrowUpRight,
  MessageCircle,
  Loader2,
  CreditCard,
  RefreshCw,
  Calendar,
  Activity,
  Sparkles,
  History,
  Settings,
  LogOut,
  UserCog,
  Receipt,
  Calculator,
  List,
  Brain,
  Target,
  RotateCcw,
} from "lucide-react"
import { 
  getAllPolicies, 
  getAllClaims,
  convertXLMToINR,
  formatXLM,
  BlockchainPolicy,
  PolicyClaim,
  getPolicyTypeString,
  CONTRACT_ID,
} from "@/lib/blockchain"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { toast } from "sonner"

// Claim status constants
const CLAIM_STATUS_APPROVED = 1
const CLAIM_STATUS_PENDING = 2
const CLAIM_STATUS_REJECTED = 3

export const dynamic = 'force-dynamic'

export default function ProviderDashboardPage() {
  const [activeTab, setActiveTab] = useState("analytics")
  const [showAssistant, setShowAssistant] = useState(false)
  const [isNewUser, setIsNewUser] = useState(true)
  
  // Real-time data states
  const [policies, setPolicies] = useState<BlockchainPolicy[]>([])
  const [claims, setClaims] = useState<PolicyClaim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [metrics, setMetrics] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalPolicies: 0,
    totalPolicyholders: 0,
    totalPremiumCollected: 0,
    totalClaimsPaid: 0,
  })

  const { walletAddress, disconnectWallet } = useFreighterWallet()

  // Fetch all real-time data
  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch policies and claims in parallel
      const [policiesData, claimsData] = await Promise.all([
        getAllPolicies(),
        getAllClaims(),
      ])

      setPolicies(policiesData)
      setClaims(claimsData)
      setLastRefresh(new Date())

      // Calculate metrics from real data
      const pendingClaims = claimsData.filter(c => c.status === CLAIM_STATUS_PENDING).length
      const approvedClaims = claimsData.filter(c => c.status === CLAIM_STATUS_APPROVED).length
      const rejectedClaims = claimsData.filter(c => c.status === CLAIM_STATUS_REJECTED).length

      // Get unique policyholders
      const uniquePolicyholders = new Set(claimsData.map(c => c.user_address)).size

      // Calculate financial metrics
      const totalClaimsPaid = claimsData
        .filter(c => c.status === CLAIM_STATUS_APPROVED)
        .reduce((sum, c) => sum + convertXLMToINR(parseInt(c.claim_amount)), 0)

      setMetrics({
        totalClaims: claimsData.length,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalPolicies: policiesData.length,
        totalPolicyholders: uniquePolicyholders,
        totalPremiumCollected: 0, // Will be calculated from policy purchases
        totalClaimsPaid,
      })

    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  // Get recent claims (last 5)
  const recentClaims = claims
    .sort((a, b) => parseInt(b.claimed_at) - parseInt(a.claimed_at))
    .slice(0, 5)

  // Get high-risk claims (fraud alerts)
  const fraudAlerts = claims
    .filter(c => c.aggregate_score < 70 && c.status === CLAIM_STATUS_PENDING)
    .sort((a, b) => a.aggregate_score - b.aggregate_score)
    .slice(0, 5)

  // Function to get Claim Saathi's expression based on context
  const getAssistantImage = (context: string) => {
    switch (context) {
      case "fraud":
        return "https://i.ibb.co/Z7MhTHj/claimsaathi-neutral-mildlyangry.png"
      case "success":
        return "https://i.ibb.co/DgLw71WX/claimsaathi-happy-tooexcited-smilingwithopenmouth.png"
      case "warning":
        return "https://i.ibb.co/ZRq6hPFn/claimsaathi-angry-shouting.png"
      case "chat":
        return "https://i.ibb.co/JFW8D5KV/claimsaathi-goodmood-happy.png"
      default:
        return "https://i.ibb.co/XZP3h1bN/claimsaathi-neutral-firm.png"
    }
  }

  const getClaimStatus = (status: number) => {
    switch (status) {
      case CLAIM_STATUS_APPROVED:
        return { text: "Approved", icon: CheckCircle, color: "text-green-500" }
      case CLAIM_STATUS_PENDING:
        return { text: "Pending", icon: Clock, color: "text-yellow-500" }
      case CLAIM_STATUS_REJECTED:
        return { text: "Rejected", icon: XCircle, color: "text-red-500" }
      default:
        return { text: "Unknown", icon: AlertTriangle, color: "text-gray-500" }
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "Low", color: "bg-green-100 text-green-700" }
    if (score >= 60) return { level: "Medium", color: "bg-yellow-100 text-yellow-700" }
    return { level: "High", color: "bg-red-100 text-red-700" }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#07a6ec]" />
          <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isNewUser && <WelcomeModal />}
      
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={getAssistantImage(activeTab)}
              alt="Claim Saathi"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold">Provider Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor claims, detect fraud, and manage policies in real-time
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={loadDashboardData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpRight className="mr-2 h-4 w-4" />
              )}
              Refresh Data
            </Button>
            <Button 
              className="bg-[#07a6ec] hover:bg-[#0696d7]"
              onClick={() => setShowAssistant(true)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Ask Claim Saathi
            </Button>
          </div>
        </div>

        {/* Key Metrics - Real-time data */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                  <h3 className="text-2xl font-bold">{metrics.totalClaims}</h3>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.approvedClaims} approved, {metrics.rejectedClaims} rejected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Claims</p>
                  <h3 className="text-2xl font-bold">{metrics.pendingClaims}</h3>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fraud Alerts</p>
                  <h3 className="text-2xl font-bold">{fraudAlerts.length}</h3>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                High-risk claims detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                  <h3 className="text-2xl font-bold">{metrics.totalPolicies}</h3>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalPolicyholders} active policyholders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs 
          defaultValue="overview" 
          className="space-y-6"
          onValueChange={(value) => {
            setActiveTab(value)
          }}
        >
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="claims">
              <FileText className="h-4 w-4 mr-2" />
              Claims
            </TabsTrigger>
            <TabsTrigger value="claim-payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Claim Payments
            </TabsTrigger>
            <TabsTrigger value="payments">
              <Receipt className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="policies">
              <Shield className="h-4 w-4 mr-2" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="premium-recalc">
              <Calculator className="h-4 w-4 mr-2" />
              Premium Recalc
            </TabsTrigger>
            <TabsTrigger value="queue">
              <List className="h-4 w-4 mr-2" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="ai-insights">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="risk-analysis">
              <Target className="h-4 w-4 mr-2" />
              Risk Analysis
            </TabsTrigger>
            <TabsTrigger value="renewals">
              <RotateCcw className="h-4 w-4 mr-2" />
              Renewals
            </TabsTrigger>
            <TabsTrigger value="team">
              <UserCog className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <h3 className="text-2xl font-bold">
                        ₹{metrics.totalClaimsPaid.toLocaleString()}
                      </h3>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    From {metrics.approvedClaims} approved claims
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                      <h3 className="text-2xl font-bold">
                        {metrics.totalClaims > 0 
                          ? Math.round((metrics.approvedClaims / metrics.totalClaims) * 100) 
                          : 0}%
                      </h3>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics.approvedClaims} of {metrics.totalClaims} claims
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fraud Rate</p>
                      <h3 className="text-2xl font-bold">
                        {claims.length > 0 
                          ? Math.round((fraudAlerts.length / claims.length) * 100) 
                          : 0}%
                      </h3>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {fraudAlerts.length} high-risk claims detected
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Processing Time</p>
                      <h3 className="text-2xl font-bold">2.3d</h3>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Average claim resolution time
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Real-Time Blockchain Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Claims Processed Today</p>
                      <span className="text-sm font-bold">
                        {claims.filter(c => {
                          const claimDate = new Date(parseInt(c.claimed_at) * 1000)
                          const today = new Date()
                          return claimDate.toDateString() === today.toDateString()
                        }).length}
                      </span>
                    </div>
                    <Progress 
                      value={claims.length > 0 ? (claims.filter(c => {
                        const claimDate = new Date(parseInt(c.claimed_at) * 1000)
                        const today = new Date()
                        return claimDate.toDateString() === today.toDateString()
                      }).length / claims.length) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Active Policies</p>
                      <span className="text-sm font-bold">{policies.length}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Platform Health Score</p>
                      <span className="text-sm font-bold">
                        {claims.length > 0 
                          ? Math.round(claims.reduce((sum, c) => sum + c.aggregate_score, 0) / claims.length)
                          : 100}%
                      </span>
                    </div>
                    <Progress 
                      value={claims.length > 0 
                        ? claims.reduce((sum, c) => sum + c.aggregate_score, 0) / claims.length
                        : 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Claims ({claims.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {claims.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No claims submitted yet</p>
                    <p className="text-sm">Claims will appear here once policyholders submit them</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims
                      .sort((a, b) => parseInt(b.claimed_at) - parseInt(a.claimed_at))
                      .map((claim) => {
                        const statusInfo = getClaimStatus(claim.status)
                        const StatusIcon = statusInfo.icon
                        const riskInfo = getRiskLevel(claim.aggregate_score)
                        
                        return (
                          <div key={claim.claim_id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Claim ID</p>
                                <p className="font-medium">#{claim.claim_id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Policy ID</p>
                                <p className="font-medium">#{claim.policy_id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className="font-medium">₹{convertXLMToINR(parseInt(claim.claim_amount)).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <div className="flex items-center">
                                  <StatusIcon className={`h-3 w-3 ${statusInfo.color} mr-1`} />
                                  <span className="text-sm">{statusInfo.text}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Risk Score</p>
                                <span className={`px-2 py-1 rounded-full text-xs ${riskInfo.color}`}>
                                  {claim.aggregate_score}% - {riskInfo.level}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Submitted</p>
                                <p className="text-sm">{new Date(parseInt(claim.claimed_at) * 1000).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claim Payments Tab */}
          <TabsContent value="claim-payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Approved Claim Payments ({metrics.approvedClaims})</CardTitle>
              </CardHeader>
              <CardContent>
                {claims.filter(c => c.status === CLAIM_STATUS_APPROVED).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No payments processed yet</p>
                    <p className="text-sm">Approved claims will show payment details here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims
                      .filter(c => c.status === CLAIM_STATUS_APPROVED)
                      .sort((a, b) => parseInt(b.claimed_at) - parseInt(a.claimed_at))
                      .map((claim) => (
                        <div key={claim.claim_id} className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Claim ID</p>
                              <p className="font-medium">#{claim.claim_id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Policy ID</p>
                              <p className="font-medium">#{claim.policy_id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Payment Amount</p>
                              <p className="font-bold text-green-600">
                                ₹{convertXLMToINR(parseInt(claim.claim_amount)).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">User Address</p>
                              <p className="font-mono text-xs">{claim.user_address.slice(0, 12)}...</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Paid On</p>
                              <p className="text-sm">{new Date(parseInt(claim.claimed_at) * 1000).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Payment Processed</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{metrics.totalClaimsPaid.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{metrics.approvedClaims}</p>
                    <p className="text-sm text-muted-foreground">Payments Made</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">
                      ₹{metrics.approvedClaims > 0 
                        ? Math.round(metrics.totalClaimsPaid / metrics.approvedClaims).toLocaleString() 
                        : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Payment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Premium Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Premium payment tracking coming soon</p>
                  <p className="text-sm">Track all premium collections from blockchain</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Policies ({policies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {policies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No policies created yet</p>
                    <p className="text-sm">Policies will appear here from blockchain</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {policies.map((policy) => (
                      <div key={policy.policy_id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Policy ID</p>
                            <p className="font-medium">#{policy.policy_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p className="font-medium">{getPolicyTypeString(policy.policy_type)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Premium</p>
                            <p className="font-medium">₹{convertXLMToINR(parseInt(policy.monthly_premium)).toLocaleString()}/mo</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Coverage</p>
                            <p className="font-medium">₹{convertXLMToINR(parseInt(policy.coverage_amount)).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Premium Recalculation Tab */}
          <TabsContent value="premium-recalc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Premium Recalculation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">AI-powered premium recalculation</p>
                  <p className="text-sm">Based on real-time risk analysis from blockchain data</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Actions Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Pending Claims Review</p>
                        <p className="text-sm text-muted-foreground">
                          {metrics.pendingClaims} claims awaiting approval
                        </p>
                      </div>
                      <Button>Review Now</Button>
                    </div>
                  </div>
                  
                  {metrics.pendingClaims === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>All caught up! No pending actions.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {claims.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No transaction history yet</p>
                    <p className="text-sm">All blockchain transactions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims
                      .sort((a, b) => parseInt(b.claimed_at) - parseInt(a.claimed_at))
                      .map((claim) => {
                        const statusInfo = getClaimStatus(claim.status)
                        
                        return (
                          <div key={claim.claim_id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  claim.status === CLAIM_STATUS_APPROVED ? 'bg-green-100' :
                                  claim.status === CLAIM_STATUS_PENDING ? 'bg-yellow-100' : 'bg-red-100'
                                }`}>
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">Claim #{claim.claim_id}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(parseInt(claim.claimed_at) * 1000).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  ₹{convertXLMToINR(parseInt(claim.claim_amount)).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">{statusInfo.text}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-start gap-3">
                      <Brain className="h-6 w-6 text-blue-500 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Fraud Pattern Detection</h4>
                        <p className="text-sm text-muted-foreground">
                          {fraudAlerts.length > 0 
                            ? `Detected ${fraudAlerts.length} high-risk claims with average score of ${Math.round(fraudAlerts.reduce((sum, c) => sum + c.aggregate_score, 0) / fraudAlerts.length)}%`
                            : 'No suspicious patterns detected in current claims'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-6 w-6 text-green-500 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Approval Rate Optimization</h4>
                        <p className="text-sm text-muted-foreground">
                          Current approval rate: {metrics.totalClaims > 0 
                            ? Math.round((metrics.approvedClaims / metrics.totalClaims) * 100) 
                            : 0}%. Platform performing {metrics.totalClaims > 0 && (metrics.approvedClaims / metrics.totalClaims) >= 0.7 ? 'well' : 'needs improvement'}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <div className="flex items-start gap-3">
                      <Activity className="h-6 w-6 text-purple-500 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Platform Health</h4>
                        <p className="text-sm text-muted-foreground">
                          {policies.length} active policies with {metrics.totalPolicyholders} unique holders. 
                          Average claim risk score: {claims.length > 0 
                            ? Math.round(claims.reduce((sum, c) => sum + c.aggregate_score, 0) / claims.length)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk-analysis" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold">
                      {claims.filter(c => c.aggregate_score < 70).length}
                    </p>
                    <p className="text-sm text-muted-foreground">High Risk Claims</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">
                      {claims.filter(c => c.aggregate_score >= 70 && c.aggregate_score < 85).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Medium Risk Claims</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">
                      {claims.filter(c => c.aggregate_score >= 85).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Low Risk Claims</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">High Risk (&lt;70%)</p>
                      <span className="text-sm text-muted-foreground">
                        {claims.length > 0 
                          ? Math.round((claims.filter(c => c.aggregate_score < 70).length / claims.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={claims.length > 0 
                        ? (claims.filter(c => c.aggregate_score < 70).length / claims.length) * 100 
                        : 0} 
                      className="h-2 bg-red-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Medium Risk (70-85%)</p>
                      <span className="text-sm text-muted-foreground">
                        {claims.length > 0 
                          ? Math.round((claims.filter(c => c.aggregate_score >= 70 && c.aggregate_score < 85).length / claims.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={claims.length > 0 
                        ? (claims.filter(c => c.aggregate_score >= 70 && c.aggregate_score < 85).length / claims.length) * 100 
                        : 0} 
                      className="h-2 bg-yellow-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Low Risk (≥85%)</p>
                      <span className="text-sm text-muted-foreground">
                        {claims.length > 0 
                          ? Math.round((claims.filter(c => c.aggregate_score >= 85).length / claims.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={claims.length > 0 
                        ? (claims.filter(c => c.aggregate_score >= 85).length / claims.length) * 100 
                        : 0} 
                      className="h-2 bg-green-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Renewals Tab */}
          <TabsContent value="renewals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Policy Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <RotateCcw className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Renewal tracking system</p>
                  <p className="text-sm">{policies.length} policies tracked for renewal</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <UserCog className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Team & Admin Management</p>
                  <p className="text-sm">Manage provider team members and permissions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Connected Wallet</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {walletAddress || 'Not connected'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={disconnectWallet}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Disconnect Wallet
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Data Refresh</h4>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {lastRefresh.toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-refresh: Every 30 seconds
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Blockchain Info</h4>
                    <p className="text-sm text-muted-foreground">
                      Network: Stellar Testnet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Contract: {CONTRACT_ID.slice(0, 20)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Claim Saathi Assistant */}
        {showAssistant && (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 z-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Image
                  src={getAssistantImage("chat")}
                  alt="Claim Saathi"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="font-medium">Claim Saathi</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAssistant(false)}
              >
                ×
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
              <p className="text-sm">
                Hi! I'm here to help you manage your insurance operations. 
                What would you like to know?
              </p>
            </div>
            {/* Add chat interface here */}
          </div>
        )}
      </div>
    </>
  )
} 

