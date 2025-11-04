"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Search,
  Filter,
  Clock,
  CheckCircle,
  FileText,
  Download,
  Plus,
  RefreshCw,
  Loader2
} from "lucide-react"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { 
  getAllPolicies, 
  getPolicyTypeString,
  convertXLMToINR,
  formatXLM
} from "@/lib/blockchain"
import { useRouter } from "next/navigation"

export default function ProviderPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  
  const { walletAddress, userRole } = useFreighterWallet()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (walletAddress && userRole === 'provider') {
      fetchPolicies()
    }
  }, [walletAddress, userRole])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching policies from blockchain...")
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

  // Calculate stats from blockchain data
  const stats = {
    totalPolicies: policies.length,
    activePolicies: policies.filter(p => p.status === 'Active').length,
    healthPolicies: policies.filter(p => p.type === 'Health').length,
    lifePolicies: policies.filter(p => p.type === 'Life').length,
    autoPolicies: policies.filter(p => p.type === 'Auto').length,
    homePolicies: policies.filter(p => p.type === 'Home').length,
    travelPolicies: policies.filter(p => p.type === 'Travel').length,
    totalPremiumRevenue: policies.reduce((sum, p) => sum + p.yearlyPremium, 0)
  }

  // Filter policies based on search and type
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || policy.type === filterType
    return matchesSearch && matchesType
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Health": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      case "Life": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "Auto": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "Home": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      case "Travel": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-lg">Loading policies from blockchain...</span>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policy Management</h1>
          <p className="text-gray-500 mt-2">
            Manage all insurance policies on the blockchain
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchPolicies}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => router.push('/dashboard/admin')}
            className="bg-gradient-to-r from-[#fa6724] to-[#e55613]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolicies}</div>
            <p className="text-xs text-muted-foreground mt-1">
              On blockchain
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePolicies}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
            <FileText className="h-4 w-4 text-[#fa6724]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalPremiumRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Yearly premium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Policy Types</CardTitle>
            <Shield className="h-4 w-4 text-[#07a6ec]" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health:</span>
                <span className="font-semibold">{stats.healthPolicies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Life:</span>
                <span className="font-semibold">{stats.lifePolicies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto:</span>
                <span className="font-semibold">{stats.autoPolicies}</span>
              </div>
            </div>
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
                placeholder="Search policies by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'Health' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Health')}
              >
                Health
              </Button>
              <Button
                variant={filterType === 'Life' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Life')}
              >
                Life
              </Button>
              <Button
                variant={filterType === 'Auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Auto')}
              >
                Auto
              </Button>
              <Button
                variant={filterType === 'Home' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Home')}
              >
                Home
              </Button>
              <Button
                variant={filterType === 'Travel' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('Travel')}
              >
                Travel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Policies List */}
      <Card>
        <CardHeader>
          <CardTitle>All Policies ({filteredPolicies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No policies found</p>
              <p className="text-sm mt-2">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first policy to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPolicies.map((policy) => (
                <Card key={policy.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{policy.title}</h3>
                          <Badge className={getTypeColor(policy.type)}>
                            {policy.type}
                          </Badge>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {policy.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{policy.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Policy ID</p>
                            <p className="font-semibold">{policy.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Monthly Premium</p>
                            <p className="font-semibold">₹{policy.monthlyPremium.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Yearly Premium</p>
                            <p className="font-semibold">₹{policy.yearlyPremium.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Coverage</p>
                            <p className="font-semibold">₹{policy.coverageAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Age Range</p>
                            <p className="font-semibold">{policy.minAge} - {policy.maxAge} years</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-semibold">{Math.floor(policy.durationDays / 365)} Year(s)</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Waiting Period</p>
                            <p className="font-semibold">{policy.waitingPeriodDays} days</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Created</p>
                            <p className="font-semibold">
                              {policy.createdAt ? new Date(parseInt(policy.createdAt) * 1000).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
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
