"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, UploadCloud, FileText } from "lucide-react"

export interface AutoClaimDetails {
  incidentDescription: string
  garageName: string
  garageAddress: string
  estimateAmount: number
  rcDocument: File | null
  drivingLicense: File | null
  damagePhotos: File[]
}

interface AutoClaimDetailsDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (details: AutoClaimDetails) => Promise<void>
  policyTitle: string
}

export function AutoClaimDetailsDialog({
  open,
  onClose,
  onSubmit,
  policyTitle,
}: AutoClaimDetailsDialogProps) {
  const [details, setDetails] = useState<AutoClaimDetails>({
    incidentDescription: "",
    garageName: "",
    garageAddress: "",
    estimateAmount: 0,
    rcDocument: null,
    drivingLicense: null,
    damagePhotos: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof AutoClaimDetails, string>>>({})

  const handleFileChange = (field: keyof AutoClaimDetails, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (field === 'damagePhotos') {
        const filesArray = Array.from(e.target.files);
        setDetails({ ...details, [field]: filesArray })
      } else {
        setDetails({ ...details, [field]: e.target.files[0] })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AutoClaimDetails, string>> = {}

    if (!details.incidentDescription.trim()) {
      newErrors.incidentDescription = "Incident description is required"
    } else if (details.incidentDescription.trim().length < 20) {
      newErrors.incidentDescription = "Please provide more details (at least 20 characters)"
    }

    if (!details.garageName.trim()) newErrors.garageName = "Garage/Service Center Name is required"
    if (!details.garageAddress.trim()) newErrors.garageAddress = "Garage Address is required"
    if (!details.estimateAmount || details.estimateAmount <= 0) newErrors.estimateAmount = "Valid estimate amount is required"
    if (!details.rcDocument) newErrors.rcDocument = "Registration Certificate (RC) is required"
    if (!details.drivingLicense) newErrors.drivingLicense = "Driving License is required"
    if (details.damagePhotos.length === 0) newErrors.damagePhotos = "At least one damage photo is required"

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
      setDetails({
        incidentDescription: "",
        garageName: "",
        garageAddress: "",
        estimateAmount: 0,
        rcDocument: null,
        drivingLicense: null,
        damagePhotos: []
      })
      setErrors({})
    } catch (error) {
      console.error("Error submitting auto claim details:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setDetails({
        incidentDescription: "",
        garageName: "",
        garageAddress: "",
        estimateAmount: 0,
        rcDocument: null,
        drivingLicense: null,
        damagePhotos: []
      })
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File Vehicle Insurance Claim</DialogTitle>
          <DialogDescription>
            Please provide accident details and required documents for {policyTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="incidentDescription">Incident Description *</Label>
            <Textarea
              id="incidentDescription"
              placeholder="Describe how the damage occurred..."
              value={details.incidentDescription}
              onChange={(e) => setDetails({ ...details, incidentDescription: e.target.value })}
              disabled={submitting}
              className={`min-h-[100px] ${errors.incidentDescription ? "border-red-500" : ""}`}
            />
            {errors.incidentDescription && (
              <p className="text-sm text-red-500">{errors.incidentDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="garageName">Garage/Service Center Name *</Label>
              <Input
                id="garageName"
                placeholder="e.g. Authorized Honda Service"
                value={details.garageName}
                onChange={(e) => setDetails({ ...details, garageName: e.target.value })}
                disabled={submitting}
                className={errors.garageName ? "border-red-500" : ""}
              />
              {errors.garageName && (
                <p className="text-sm text-red-500">{errors.garageName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimateAmount">Estimated Repair Cost (₹) *</Label>
              <Input
                id="estimateAmount"
                type="number"
                placeholder="e.g. 15000"
                value={details.estimateAmount || ""}
                onChange={(e) => setDetails({ ...details, estimateAmount: parseInt(e.target.value) || 0 })}
                disabled={submitting}
                min="1"
                className={errors.estimateAmount ? "border-red-500" : ""}
              />
              {errors.estimateAmount && (
                <p className="text-sm text-red-500">{errors.estimateAmount}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="garageAddress">Garage Address *</Label>
            <Input
              id="garageAddress"
              placeholder="Full address of the service center"
              value={details.garageAddress}
              onChange={(e) => setDetails({ ...details, garageAddress: e.target.value })}
              disabled={submitting}
              className={errors.garageAddress ? "border-red-500" : ""}
            />
            {errors.garageAddress && (
              <p className="text-sm text-red-500">{errors.garageAddress}</p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">Required Documents</h4>
            
            <div className="space-y-2">
              <Label htmlFor="rcDocument" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Registration Certificate (RC) *
              </Label>
              <Input
                id="rcDocument"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileChange('rcDocument', e)}
                disabled={submitting}
                className={`file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.rcDocument ? "border-red-500" : ""}`}
              />
              {errors.rcDocument && <p className="text-sm text-red-500">{errors.rcDocument}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="drivingLicense" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Driving License *
              </Label>
              <Input
                id="drivingLicense"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileChange('drivingLicense', e)}
                disabled={submitting}
                className={`file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.drivingLicense ? "border-red-500" : ""}`}
              />
              {errors.drivingLicense && <p className="text-sm text-red-500">{errors.drivingLicense}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="damagePhotos" className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" /> Damage Photos (Select Multiple) *
              </Label>
              <Input
                id="damagePhotos"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange('damagePhotos', e)}
                disabled={submitting}
                className={`file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.damagePhotos ? "border-red-500" : ""}`}
              />
              {details.damagePhotos.length > 0 && (
                <p className="text-xs text-muted-foreground">{details.damagePhotos.length} photo(s) selected</p>
              )}
              {errors.damagePhotos && <p className="text-sm text-red-500">{errors.damagePhotos}</p>}
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
                  Uploading...
                </>
              ) : (
                "Submit Auto Claim"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
