"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { getUserPolicies, getUserClaims, getAllPolicies, getPolicyTypeString } from "@/lib/blockchain"
import { useToast } from "@/components/ui/use-toast"

export const dynamic = 'force-dynamic'

interface Transaction {
  id: string
  type: "policy_purchase" | "claim_payout" | "claim_submission"
  amount: number
  status: "completed" | "pending" | "failed"
  date: string
  description: string
  txHash?: string
  reference?: string
}

export default function TransactionsPage() {
  const { walletAddress } = useFreighterWallet()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    if (walletAddress) fetchTransactions()
    else setLoading(false)
  }, [walletAddress])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const [allPolicies, userPolicies, userClaims] = await Promise.all([
        getAllPolicies(),
        getUserPolicies(walletAddress!),
        getUserClaims(walletAddress!)
      ])

      const txns: Transaction[] = []

      // Policy purchases → debit transactions
      for (const up of (userPolicies || [])) {
        const policy = (allPolicies || []).find((p: any) => p.policy_id === up.policy_id)
        const date = new Date(parseInt(up.purchase_date) * 1000)
        txns.push({
          id: `POL-${up.id}`,
          type: "policy_purchase",
          amount: parseInt(up.premium_paid) || 0,
          status: "completed",
          date: date.toISOString().split("T")[0],
          description: policy ? `${policy.title} — Premium Payment` : `Policy #${up.policy_id} — Purchase`,
          txHash: up.id ? `0x${String(up.id).padStart(64, "0").slice(-8)}...` : undefined,
          reference: up.policy_id
        })
      }

      // Claims → credit or pending transactions
      for (const cl of (userClaims || [])) {
        const date = new Date(parseInt(cl.claimed_at || (Date.now() / 1000).toString()) * 1000)
        const isApproved = cl.status === 2  // CLAIM_APPROVED = 2
        const isRejected = cl.status === 3  // CLAIM_REJECTED = 3
        txns.push({
          id: `CLM-${cl.claim_id}`,
          type: isApproved ? "claim_payout" : "claim_submission",
          amount: parseInt(cl.claim_amount || "0"),
          status: isApproved ? "completed" : isRejected ? "failed" : "pending",
          date: date.toISOString().split("T")[0],
          description: isApproved
            ? `Claim #${cl.claim_id} — Payout Approved`
            : isRejected
              ? `Claim #${cl.claim_id} — Rejected`
              : `Claim #${cl.claim_id} — Under Review`,
          reference: cl.policy_id
        })
      }

      // Sort newest first
      txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTransactions(txns)
    } catch (err) {
      console.error("Error fetching transactions:", err)
      toast({ title: "Error", description: "Failed to load transaction history", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />
      case "pending": return <AlertCircle className="h-4 w-4" />
      case "failed": return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const isCredit = (type: string) => type === "claim_payout"

  const totalSpent = transactions
    .filter(tx => !isCredit(tx.type) && tx.status === "completed")
    .reduce((s, tx) => s + tx.amount, 0)

  const totalReceived = transactions
    .filter(tx => isCredit(tx.type) && tx.status === "completed")
    .reduce((s, tx) => s + tx.amount, 0)

  const filtered = transactions.filter(tx => {
    const matchSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === "all" || tx.status === filterStatus
    const matchType = filterType === "all" || tx.type === filterType
    return matchSearch && matchStatus && matchType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-muted-foreground">Loading transactions from blockchain...</span>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Wallet not connected</h3>
        <p className="text-muted-foreground text-sm">Connect your MetaMask wallet to view transactions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#fa6724] to-[#07a6ec] bg-clip-text text-transparent">
            Transaction History
          </h1>
          <p className="text-muted-foreground mt-2">View all your blockchain transactions</p>
        </div>
        <Button variant="outline" onClick={fetchTransactions} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">On-chain records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#fa6724]">₹{totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Premiums paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#07a6ec]">₹{totalReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Claims paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="policy_purchase">Policy Purchase</SelectItem>
                  <SelectItem value="claim_payout">Claim Payout</SelectItem>
                  <SelectItem value="claim_submission">Claim Filed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" title="Export">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {transactions.length === 0 ? "No transactions yet" : "No transactions found"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {transactions.length === 0
                    ? "Purchase a policy from the dashboard to see your transactions here."
                    : "Try adjusting your search or filter criteria."}
                </p>
              </div>
            ) : (
              filtered.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {isCredit(tx.type)
                        ? <ArrowDownRight className="h-4 w-4 text-green-600" />
                        : <ArrowUpRight className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{tx.description}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{tx.id}</span>
                            <span>•</span>
                            <span>{tx.date}</span>
                            {tx.txHash && (
                              <>
                                <span>•</span>
                                <code className="bg-muted px-1.5 py-0.5 rounded">{tx.txHash}</code>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-base font-bold ${isCredit(tx.type) ? "text-green-600" : "text-foreground"}`}>
                            {isCredit(tx.type) ? "+" : tx.amount > 0 ? "−" : ""}
                            {tx.amount > 0 ? `₹${tx.amount.toLocaleString()}` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <Badge className={getStatusColor(tx.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </span>
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
