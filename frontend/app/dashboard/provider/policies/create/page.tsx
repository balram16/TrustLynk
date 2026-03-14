"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Shield, CheckCircle } from "lucide-react"
import { createPolicy, POLICY_TYPE_HEALTH, POLICY_TYPE_LIFE, POLICY_TYPE_AUTO, POLICY_TYPE_HOME, POLICY_TYPE_TRAVEL } from "@/lib/blockchain"
import { useFreighterWallet } from "@/context/freighter-wallet-context"

export const dynamic = 'force-dynamic'

export default function CreatePolicyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { walletAddress, userRole } = useFreighterWallet()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    policyType: "",
    monthlyPremium: "",
    yearlyPremium: "",
    coverageAmount: "",
    minAge: "18",
    maxAge: "65",
    durationDays: "365",
    waitingPeriodDays: "30",
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-calculate yearly premium = monthly * 12 if monthly changed
      if (field === "monthlyPremium" && value) {
        const monthly = parseFloat(value)
        if (!isNaN(monthly)) {
          updated.yearlyPremium = Math.round(monthly * 12).toString()
        }
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walletAddress) {
      toast({ title: "Error", description: "Please connect your wallet first", variant: "destructive" })
      return
    }

    if (userRole !== 'provider') {
      toast({ title: "Access Denied", description: "Only registered providers (admin role) can create policies", variant: "destructive" })
      return
    }

    const policyTypeMap: Record<string, number> = {
      health: POLICY_TYPE_HEALTH,
      life: POLICY_TYPE_LIFE,
      two_wheeler: POLICY_TYPE_AUTO,
      four_wheeler: POLICY_TYPE_AUTO,
      home: POLICY_TYPE_HOME,
      travel: POLICY_TYPE_TRAVEL,
    }

    const policyTypeNum = policyTypeMap[form.policyType]
    if (!policyTypeNum) {
      toast({ title: "Error", description: "Please select a policy type", variant: "destructive" })
      return
    }

    const isAuto = form.policyType === "two_wheeler" || form.policyType === "four_wheeler"
    const monthly = parseInt(form.monthlyPremium)
    const yearly = isAuto ? monthly : parseInt(form.yearlyPremium)
    const coverage = parseInt(form.coverageAmount)
    const minAge = isAuto ? 0 : parseInt(form.minAge)
    const maxAge = isAuto ? 100 : parseInt(form.maxAge)
    const duration = parseInt(form.durationDays)
    const waiting = parseInt(form.waitingPeriodDays)

    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" })
      return
    }
    if (isNaN(monthly) || monthly <= 0) {
      toast({ title: "Error", description: "Monthly premium must be a positive number", variant: "destructive" })
      return
    }
    if (isNaN(coverage) || coverage <= 0) {
      toast({ title: "Error", description: "Coverage amount must be a positive number", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      console.log("📝 Creating policy on blockchain:", {
        title: form.title,
        policyType: policyTypeNum,
        monthlyPremium: monthly,
        yearlyPremium: yearly,
        coverageAmount: coverage,
      })

      const finalTitle = isAuto 
        ? `${form.title.trim()} [${form.policyType === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler'}]` 
        : form.title.trim()

      const result = await createPolicy({
        title: finalTitle,
        description: form.description.trim(),
        policyType: policyTypeNum,
        monthlyPremium: monthly,
        yearlyPremium: yearly,
        coverageAmount: coverage,
        minAge,
        maxAge,
        durationDays: duration,
        waitingPeriodDays: waiting,
      })

      if (result.success) {
        setSuccess(result.transactionHash || "confirmed")
        toast({
          title: "✅ Policy Created Successfully!",
          description: `Policy "${form.title}" has been created on the blockchain. TX: ${result.transactionHash?.slice(0, 10)}...`,
        })
      }
    } catch (error: any) {
      console.error("❌ Policy creation error:", error)
      toast({
        title: "Policy Creation Failed",
        description: error?.reason || error?.message || "Failed to create policy on blockchain",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="container max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Policy Created Successfully!</h2>
        <p className="text-muted-foreground">
          Your policy has been stored on the blockchain and is now available for policyholders to purchase.
        </p>
        <code className="block text-xs bg-muted p-3 rounded font-mono break-all">
          TX: {success}
        </code>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/dashboard/provider/policies')}>
            View All Policies
          </Button>
          <Button variant="outline" onClick={() => {
            setSuccess(null)
            setForm({
              title: "", description: "", policyType: "",
              monthlyPremium: "", yearlyPremium: "", coverageAmount: "",
              minAge: "18", maxAge: "65", durationDays: "365", waitingPeriodDays: "30"
            })
          }}>
            Create Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#fa6724]" />
            Create New Policy
          </h1>
          <p className="text-muted-foreground text-sm">
            Create a new insurance policy on the blockchain
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Policy name, description, and type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Policy Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Comprehensive Health Insurance Plan"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what this policy covers..."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyType">Policy Type *</Label>
              <Select
                value={form.policyType}
                onValueChange={(v) => handleChange("policyType", v)}
                disabled={submitting}
              >
                <SelectTrigger id="policyType">
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">🏥 Health Insurance</SelectItem>
                  <SelectItem value="life">❤️ Life Insurance</SelectItem>
                  <SelectItem value="two_wheeler">🛵 Two Wheeler Insurance</SelectItem>
                  <SelectItem value="four_wheeler">🚗 Four Wheeler Insurance</SelectItem>
                  <SelectItem value="home">🏠 Home Insurance</SelectItem>
                  <SelectItem value="travel">✈️ Travel Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Coverage (in ₹ INR)</CardTitle>
            <CardDescription>All amounts in Indian Rupees. They will be converted to ETH for blockchain storage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPremium">
                  {(form.policyType === 'two_wheeler' || form.policyType === 'four_wheeler') ? 'One-Time Premium (₹) *' : 'Monthly Premium (₹) *'}
                </Label>
                <Input
                  id="monthlyPremium"
                  type="number"
                  placeholder="e.g. 1500"
                  min="1"
                  value={form.monthlyPremium}
                  onChange={(e) => handleChange("monthlyPremium", e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              {form.policyType !== 'two_wheeler' && form.policyType !== 'four_wheeler' && (
                <div className="space-y-2">
                  <Label htmlFor="yearlyPremium">Yearly Premium (₹)</Label>
                  <Input
                    id="yearlyPremium"
                    type="number"
                    placeholder="Auto-filled from monthly"
                    value={form.yearlyPremium}
                    onChange={(e) => handleChange("yearlyPremium", e.target.value)}
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated as monthly × 12</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverageAmount">Coverage Amount (₹) *</Label>
              <Input
                id="coverageAmount"
                type="number"
                placeholder="e.g. 500000"
                min="1"
                value={form.coverageAmount}
                onChange={(e) => handleChange("coverageAmount", e.target.value)}
                required
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">Maximum claim amount payable to policyholder</p>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card>
          <CardHeader>
            <CardTitle>{(form.policyType === 'two_wheeler' || form.policyType === 'four_wheeler') ? 'Duration' : 'Eligibility & Duration'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.policyType !== 'two_wheeler' && form.policyType !== 'four_wheeler' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAge">Minimum Age</Label>
                  <Input
                    id="minAge"
                    type="number"
                    min="0"
                    max="100"
                    value={form.minAge}
                    onChange={(e) => handleChange("minAge", e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAge">Maximum Age</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    min="0"
                    max="100"
                    value={form.maxAge}
                    onChange={(e) => handleChange("maxAge", e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationDays">Duration (Days)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  value={form.durationDays}
                  onChange={(e) => handleChange("durationDays", e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">365 = 1 year</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waitingPeriodDays">Waiting Period (Days)</Label>
                <Input
                  id="waitingPeriodDays"
                  type="number"
                  min="0"
                  value={form.waitingPeriodDays}
                  onChange={(e) => handleChange("waitingPeriodDays", e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">Days before claims can be made</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary preview */}
        {form.monthlyPremium && form.coverageAmount && (
          <Card className="border-[#fa6724]/30 bg-orange-50/50 dark:bg-orange-950/10">
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-2 text-[#fa6724]">Preview</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{(form.policyType === 'two_wheeler' || form.policyType === 'four_wheeler') ? 'One-Time Premium' : 'Monthly Premium'}</p>
                  <p className="font-bold">₹{parseInt(form.monthlyPremium || "0").toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Coverage</p>
                  <p className="font-bold">₹{parseInt(form.coverageAmount || "0").toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-bold">{Math.floor(parseInt(form.durationDays || "365") / 365)} Year(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-[#fa6724] to-[#e55613]"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating on Blockchain...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Create Policy
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
