"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import { getUserRole, registerUser, isContractInitialized } from '@/lib/blockchain'
import { toast } from 'sonner'

// Role constants
const ROLE_UNREGISTERED = 0
const ROLE_POLICYHOLDER = 1  // "Holder"
const ROLE_ADMIN = 2          // "Provider"

// Supported chain IDs
const SUPPORTED_CHAIN_IDS = [
  11155111,  // Sepolia
  31337,     // Hardhat Local
]

export type UserRole = 'unregistered' | 'holder' | 'provider'

interface MetaMaskWalletContextType {
  walletAddress: string | null
  userRole: UserRole
  isConnected: boolean
  isLoading: boolean
  chainId: number | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  registerAsHolder: () => Promise<void>
  registerAsProvider: () => Promise<void>
  checkUserRole: () => Promise<void>
}

const MetaMaskWalletContext = createContext<MetaMaskWalletContextType | undefined>(undefined)

export function MetaMaskWalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('unregistered')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)

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

    // Listen for MetaMask events
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener?.('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      disconnectWallet()
    } else {
      setWalletAddress(accounts[0])
      checkUserRoleInternal(accounts[0])
    }
  }

  const handleChainChanged = (newChainId: string) => {
    const chainIdNum = parseInt(newChainId, 16)
    setChainId(chainIdNum)

    if (!SUPPORTED_CHAIN_IDS.includes(chainIdNum)) {
      toast.warning('Unsupported Network', {
        description: 'Please switch to Sepolia Testnet or Hardhat Local'
      })
    }

    // Reload page on chain change (recommended by MetaMask)
    window.location.reload()
  }

  const checkWalletConnection = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()

      if (accounts.length > 0) {
        const address = accounts[0].address
        const network = await provider.getNetwork()

        setWalletAddress(address)
        setIsConnected(true)
        setChainId(Number(network.chainId))

        // Check user role from blockchain
        await checkUserRoleInternal(address)
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const checkUserRoleInternal = async (address: string) => {
    try {
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
      if (typeof window === 'undefined' || !window.ethereum) {
        toast.error('MetaMask not found', {
          description: 'Please install the MetaMask browser extension'
        })
        window.open('https://metamask.io/download/', '_blank')
        return
      }

      // Request accounts
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])

      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found', {
          description: 'Please unlock MetaMask and try again'
        })
        return
      }

      const address = accounts[0]
      const network = await provider.getNetwork()
      const currentChainId = Number(network.chainId)

      setWalletAddress(address)
      setIsConnected(true)
      setChainId(currentChainId)

      // Check if on supported network
      if (!SUPPORTED_CHAIN_IDS.includes(currentChainId)) {
        toast.warning('Please switch to the correct network', {
          description: 'This application requires Sepolia Testnet or Hardhat Local'
        })

        const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "31337")
        const targetChainHex = '0x' + targetChainId.toString(16)

        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainHex }], 
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              if (targetChainId === 31337) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x7a69',
                    chainName: 'Hardhat Local',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['http://127.0.0.1:8545'],
                  }],
                })
              } else {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0xaa36a7',
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  }],
                })
              }
            } catch (addError) {
              console.error('Failed to add network:', addError)
            }
          }
        }
      }

      // Check if contract is initialized
      try {
        const initialized = await isContractInitialized()
        if (!initialized) {
          toast.info('Contract not initialized', {
            description: 'The smart contract needs to be initialized first'
          })
        }
      } catch (e) {
        // Contract might not be deployed yet
        console.warn('Could not check contract initialization:', e)
      }

      // Check user role from blockchain
      await checkUserRoleInternal(address)

      toast.success('Wallet Connected', {
        description: `Address: ${address.slice(0, 6)}...${address.slice(-4)}`
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
    setChainId(null)

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
      const result = await registerUser(walletAddress, ROLE_POLICYHOLDER)

      if (result.success) {
        setUserRole('holder')
        localStorage.setItem('userRole', 'holder')

        toast.success('Registration Successful', {
          description: 'You are now registered as a Policy Holder'
        })
      } else {
        // If it's the E7 error, they are already registered, which is fine
        if (result.error && (result.error.includes("E7") || result.error.includes("already registered"))) {
           setUserRole('holder')
           localStorage.setItem('userRole', 'holder')
           toast.success('Welcome Back', {
             description: 'You are already registered.'
           })
        } else {
           throw new Error(result.error || 'Registration failed')
        }
      }
    } catch (error: any) {
      console.error('Error registering as holder:', error)
      toast.error('Registration Failed', {
        description: error.reason || error.message || 'Please try again'
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
      const result = await registerUser(walletAddress, ROLE_ADMIN)

      if (result.success) {
        setUserRole('provider')
        localStorage.setItem('userRole', 'provider')

        toast.success('Registration Successful', {
          description: 'You are now registered as a Policy Provider'
        })
      } else {
        throw new Error('Registration failed')
      }
    } catch (error: any) {
      console.error('Error registering as provider:', error)
      toast.error('Registration Failed', {
        description: error.reason || error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkUserRole = async () => {
    if (!walletAddress) return
    await checkUserRoleInternal(walletAddress)
  }

  const value: MetaMaskWalletContextType = {
    walletAddress,
    userRole,
    isConnected,
    isLoading,
    chainId,
    connectWallet,
    disconnectWallet,
    registerAsHolder,
    registerAsProvider,
    checkUserRole,
  }

  return (
    <MetaMaskWalletContext.Provider value={value}>
      {children}
    </MetaMaskWalletContext.Provider>
  )
}

// Export with the same name as the old hook so minimal frontend changes needed
export function useFreighterWallet() {
  const context = useContext(MetaMaskWalletContext)
  if (context === undefined) {
    throw new Error('useFreighterWallet must be used within a MetaMaskWalletProvider')
  }
  return context
}

// Also export as useMetaMaskWallet for clarity
export const useMetaMaskWallet = useFreighterWallet

// Re-export the provider with old name for compatibility
export const FreighterWalletProvider = MetaMaskWalletProvider
