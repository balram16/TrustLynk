"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  XCircle,
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

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
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
      console.log("🔍 Fetching claims from blockchain...")
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
      console.log("✅ Loaded", mappedClaims.length, "claims from blockchain")
    } catch (error) {
      console.error("❌ Error fetching claims:", error)
      toast({
        title: "Error",
        description: "Failed to load claims from blockchain",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from blockchain data
  const stats = {
    total: claims.length,
    approved: claims.filter(c => c.status === CLAIM_STATUS_APPROVED).length,
    pending: claims.filter(c => c.status === CLAIM_STATUS_PENDING).length,
    rejected: claims.filter(c => c.status === CLAIM_STATUS_REJECTED).length,
    totalAmount: claims
      .filter(c => c.status === CLAIM_STATUS_APPROVED)
      .reduce((sum, c) => sum + c.claim_amount_inr, 0),
    avgScore: claims.length > 0 
      ? Math.round(claims.reduce((sum, c) => sum + c.aggregate_score, 0) / claims.length)
      : 0
  }

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claim_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.user_address.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'approved' && claim.status === CLAIM_STATUS_APPROVED) ||
      (filterStatus === 'pending' && claim.status === CLAIM_STATUS_PENDING) ||
      (filterStatus === 'rejected' && claim.status === CLAIM_STATUS_REJECTED)
    
    return matchesSearch && matchesStatus
  })

  const getScoreColor = (score: number) => {
    if (score <= 30) return "text-green-600 bg-green-100"
    if (score <= 70) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getStatusBadge = (status: number) => {
    const color = getClaimStatusColor(status)
    const text = getClaimStatusString(status)
    return <Badge className={color}>{text}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-lg">Loading claims from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Claims Management</h1>
          <p className="text-muted-foreground">
            Process and manage insurance claims on blockchain
          </p>
        </div>
        <Button 
          onClick={fetchClaims}
          disabled={loading}
          className="bg-[#07a6ec] hover:bg-[#0696d7]"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">On blockchain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">High fraud risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Approved Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{stats.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Average: ₹{stats.approved > 0 ? Math.round(stats.totalAmount / stats.approved).toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Fraud Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.avgScore}/100
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.avgScore <= 30 ? "Low Risk ✅" : stats.avgScore <= 70 ? "Medium Risk ⚠️" : "High Risk 🚫"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by claim ID or user address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('approved')}
              >
                Approved ({stats.approved})
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({stats.pending})
              </Button>
              <Button
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('rejected')}
              >
                Rejected ({stats.rejected})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle>All Claims ({filteredClaims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No claims found</p>
              <p className="text-sm mt-2">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No claims have been submitted yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => (
                <Card key={claim.claim_id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Claim #{claim.claim_id}</h3>
                          {getStatusBadge(claim.status)}
                          <Badge className={getScoreColor(claim.aggregate_score)}>
                            Fraud Score: {claim.aggregate_score}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-gray-500">Policy ID</p>
                            <p className="font-semibold">{claim.policy_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">User Address</p>
                            <p className="font-mono text-xs">{claim.user_address.slice(0, 20)}...</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Claim Amount</p>
                            <p className="font-semibold text-lg">₹{claim.claim_amount_inr.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Submitted</p>
                            <p className="font-semibold">
                              {claim.claimed_at ? new Date(parseInt(claim.claimed_at) * 1000).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {claim.status === CLAIM_STATUS_APPROVED && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-semibold text-green-800">
                              ✅ Approved - Funds transferred automatically by smart contract
                            </p>
                          </div>
                        )}

                        {claim.status === CLAIM_STATUS_PENDING && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                            <p className="text-sm font-semibold text-yellow-800">
                              ⏳ Pending Review - Fraud score: {claim.aggregate_score}/100
                            </p>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Approve Claim
                            </Button>
                          </div>
                        )}

                        {claim.status === CLAIM_STATUS_REJECTED && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-800">
                              ❌ Rejected - High fraud risk detected (Score: {claim.aggregate_score}/100)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
