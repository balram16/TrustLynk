"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  isConnected as freighterIsConnected,
  getPublicKey,
  getNetwork,
  isAllowed,
  setAllowed,
} from "@stellar/freighter-api"
import { getUserRole, registerUser, isContractInitialized } from '@/lib/blockchain'
import { toast } from 'sonner'

// Role constants
const ROLE_UNREGISTERED = 0
const ROLE_POLICYHOLDER = 1  // "Holder"
const ROLE_ADMIN = 2          // "Provider"

export type UserRole = 'unregistered' | 'holder' | 'provider'

interface FreighterWalletContextType {
  walletAddress: string | null
  userRole: UserRole
  isConnected: boolean
  isLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  registerAsHolder: () => Promise<void>
  registerAsProvider: () => Promise<void>
  checkUserRole: () => Promise<void>
}

const FreighterWalletContext = createContext<FreighterWalletContextType | undefined>(undefined)

export function FreighterWalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('unregistered')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Convert numeric role to string role
  const roleToString = (role: number): UserRole => {
    switch (role) {
      case ROLE_POLICYHOLDER:
        return 'holder'
      case ROLE_ADMIN:
        return 'provider'
      default:
        return 'unregistered'
    }
  }

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    try {
      const connected = await freighterIsConnected()
      if (connected) {
        const publicKey = await getPublicKey()
        
        // Validate public key before proceeding
        if (!publicKey || publicKey.trim() === '') {
          console.warn('Received empty public key from Freighter')
          return
        }
        
        setWalletAddress(publicKey)
        setIsConnected(true)
        
        // Check user role from blockchain
        await checkUserRoleInternal(publicKey)
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const checkUserRoleInternal = async (address: string) => {
    try {
      // Validate address before checking role
      if (!address || address.trim() === '') {
        console.warn('checkUserRoleInternal called with empty address')
        setUserRole('unregistered')
        return
      }
      
      const role = await getUserRole(address)
      setUserRole(roleToString(role))
      
      // Store in localStorage for persistence
      localStorage.setItem('userRole', roleToString(role))
      localStorage.setItem('walletAddress', address)
    } catch (error) {
      console.error('Error checking user role:', error)
      setUserRole('unregistered')
    }
  }

  const connectWallet = async () => {
    setIsLoading(true)
    try {
      // Check if Freighter is installed
      const connected = await freighterIsConnected()
      if (!connected) {
        toast.error('Freighter Wallet not found', {
          description: 'Please install the Freighter browser extension'
        })
        window.open('https://www.freighter.app/', '_blank')
        return
      }

      // Request access
      const allowed = await isAllowed()
      if (!allowed) {
        await setAllowed()
      }

      // Get public key (wallet address)
      const publicKey = await getPublicKey()
      
      // Validate public key
      if (!publicKey || publicKey.trim() === '') {
        toast.error('Failed to get wallet address', {
          description: 'Please make sure Freighter is properly configured'
        })
        return
      }
      
      // Check network
      const network = await getNetwork()
      if (network !== 'TESTNET') {
        toast.warning('Please switch to Testnet', {
          description: 'This application requires Stellar Testnet'
        })
      }

      setWalletAddress(publicKey)
      setIsConnected(true)

      // Check if contract is initialized
      const initialized = await isContractInitialized()
      if (!initialized) {
        toast.error('Contract not initialized', {
          description: 'Please initialize the contract first'
        })
        return
      }

      // Check user role from blockchain
      await checkUserRoleInternal(publicKey)

      toast.success('Wallet Connected', {
        description: `Address: ${publicKey.slice(0, 8)}...${publicKey.slice(-6)}`
      })

    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
    setUserRole('unregistered')
    setIsConnected(false)
    
    // Clear localStorage
    localStorage.removeItem('userRole')
    localStorage.removeItem('walletAddress')
    
    toast.info('Wallet Disconnected')
  }

  const registerAsHolder = async () => {
    if (!walletAddress) {
      toast.error('Please connect wallet first')
      return
    }

    setIsLoading(true)
    try {
      await registerUser(walletAddress, ROLE_POLICYHOLDER)
      
      setUserRole('holder')
      localStorage.setItem('userRole', 'holder')
      
      toast.success('Registration Successful', {
        description: 'You are now registered as a Policy Holder'
      })
    } catch (error: any) {
      console.error('Error registering as holder:', error)
      toast.error('Registration Failed', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const registerAsProvider = async () => {
    if (!walletAddress) {
      toast.error('Please connect wallet first')
      return
    }

    setIsLoading(true)
    try {
      await registerUser(walletAddress, ROLE_ADMIN)
      
      setUserRole('provider')
      localStorage.setItem('userRole', 'provider')
      
      toast.success('Registration Successful', {
        description: 'You are now registered as a Policy Provider'
      })
    } catch (error: any) {
      console.error('Error registering as provider:', error)
      toast.error('Registration Failed', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkUserRole = async () => {
    if (!walletAddress) return
    await checkUserRoleInternal(walletAddress)
  }

  const value: FreighterWalletContextType = {
    walletAddress,
    userRole,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    registerAsHolder,
    registerAsProvider,
    checkUserRole,
  }

  return (
    <FreighterWalletContext.Provider value={value}>
      {children}
    </FreighterWalletContext.Provider>
  )
}

export function useFreighterWallet() {
  const context = useContext(FreighterWalletContext)
  if (context === undefined) {
    throw new Error('useFreighterWallet must be used within a FreighterWalletProvider')
  }
  return context
}




