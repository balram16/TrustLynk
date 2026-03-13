"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Car,
  Home,
  Heart,
  Plane,
  Shield,
  FileText,
  Calendar,
  AlertTriangle,
  Search,
  CheckCircle,
  Loader2,
  User,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import {
  getAllPolicies,
  getUserPolicies,
  getPolicyTypeString,
  BlockchainPolicy,
  BlockchainUserPolicy
} from "@/lib/blockchain"

export const dynamic = 'force-dynamic'

type ExtendedUserPolicy = BlockchainUserPolicy & { policy?: BlockchainPolicy }

export default function PoliciesPage() {
  const { toast } = useToast()
  const { walletAddress } = useFreighterWallet()

  const [searchQuery, setSearchQuery] = useState("")
  const [availablePolicies, setAvailablePolicies] = useState<BlockchainPolicy[]>([])
  const [userPolicies, setUserPolicies] = useState<ExtendedUserPolicy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [walletAddress])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [allP, userP] = await Promise.all([
        getAllPolicies(),
        walletAddress ? getUserPolicies(walletAddress) : Promise.resolve([])
      ])
      setAvailablePolicies(allP || [])
      // Enrich user policies with the matching policy details
      const enriched = (userP || []).map((up: any) => ({
        ...up,
        policy: (allP || []).find((p: BlockchainPolicy) => p.policy_id === up.policy_id)
      }))
      setUserPolicies(enriched)
    } catch (err) {
      console.error("Error fetching policies:", err)
      toast({ title: "Error", description: "Failed to load policies from blockchain", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getPolicyIcon = (type: string | number) => {
    const t = typeof type === "number" ? getPolicyTypeString(type) : type
    switch (t) {
      case "Health": return <Heart className="h-6 w-6 text-red-500" />
      case "Auto": return <Car className="h-6 w-6 text-blue-500" />
      case "Home": return <Home className="h-6 w-6 text-yellow-500" />
      case "Travel": return <Plane className="h-6 w-6 text-purple-500" />
      case "Life": return <User className="h-6 w-6 text-green-500" />
      default: return <Shield className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusBadge = (status: number, purchaseDate: string, durationDays: string | undefined) => {
    if (durationDays) {
      const purchase = new Date(parseInt(purchaseDate) * 1000)
      const expiry = new Date(purchase.getTime() + parseInt(durationDays) * 86400000)
      if (new Date() > expiry) {
        return <Badge className="bg-red-100 text-red-700">Expired</Badge>
      }
    }
    return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
  }

  const filteredAvailable = availablePolicies.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getPolicyTypeString(Number(p.policy_type)).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUser = userPolicies.filter(up =>
    (up.policy?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-muted-foreground">Loading policies from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#fa6724] to-[#07a6ec] bg-clip-text text-transparent">
            My Policies
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your blockchain-secured insurance policies
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search policies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My Policies ({userPolicies.length})</TabsTrigger>
          <TabsTrigger value="available">Available Policies ({availablePolicies.length})</TabsTrigger>
        </TabsList>

        {/* MY POLICIES */}
        <TabsContent value="mine" className="space-y-4 mt-4">
          {filteredUser.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Shield className="h-14 w-14 text-muted-foreground mb-4 opacity-40" />
                <h3 className="text-lg font-semibold mb-1">No policies yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  You haven't purchased any policies yet. Go to the Dashboard to browse and purchase available policies.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUser.map((up) => {
              const p = up.policy
              const typeLabel = p ? getPolicyTypeString(Number(p.policy_type)) : "Policy"
              const purchaseDate = new Date(parseInt(up.purchase_date) * 1000).toLocaleDateString("en-IN")
              let expiryLabel = "—"
              if (p?.duration_days) {
                const purchaseTs = parseInt(up.purchase_date) * 1000
                const expiry = new Date(purchaseTs + parseInt(p.duration_days) * 86400000)
                expiryLabel = expiry.toLocaleDateString("en-IN")
              }
              return (
                <Card key={up.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getPolicyIcon(p?.policy_type ?? typeLabel)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{p?.title ?? `Policy #${up.policy_id}`}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            ID: {up.policy_id} &bull; {typeLabel}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(up.status, up.purchase_date, p?.duration_days)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {p && (
                      <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Premium Paid</p>
                        <p className="font-semibold">₹{parseInt(up.premium_paid).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Coverage</p>
                        <p className="font-semibold">₹{parseInt(p?.coverage_amount ?? "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Start Date</p>
                        <p className="font-semibold">{purchaseDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Expiry Date</p>
                        <p className="font-semibold">{expiryLabel}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Badge variant="outline" className="text-xs flex gap-1">
                        <FileText className="h-3 w-3" />
                        NFT Certificate #{up.id}
                      </Badge>
                      <Badge variant="outline" className="text-xs flex gap-1">
                        <Calendar className="h-3 w-3" />
                        Purchased {purchaseDate}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* AVAILABLE POLICIES */}
        <TabsContent value="available" className="space-y-4 mt-4">
          {filteredAvailable.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="h-14 w-14 text-muted-foreground mb-4 opacity-40" />
                <h3 className="text-lg font-semibold mb-1">No policies available</h3>
                <p className="text-muted-foreground text-sm">
                  No active policies found on the blockchain.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAvailable.map((p) => {
                const typeLabel = getPolicyTypeString(Number(p.policy_type))
                return (
                  <Card key={p.policy_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getPolicyIcon(p.policy_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm">{p.title}</CardTitle>
                          <CardDescription className="text-xs">{typeLabel}</CardDescription>
                        </div>
                        {p.status === 1 ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Monthly Premium</span>
                          <p className="font-semibold">₹{parseInt(p.monthly_premium).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coverage</span>
                          <p className="font-semibold">₹{parseInt(p.coverage_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration</span>
                          <p className="font-semibold">{p.duration_days} days</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Yearly Premium</span>
                          <p className="font-semibold">₹{parseInt(p.yearly_premium).toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
