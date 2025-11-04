"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFreighterWallet } from '@/context/freighter-wallet-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  Shield, 
  Users, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function WalletAuthPage() {
  const { 
    walletAddress, 
    userRole, 
    isConnected, 
    isLoading,
    connectWallet,
    registerAsHolder,
    registerAsProvider 
  } = useFreighterWallet()
  
  const router = useRouter()

  // Redirect based on role
  useEffect(() => {
    if (isConnected && userRole !== 'unregistered') {
      if (userRole === 'provider') {
        router.push('/dashboard/provider')
      } else if (userRole === 'holder') {
        router.push('/dashboard/user')
      }
    }
  }, [isConnected, userRole, router])

  const getRoleIcon = () => {
    switch (userRole) {
      case 'provider':
        return <Shield className="h-6 w-6 text-[#fa6724]" />
      case 'holder':
        return <Users className="h-6 w-6 text-[#07a6ec]" />
      default:
        return <AlertCircle className="h-6 w-6 text-gray-400" />
    }
  }

  const getRoleBadge = () => {
    switch (userRole) {
      case 'provider':
        return <Badge className="bg-[#fa6724] hover:bg-[#e55613]">Policy Provider</Badge>
      case 'holder':
        return <Badge className="bg-[#07a6ec] hover:bg-[#0589c7]">Policy Holder</Badge>
      default:
        return <Badge variant="outline">Unregistered</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fa6724]/5 via-white to-[#07a6ec]/5 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#fa6724] to-[#07a6ec] bg-clip-text text-transparent">
              TrustLynk
            </span>
          </h1>
          <p className="text-muted-foreground">
            Connect your Freighter Wallet to access the platform
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-2">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-[#fa6724]/10 to-[#07a6ec]/10">
                <Wallet className="h-12 w-12 text-[#fa6724]" />
              </div>
            </div>
            <CardTitle className="text-2xl">Wallet Authentication</CardTitle>
            <CardDescription>
              Secure, passwordless login using Stellar blockchain
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Connection Status */}
            {!isConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                    👛 Connect your Freighter Wallet to get started
                  </p>
                </div>

                <Button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#fa6724] to-[#e55613] hover:from-[#e55613] hover:to-[#d44a0c] text-white h-12 text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-5 w-5" />
                      Connect Freighter Wallet
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Don't have Freighter Wallet?</p>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#07a6ec] hover:underline"
                  >
                    Install Freighter Extension →
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Wallet Info */}
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Wallet Connected
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <code className="text-xs break-all block bg-white dark:bg-gray-800 p-2 rounded">
                    {walletAddress}
                  </code>
                </div>

                {/* Role Status */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    {getRoleIcon()}
                    <div>
                      <p className="font-medium">Current Role</p>
                      <p className="text-sm text-muted-foreground">
                        {userRole === 'unregistered' ? 'Not registered yet' : `Registered as ${userRole}`}
                      </p>
                    </div>
                  </div>
                  {getRoleBadge()}
                </div>

                {/* Registration Options */}
                {userRole === 'unregistered' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-medium mb-4">Choose your role to continue:</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Policy Holder */}
                      <Card className="cursor-pointer hover:border-[#07a6ec] transition-colors border-2">
                        <CardHeader className="text-center pb-3">
                          <div className="flex justify-center mb-2">
                            <Users className="h-8 w-8 text-[#07a6ec]" />
                          </div>
                          <CardTitle className="text-lg">Policy Holder</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground text-center">
                            Purchase policies and file claims
                          </p>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li>✓ Browse policies</li>
                            <li>✓ Buy insurance</li>
                            <li>✓ Submit claims</li>
                            <li>✓ Track status</li>
                          </ul>
                          <Button
                            onClick={registerAsHolder}
                            disabled={isLoading}
                            className="w-full bg-[#07a6ec] hover:bg-[#0589c7] text-white"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                              </>
                            ) : (
                              'Register as Holder'
                            )}
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Policy Provider */}
                      <Card className="cursor-pointer hover:border-[#fa6724] transition-colors border-2">
                        <CardHeader className="text-center pb-3">
                          <div className="flex justify-center mb-2">
                            <Shield className="h-8 w-8 text-[#fa6724]" />
                          </div>
                          <CardTitle className="text-lg">Policy Provider</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground text-center">
                            Create and manage insurance policies
                          </p>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li>✓ Create policies</li>
                            <li>✓ Review claims</li>
                            <li>✓ Process payments</li>
                            <li>✓ View analytics</li>
                          </ul>
                          <Button
                            onClick={registerAsProvider}
                            disabled={isLoading}
                            className="w-full bg-[#fa6724] hover:bg-[#e55613] text-white"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                              </>
                            ) : (
                              'Register as Provider'
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      ⚠️ Choose carefully - role cannot be changed after registration
                    </p>
                  </div>
                )}

                {/* Already Registered - Redirecting */}
                {userRole !== 'unregistered' && (
                  <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#fa6724]" />
                    <p className="text-sm text-muted-foreground">
                      Redirecting to dashboard...
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Secured by Stellar Blockchain</p>
          <p className="text-xs mt-1">All transactions are recorded on-chain</p>
        </div>
      </div>
    </div>
  )
}




