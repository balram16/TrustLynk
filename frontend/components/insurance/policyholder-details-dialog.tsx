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
  isAutoPolicy?: boolean
  isHealthPolicy?: boolean
}

interface FamilyMember {
  relation: string
  age: number
}

export function PolicyholderDetailsDialog({
  open,
  onClose,
  onSubmit,
  policyTitle,
  premium,
  isAutoPolicy,
  isHealthPolicy
}: PolicyholderDetailsDialogProps) {
  const [details, setDetails] = useState<PolicyholderDetails>({
    name: "",
    age: 0,
    gender: "",
    bloodGroup: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PolicyholderDetails, string>>>({})
  
  // Health policy specific state
  const [step, setStep] = useState(1)
  const [familyMembersCount, setFamilyMembersCount] = useState(0)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  const handleFamilyCountChange = (count: number) => {
    setFamilyMembersCount(count)
    if (count > familyMembers.length) {
      setFamilyMembers([...familyMembers, ...Array(count - familyMembers.length).fill({ relation: "", age: 0 })])
    } else {
      setFamilyMembers(familyMembers.slice(0, count))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PolicyholderDetails, string>> = {}

    if (isAutoPolicy) {
      if (!details.name.trim()) newErrors.name = "Registration Number is required"
      
      const currentYear = new Date().getFullYear()
      if (!details.age || details.age < 1990 || details.age > currentYear) {
        newErrors.age = `Manufacturing Year must be between 1990 and ${currentYear}`
      }
      
      if (!details.gender) newErrors.gender = "Vehicle Make is required"
      if (!details.bloodGroup) newErrors.bloodGroup = "Vehicle Model is required"
    } else {
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      if (isHealthPolicy && familyMembersCount > 0) {
        setStep(2)
      } else {
        handleSubmit(e)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1 && !validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(details)
      // Reset form after successful submission
      resetForm()
    } catch (error) {
      console.error("Error submitting policyholder details:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setDetails({ name: "", age: 0, gender: "", bloodGroup: "" })
    setErrors({})
    setStep(1)
    setFamilyMembersCount(0)
    setFamilyMembers([])
  }

  const handleClose = () => {
    if (!submitting) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Policyholder Details" : "Family Member Details"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? `Please provide your details to purchase ${policyTitle}`
              : `Please provide the age and relation for your family members.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={step === 1 && familyMembersCount > 0 ? handleNext : handleSubmit} className="space-y-4 mt-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
            <Label htmlFor="name">{isAutoPolicy ? 'Vehicle Registration No. *' : 'Full Name *'}</Label>
            <Input
              id="name"
              placeholder={isAutoPolicy ? "e.g. MH12AB1234" : "Enter your full name"}
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
            <Label htmlFor="age">{isAutoPolicy ? 'Manufacturing Year *' : 'Age *'}</Label>
            <Input
              id="age"
              type="number"
              placeholder={isAutoPolicy ? "e.g. 2020" : "Enter your age"}
              value={details.age || ""}
              onChange={(e) => setDetails({ ...details, age: parseInt(e.target.value) || 0 })}
              disabled={submitting}
              min={isAutoPolicy ? "1990" : "18"}
              max={isAutoPolicy ? new Date().getFullYear().toString() : "100"}
              className={errors.age ? "border-red-500" : ""}
            />
            {errors.age && (
              <p className="text-sm text-red-500">{errors.age}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">{isAutoPolicy ? 'Vehicle Make *' : 'Gender *'}</Label>
            {isAutoPolicy ? (
              <Input
                id="gender"
                placeholder="e.g. Honda, Suzuki"
                value={details.gender}
                onChange={(e) => setDetails({ ...details, gender: e.target.value })}
                disabled={submitting}
                className={errors.gender ? "border-red-500" : ""}
              />
            ) : (
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
            )}
            {errors.gender && (
              <p className="text-sm text-red-500">{errors.gender}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloodGroup">{isAutoPolicy ? 'Vehicle Model *' : 'Blood Group *'}</Label>
            {isAutoPolicy ? (
              <Input
                id="bloodGroup"
                placeholder="e.g. Activa, Swift"
                value={details.bloodGroup}
                onChange={(e) => setDetails({ ...details, bloodGroup: e.target.value })}
                disabled={submitting}
                className={errors.bloodGroup ? "border-red-500" : ""}
              />
            ) : (
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
            )}
            {errors.bloodGroup && (
              <p className="text-sm text-red-500">{errors.bloodGroup}</p>
            )}
          </div>

              {isHealthPolicy && (
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="familyMembers">Add Family Members (Optional)</Label>
                  <Select
                    value={familyMembersCount.toString()}
                    onValueChange={(val) => handleFamilyCountChange(parseInt(val))}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of family members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Just Me</SelectItem>
                      <SelectItem value="1">1 Family Member</SelectItem>
                      <SelectItem value="2">2 Family Members</SelectItem>
                      <SelectItem value="3">3 Family Members</SelectItem>
                      <SelectItem value="4">4 Family Members</SelectItem>
                      <SelectItem value="5">5 Family Members</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Extra covered members will be accounted for during claim analysis.</p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                <h4 className="font-semibold text-sm mb-2">Policy Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Policy:</span>
                    <span className="font-medium">{policyTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{isAutoPolicy ? 'One-Time Premium:' : 'Monthly Premium:'}</span>
                    <span className="font-medium">₹{premium.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pb-2">
              <div className="p-3 bg-muted rounded-md mb-4 text-sm text-muted-foreground">
                Enter details for your {familyMembersCount} family member{familyMembersCount > 1 ? 's' : ''}. This helps our AI analyze claims more accurately.
              </div>
              
              {familyMembers.map((member, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg bg-card">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    Family Member
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Relation *</Label>
                      <Select
                        value={member.relation}
                        onValueChange={(val) => {
                          const newMembers = [...familyMembers]
                          newMembers[index].relation = val
                          setFamilyMembers(newMembers)
                        }}
                        disabled={submitting}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Relation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Child">Child</SelectItem>
                          <SelectItem value="Parent">Parent</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Age *</Label>
                      <Input
                        type="number"
                        placeholder="Age"
                        value={member.age || ""}
                        onChange={(e) => {
                          const newMembers = [...familyMembers]
                          newMembers[index].age = parseInt(e.target.value) || 0
                          setFamilyMembers(newMembers)
                        }}
                        required
                        min="0"
                        max="120"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === 2) {
                  setStep(1)
                } else {
                  handleClose()
                }
              }}
              disabled={submitting}
              className="flex-1"
            >
              {step === 2 ? "Back" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={submitting || (step === 2 && familyMembers.some(m => !m.relation || m.age <= 0))}
              className="flex-1 bg-[#fa6724] hover:bg-[#e55613]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : step === 1 && familyMembersCount > 0 ? (
                "Next Step"
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

