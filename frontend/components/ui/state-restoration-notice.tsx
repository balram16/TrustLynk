"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, Info } from "lucide-react"
import { useFreighterWallet } from "@/context/freighter-wallet-context"

export function StateRestorationNotice() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { isConnected, isLoading, userRole } = useFreighterWallet()
  
  const isAdmin = userRole === 'provider'
  const isPolicyholder = userRole === 'holder'

  useEffect(() => {
    const hasSeenNotice = localStorage.getItem("TrustLynk-state-notice-seen")
    
    if (!hasSeenNotice && isConnected && !isLoading && (isAdmin || isPolicyholder)) {
      setShow(true)
    }
  }, [isConnected, isLoading, isAdmin, isPolicyholder])

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem("TrustLynk-state-notice-seen", "true")
  }

  if (!show || dismissed) return null

  return (
   <div></div>
  )
}


