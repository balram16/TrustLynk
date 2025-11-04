"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw
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

export default function AllClaimsPage() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
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
      console.log("🔍 Fetching all claims from blockchain...")
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

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  // Calculate stats
  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === CLAIM_STATUS_PENDING).length,
    approved: claims.filter(c => c.status === CLAIM_STATUS_APPROVED).length,
    rejected: claims.filter(c => c.status === CLAIM_STATUS_REJECTED).length,
    flaggedForReview: claims.filter(c => c.aggregate_score > 70).length
  }

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claim_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.user_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.policy_id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'approved' && claim.status === CLAIM_STATUS_APPROVED) ||
      (statusFilter === 'pending' && claim.status === CLAIM_STATUS_PENDING) ||
      (statusFilter === 'rejected' && claim.status === CLAIM_STATUS_REJECTED)
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: number) => {
    const color = getClaimStatusColor(status)
    const text = getClaimStatusString(status)
    return <Badge className={color}>{text}</Badge>
  }

  const getStatusIcon = (status: number) => {
    if (status === CLAIM_STATUS_APPROVED) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (status === CLAIM_STATUS_REJECTED) {
      return <XCircle className="h-5 w-5 text-red-600" />
    } else {
      return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-lg">Loading all claims from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Claims</h1>
          <p className="text-muted-foreground">
            Comprehensive view of all insurance claims on blockchain
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={fetchClaims}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-[#07a6ec] hover:bg-[#0696d7] flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Claims
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#07a6ec]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <h3 className="text-2xl font-bold">{stats.pending}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <h3 className="text-2xl font-bold">{stats.approved}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <h3 className="text-2xl font-bold">{stats.rejected}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flagged</p>
                <h3 className="text-2xl font-bold">{stats.flaggedForReview}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by claim ID, policy, or address..." 
              className="pl-10 w-[400px]" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses ({stats.total})</option>
            <option value="approved">Approved ({stats.approved})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="rejected">Rejected ({stats.rejected})</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => (
            <Card key={claim.claim_id} className="overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => toggleExpand(claim.claim_id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    claim.status === CLAIM_STATUS_APPROVED ? "bg-green-100 dark:bg-green-900/30" :
                    claim.status === CLAIM_STATUS_REJECTED ? "bg-red-100 dark:bg-red-900/30" :
                    "bg-yellow-100 dark:bg-yellow-900/30"
                  }`}>
                    {getStatusIcon(claim.status)}
                  </div>
                  <div>
                    <h3 className="font-medium">Claim #{claim.claim_id}</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {claim.user_address.slice(0, 20)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Policy ID</p>
                    <p className="font-medium">{claim.policy_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Amount</p>
                    <p className="font-medium text-lg">₹{claim.claim_amount_inr.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Fraud Score</p>
                    <p className="font-medium">{claim.aggregate_score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {claim.claimed_at ? new Date(parseInt(claim.claimed_at) * 1000).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(claim.status)}
                  </div>
                  <div>
                    {expandedItem === claim.claim_id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedItem === claim.claim_id && (
                <CardContent className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Claim Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Claim ID:</span>
                          <span className="font-mono">{claim.claim_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Policy ID:</span>
                          <span className="font-mono">{claim.policy_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User Address:</span>
                          <span className="font-mono text-xs">{claim.user_address.slice(0, 30)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Claim Amount:</span>
                          <span className="font-semibold">₹{claim.claim_amount_inr.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fraud Score:</span>
                          <span className="font-semibold">{claim.aggregate_score}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Submitted:</span>
                          <span>
                            {claim.claimed_at ? new Date(parseInt(claim.claimed_at) * 1000).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed:</span>
                          <span>
                            {claim.processed_at ? new Date(parseInt(claim.processed_at) * 1000).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span>{claim.status_string}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">Risk Assessment</h4>
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Smart Contract Decision: {claim.status_string}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Fraud Score: </span>
                          <span className="font-semibold">{claim.aggregate_score}/100</span>
                        </div>
                        <div className="pt-2">
                          <div className="flex justify-between mb-1 text-xs">
                            <span>Risk Level</span>
                            <span>{claim.aggregate_score}/100</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                claim.aggregate_score <= 30 ? "bg-green-500" :
                                claim.aggregate_score <= 70 ? "bg-yellow-500" :
                                "bg-red-500"
                              }`}
                              style={{ width: `${claim.aggregate_score}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm mt-3">
                          {claim.aggregate_score <= 30 && (
                            <p className="text-green-700">✅ Low Risk - Auto-approved by smart contract</p>
                          )}
                          {claim.aggregate_score > 30 && claim.aggregate_score <= 70 && (
                            <p className="text-yellow-700">⚠️ Medium Risk - Requires manual review</p>
                          )}
                          {claim.aggregate_score > 70 && (
                            <p className="text-red-700">🚫 High Risk - Auto-rejected by smart contract</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 gap-2">
                    {claim.status === CLAIM_STATUS_PENDING && (
                      <>
                        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                          Reject Claim
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                          Approve Claim
                        </Button>
                      </>
                    )}
                    {claim.status === CLAIM_STATUS_APPROVED && (
                      <Badge className="bg-green-100 text-green-800">
                        ✅ Funds transferred automatically
                      </Badge>
                    )}
                    {claim.status === CLAIM_STATUS_REJECTED && (
                      <Badge className="bg-red-100 text-red-800">
                        ❌ Rejected due to high fraud risk
                      </Badge>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold">No claims found</p>
            <p className="text-sm mt-2">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No claims have been submitted yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
