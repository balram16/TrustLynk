"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Download,
  FileText,
  Shield,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Heart,
  Car,
  Home,
  Plane,
  User
} from "lucide-react"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { 
  getAllPolicies,
  getPolicyTypeString,
  convertXLMToINR
} from "@/lib/blockchain"

export const dynamic = 'force-dynamic'

export default function AllPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  
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
      console.log("🔍 Fetching all policies from blockchain...")
      const blockchainPolicies = await getAllPolicies()
      
      const mappedPolicies = blockchainPolicies.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: getPolicyTypeString(Number(p.policy_type)),
        monthlyPremium: parseInt(p.monthly_premium),
        yearlyPremium: parseInt(p.yearly_premium),
        coverageAmount: parseInt(p.coverage_amount),
        minAge: p.min_age ? Number(p.min_age) : 18,
        maxAge: p.max_age ? Number(p.max_age) : 65,
        durationDays: p.duration_days ? Number(p.duration_days) : 365,
        waitingPeriodDays: p.waiting_period_days ? Number(p.waiting_period_days) : 30,
        createdAt: p.created_at,
        createdBy: p.created_by,
        status: 'Active'
      }))
      
      setPolicies(mappedPolicies)
      console.log("✅ Loaded", mappedPolicies.length, "policies from blockchain")
    } catch (error) {
      console.error("❌ Error fetching policies:", error)
      toast({
        title: "Error",
        description: "Failed to load policies from blockchain",
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
    total: policies.length,
    active: policies.filter(p => p.status === 'Active').length,
    health: policies.filter(p => p.type === 'Health').length,
    life: policies.filter(p => p.type === 'Life').length,
    auto: policies.filter(p => p.type === 'Auto').length,
    home: policies.filter(p => p.type === 'Home').length,
    travel: policies.filter(p => p.type === 'Travel').length,
  }

  // Filter policies
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = 
      policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = 
      typeFilter === 'all' || policy.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Health": return <Heart className="h-5 w-5" />
      case "Life": return <User className="h-5 w-5" />
      case "Auto": return <Car className="h-5 w-5" />
      case "Home": return <Home className="h-5 w-5" />
      case "Travel": return <Plane className="h-5 w-5" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Health": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "Life": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "Auto": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "Home": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "Travel": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-lg">Loading all policies from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Policies</h1>
          <p className="text-muted-foreground">
            Complete view of all insurance policies on blockchain
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={fetchPolicies}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-[#07a6ec] hover:bg-[#0696d7] flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Policies
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <Shield className="h-8 w-8 text-[#07a6ec]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold">{stats.active}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health</p>
                <h3 className="text-2xl font-bold">{stats.health}</h3>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Life</p>
                <h3 className="text-2xl font-bold">{stats.life}</h3>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auto</p>
                <h3 className="text-2xl font-bold">{stats.auto}</h3>
              </div>
              <Car className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Home</p>
                <h3 className="text-2xl font-bold">{stats.home}</h3>
              </div>
              <Home className="h-8 w-8 text-yellow-500" />
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
              placeholder="Search policies by title, description, or ID..." 
              className="pl-10 w-[400px]" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types ({stats.total})</option>
            <option value="Health">Health ({stats.health})</option>
            <option value="Life">Life ({stats.life})</option>
            <option value="Auto">Auto ({stats.auto})</option>
            <option value="Home">Home ({stats.home})</option>
            <option value="Travel">Travel ({stats.travel})</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map((policy) => (
            <Card key={policy.id} className="overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => toggleExpand(policy.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTypeColor(policy.type)}`}>
                    {getTypeIcon(policy.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{policy.title}</h3>
                    <p className="text-sm text-muted-foreground">Policy ID: {policy.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Type</p>
                    <Badge className={getTypeColor(policy.type)}>{policy.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Monthly Premium</p>
                    <p className="font-semibold">₹{policy.monthlyPremium.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Yearly Premium</p>
                    <p className="font-semibold">₹{policy.yearlyPremium.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-right text-muted-foreground">Coverage</p>
                    <p className="font-semibold text-lg">₹{policy.coverageAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div>
                    {expandedItem === policy.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedItem === policy.id && (
                <CardContent className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Policy Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Policy ID:</span>
                          <span className="font-mono">{policy.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Title:</span>
                          <span className="font-semibold">{policy.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <Badge className={getTypeColor(policy.type)}>{policy.type}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-muted-foreground text-xs mb-1">Description:</p>
                          <p className="text-sm">{policy.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Coverage & Premium</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Premium:</span>
                          <span className="font-semibold">₹{policy.monthlyPremium.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Yearly Premium:</span>
                          <span className="font-semibold">₹{policy.yearlyPremium.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coverage Amount:</span>
                          <span className="font-semibold text-lg">₹{policy.coverageAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Age Range:</span>
                          <span>{policy.minAge} - {policy.maxAge} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{Math.floor(policy.durationDays / 365)} Year(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Waiting Period:</span>
                          <span>{policy.waitingPeriodDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>
                            {policy.createdAt ? new Date(parseInt(policy.createdAt) * 1000).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-muted-foreground text-xs">Created By:</span>
                          <p className="font-mono text-xs mt-1">{policy.createdBy?.slice(0, 30)}...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 gap-2">
                    <Button variant="outline">View Holders</Button>
                    <Button variant="outline">View Claims</Button>
                    <Button className="bg-[#07a6ec] hover:bg-[#0696d7]">View on Explorer</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold">No policies found</p>
            <p className="text-sm mt-2">
              {searchQuery || typeFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No policies have been created yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

