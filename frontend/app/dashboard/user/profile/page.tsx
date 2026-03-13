"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Shield,
  Bell,
  Copy,
  CheckCircle,
  Loader2,
  ExternalLink,
  Heart,
  Car,
  Plane,
  User,
  Home
} from "lucide-react"
import { useFreighterWallet } from "@/context/freighter-wallet-context"
import { getUserPolicies, getAllPolicies, getPolicyTypeString } from "@/lib/blockchain"

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { toast } = useToast()
  const { walletAddress, userRole } = useFreighterWallet()
  const [userPolicies, setUserPolicies] = useState<any[]>([])
  const [allPolicies, setAllPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [notifications, setNotifications] = useState({ email: true, push: true, claims: true })

  useEffect(() => {
    if (walletAddress) fetchData()
    else setLoading(false)
  }, [walletAddress])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ap, up] = await Promise.all([getAllPolicies(), getUserPolicies(walletAddress!)])
      setAllPolicies(ap || [])
      setUserPolicies(up || [])
    } catch (err) {
      console.error("Profile fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied!", description: "Wallet address copied to clipboard" })
  }

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Not connected"

  const initials = walletAddress ? walletAddress.slice(2, 4).toUpperCase() : "??"

  const getPolicyIcon = (type: string | number) => {
    const t = typeof type === "number" ? getPolicyTypeString(type) : type
    switch (t) {
      case "Health": return <Heart className="h-4 w-4 text-red-500" />
      case "Auto": return <Car className="h-4 w-4 text-blue-500" />
      case "Home": return <Home className="h-4 w-4 text-yellow-500" />
      case "Travel": return <Plane className="h-4 w-4 text-purple-500" />
      case "Life": return <User className="h-4 w-4 text-green-500" />
      default: return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const enrichedPolicies = userPolicies.map(up => ({
    ...up,
    detail: allPolicies.find(p => p.policy_id === up.policy_id)
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <span className="ml-3 text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-gradient-to-r from-[#07a6ec] to-[#fa6724] text-white text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">
            {userRole === "holder" ? "Policy Holder" : userRole === "provider" ? "Policy Provider" : "User"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
              {walletAddress ?? "Not connected"}
            </code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
              {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
            {walletAddress && (
              <a
                href={`https://hardhat.etherscan.io/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-gradient-to-r from-[#07a6ec] to-[#fa6724] text-white">
              {userRole === "holder" ? "Policyholder" : userRole === "provider" ? "Provider" : "User"}
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Blockchain Verified
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-[#fa6724]">{userPolicies.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Active Policies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-[#07a6ec]">
              ₹{userPolicies.reduce((s, up) => s + parseInt(up.premium_paid || "0"), 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Premiums</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">
              {userPolicies.length > 0
                ? `₹${enrichedPolicies.reduce((s, up) => s + parseInt(up.detail?.coverage_amount || "0"), 0).toLocaleString()}`
                : "—"
              }
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">My Policies ({userPolicies.length})</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* POLICIES TAB */}
        <TabsContent value="policies" className="space-y-3 mt-4">
          {enrichedPolicies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground">No policies purchased yet.</p>
              </CardContent>
            </Card>
          ) : (
            enrichedPolicies.map((up) => {
              const p = up.detail
              const typeLabel = p ? getPolicyTypeString(Number(p.policy_type)) : "Policy"
              const purchaseDate = new Date(parseInt(up.purchase_date) * 1000).toLocaleDateString("en-IN")
              let expiryLabel = "—"
              if (p?.duration_days) {
                const expiry = new Date(parseInt(up.purchase_date) * 1000 + parseInt(p.duration_days) * 86400000)
                expiryLabel = expiry.toLocaleDateString("en-IN")
                const isExpired = new Date() > expiry
                if (isExpired) expiryLabel = `Expired (${expiryLabel})`
              }
              return (
                <Card key={up.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getPolicyIcon(p?.policy_type ?? 0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p?.title ?? `Policy #${up.policy_id}`}</p>
                          <p className="text-xs text-muted-foreground">{typeLabel} • NFT #{up.id}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Active</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Premium Paid</p>
                        <p className="font-semibold">₹{parseInt(up.premium_paid || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Coverage</p>
                        <p className="font-semibold">₹{parseInt(p?.coverage_amount || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Purchased</p>
                        <p className="font-semibold">{purchaseDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage how you receive updates about your policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email", label: "Email Notifications", desc: "Transaction confirmations and policy updates" },
                { key: "push", label: "Push Notifications", desc: "Real-time alerts in your browser" },
                { key: "claims", label: "Claim Updates", desc: "Status changes on your submitted claims" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notifications[key as keyof typeof notifications]}
                    onCheckedChange={(v) => setNotifications(prev => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Wallet
              </CardTitle>
              <CardDescription>Your account is secured by your Ethereum wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Wallet Connected & Verified
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Your identity is cryptographically secured via MetaMask. No password required.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Connected Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-3 rounded font-mono break-all">
                    {walletAddress ?? "Not connected"}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyAddress}>
                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Role</Label>
                <div className="p-3 bg-muted rounded text-sm font-medium capitalize">
                  {userRole ?? "unregistered"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
