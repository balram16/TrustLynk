"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export interface PolicyholderDetails {
  name: string
  age: number
  gender: string
  bloodGroup: string
}

interface PolicyholderDetailsDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (details: PolicyholderDetails) => Promise<void>
  policyTitle: string
  premium: number
}

export function PolicyholderDetailsDialog({
  open,
  onClose,
  onSubmit,
  policyTitle,
  premium
}: PolicyholderDetailsDialogProps) {
  const [details, setDetails] = useState<PolicyholderDetails>({
    name: "",
    age: 0,
    gender: "",
    bloodGroup: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PolicyholderDetails, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PolicyholderDetails, string>> = {}

    if (!details.name.trim()) {
      newErrors.name = "Name is required"
    } else if (details.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters"
    }

    if (!details.age || details.age < 18) {
      newErrors.age = "Age must be 18 or older"
    } else if (details.age > 100) {
      newErrors.age = "Age must be less than 100"
    }

    if (!details.gender) {
      newErrors.gender = "Gender is required"
    }

    if (!details.bloodGroup) {
      newErrors.bloodGroup = "Blood group is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(details)
      // Reset form after successful submission
      setDetails({ name: "", age: 0, gender: "", bloodGroup: "" })
      setErrors({})
    } catch (error) {
      console.error("Error submitting policyholder details:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setDetails({ name: "", age: 0, gender: "", bloodGroup: "" })
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Policyholder Details</DialogTitle>
          <DialogDescription>
            Please provide your details to purchase {policyTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              disabled={submitting}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter your age"
              value={details.age || ""}
              onChange={(e) => setDetails({ ...details, age: parseInt(e.target.value) || 0 })}
              disabled={submitting}
              min="18"
              max="100"
              className={errors.age ? "border-red-500" : ""}
            />
            {errors.age && (
              <p className="text-sm text-red-500">{errors.age}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={details.gender}
              onValueChange={(value) => setDetails({ ...details, gender: value })}
              disabled={submitting}
            >
              <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-red-500">{errors.gender}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group *</Label>
            <Select
              value={details.bloodGroup}
              onValueChange={(value) => setDetails({ ...details, bloodGroup: value })}
              disabled={submitting}
            >
              <SelectTrigger className={errors.bloodGroup ? "border-red-500" : ""}>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
            {errors.bloodGroup && (
              <p className="text-sm text-red-500">{errors.bloodGroup}</p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-sm mb-2">Policy Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Policy:</span>
                <span className="font-medium">{policyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly Premium:</span>
                <span className="font-medium">₹{premium.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#fa6724] hover:bg-[#e55613]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Purchase Policy"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

