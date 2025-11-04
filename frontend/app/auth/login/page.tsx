"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new wallet auth page
    router.replace("/wallet-auth")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#fa6724]" />
        <p className="text-gray-600">Redirecting to wallet authentication...</p>
      </div>
    </div>
  )
}


