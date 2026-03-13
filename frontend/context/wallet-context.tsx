"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { getUserRole, ROLE_ADMIN, ROLE_POLICYHOLDER, ROLE_UNREGISTERED } from "@/lib/blockchain"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  userType: "user" | "admin" | null
  setUserType: (type: "user" | "admin" | null) => void
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  isLoading: boolean
  hasAbhaConsent: boolean
  setHasAbhaConsent: (consent: boolean) => void
  // Blockchain state
  isAdmin: boolean
  isPolicyholder: boolean
  isRegistered: boolean
  blockchainLoading: boolean
  refreshBlockchainState: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [userType, setUserType] = useState<"user" | "admin" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasAbhaConsent, setHasAbhaConsent] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPolicyholder, setIsPolicyholder] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [blockchainLoading, setBlockchainLoading] = useState(false)
  const router = useRouter()

  // Check if MetaMask is connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window === "undefined" || !window.ethereum) return

        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          setIsConnected(true)
          setAddress(accounts[0].address)
        }
      } catch (error) {
        console.error("Error checking MetaMask connection:", error)
      }
    }

    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsConnected(false)
          setAddress(null)
          setUserType(null)
        } else {
          setAddress(accounts[0])
        }
      })
    }
  }, [])

  const connectWallet = async () => {
    try {
      setIsLoading(true)

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask wallet is not installed. Please install it from https://metamask.io/download/")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])

      if (accounts.length > 0) {
        setIsConnected(true)
        setAddress(accounts[0])
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
      throw new Error(error.message || "Failed to connect to MetaMask wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      setIsLoading(true)
      setIsConnected(false)
      setAddress(null)
      setUserType(null)
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
      router.push("/auth/login")
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check blockchain state for connected wallet
  const refreshBlockchainState = async () => {
    if (!address) {
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
      return
    }

    setBlockchainLoading(true)
    try {
      console.log("Checking blockchain state for address:", address)

      // Check user role directly
      const role = await getUserRole(address)
      const adminStatus = role === ROLE_ADMIN
      const policyholderStatus = role === ROLE_POLICYHOLDER
      const registeredStatus = role !== ROLE_UNREGISTERED

      setIsAdmin(adminStatus)
      setIsPolicyholder(policyholderStatus)
      setIsRegistered(registeredStatus)

      // Auto-update userType based on blockchain role
      if (adminStatus) {
        setUserType("admin")
      } else if (policyholderStatus) {
        setUserType("user")
      } else {
        setUserType(null)
      }

      console.log("Blockchain state refreshed:", {
        address,
        role,
        isAdmin: adminStatus,
        isPolicyholder: policyholderStatus,
        isRegistered: registeredStatus
      })
    } catch (error) {
      console.error("Error checking blockchain state:", error)
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
    } finally {
      setBlockchainLoading(false)
    }
  }

  // Store user type in localStorage
  useEffect(() => {
    if (userType) {
      localStorage.setItem("TrustLynk-user-type", userType)
    } else {
      localStorage.removeItem("TrustLynk-user-type")
    }
  }, [userType])

  // Restore user type and ABHA consent from localStorage
  useEffect(() => {
    const storedUserType = localStorage.getItem("TrustLynk-user-type")
    const storedAbhaConsent = localStorage.getItem("TrustLynk-abha-consent")

    if (storedUserType && (storedUserType === "user" || storedUserType === "admin")) {
      setUserType(storedUserType)
    }

    if (storedAbhaConsent === "true") {
      setHasAbhaConsent(true)
    }
  }, [])

  // Store ABHA consent in localStorage
  useEffect(() => {
    if (hasAbhaConsent) {
      localStorage.setItem("TrustLynk-abha-consent", "true")
    } else {
      localStorage.removeItem("TrustLynk-abha-consent")
    }
  }, [hasAbhaConsent])

  // Refresh blockchain state when wallet connects/reconnects
  useEffect(() => {
    if (isConnected && address) {
      setTimeout(() => {
        refreshBlockchainState()
      }, 1000)
    } else {
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
    }
  }, [isConnected, address])

  const value: WalletContextType = {
    isConnected,
    address,
    userType,
    setUserType,
    connectWallet,
    disconnectWallet,
    isLoading,
    hasAbhaConsent,
    setHasAbhaConsent,
    isAdmin,
    isPolicyholder,
    isRegistered,
    blockchainLoading,
    refreshBlockchainState,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletContextProvider")
  }
  return context
}
