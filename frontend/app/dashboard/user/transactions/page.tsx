"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock transaction data
const mockTransactions = [
  {
    id: "TXN001",
    type: "policy_purchase",
    amount: 12500,
    status: "completed",
    date: "2024-03-15",
    description: "Health Insurance Policy - Premium Payment",
    txHash: "0x7c9f...3a2b",
    policyId: "POL1001"
  },
  {
    id: "TXN002",
    type: "claim_payout",
    amount: 45000,
    status: "completed",
    date: "2024-03-10",
    description: "Medical Claim Settlement",
    txHash: "0x5b8a...9d4c",
    claimId: "CLM2001"
  },
  {
    id: "TXN003",
    type: "premium_renewal",
    amount: 13200,
    status: "pending",
    date: "2024-03-08",
    description: "Auto Insurance - Annual Renewal",
    txHash: "0x2d4f...7e1a",
    policyId: "POL1002"
  },
  {
    id: "TXN004",
    type: "refund",
    amount: 3500,
    status: "completed",
    date: "2024-03-05",
    description: "Policy Cancellation Refund",
    txHash: "0x9a1c...6b3d",
    policyId: "POL1003"
  },
  {
    id: "TXN005",
    type: "claim_submission",
    amount: 0,
    status: "completed",
    date: "2024-03-03",
    description: "Travel Insurance Claim Filed",
    txHash: "0x4e7b...2c8f",
    claimId: "CLM2002"
  },
]

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    return type.includes("payout") || type.includes("refund") 
      ? <ArrowDownRight className="h-4 w-4 text-green-600" />
      : <ArrowUpRight className="h-4 w-4 text-orange-600" />
  }

  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus
    const matchesType = filterType === "all" || tx.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#fa6724] to-[#07a6ec] bg-clip-text text-transparent">
          Transaction History
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your blockchain transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockTransactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#fa6724]">
              ₹{mockTransactions
                .filter(tx => !tx.type.includes("payout") && !tx.type.includes("refund"))
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Premiums & fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#07a6ec]">
              ₹{mockTransactions
                .filter(tx => tx.type.includes("payout") || tx.type.includes("refund"))
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Claims & refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-sm">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
                  <SelectItem value="premium_renewal">Renewal</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium">{tx.description}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{tx.id}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                          <span>•</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">
                            {tx.txHash}
                          </code>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          tx.type.includes("payout") || tx.type.includes("refund")
                            ? "text-green-600"
                            : "text-gray-900 dark:text-gray-100"
                        }`}>
                          {tx.type.includes("payout") || tx.type.includes("refund") ? "+" : tx.amount > 0 ? "-" : ""}
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
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




