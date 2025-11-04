"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MultiStepClaimForm } from "@/components/insurance/multi-step-claim-form"

export const dynamic = 'force-dynamic'

export default function NewClaimPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard/user" className="inline-flex items-center text-[#07a6ec] hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">File Insurance Claim</h1>
        <p className="text-muted-foreground">
          Submit your claim using ABHA health records and AI-powered verification
        </p>
      </div>

      <MultiStepClaimForm />
    </div>
  )
}



