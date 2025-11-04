"use client";
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Building, Zap, Lock, Clock, CheckCircle, Heart, Plane, Car, Home as HomeIcon, Users } from "lucide-react"
import LandingHeader from "@/components/landing/landing-header"
import ChatbotWidget from "@/components/chatbot/chatbot-widget"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fa6724]/10 via-white to-[#07a6ec]/10 dark:from-[#fa6724]/5 dark:via-gray-950 dark:to-[#07a6ec]/5 py-20 md:py-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#fa6724]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#07a6ec]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="inline-block">
                <span className="inline-flex items-center rounded-full bg-[#fa6724]/10 px-4 py-2 text-sm font-medium text-[#fa6724] ring-1 ring-inset ring-[#fa6724]/20">
                  <Zap className="h-4 w-4 mr-2" />
                  Powered by Stellar Blockchain
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-[#fa6724] to-[#e55613] bg-clip-text text-transparent">TrustLynk</span>
                <br />
                <span className="text-gray-900 dark:text-white">Insurance Claims</span>
                <br />
                <span className="bg-gradient-to-r from-[#07a6ec] to-[#0589c7] bg-clip-text text-transparent">Reimagined</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Experience lightning-fast claim processing with AI-powered verification, blockchain security, and instant UPI payouts—all in one revolutionary platform.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#fa6724]/10 flex items-center justify-center group-hover:bg-[#fa6724] transition-colors">
                    <CheckCircle className="h-5 w-5 text-[#fa6724] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-lg">File claims in minutes, not days</span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#07a6ec]/10 flex items-center justify-center group-hover:bg-[#07a6ec] transition-colors">
                    <CheckCircle className="h-5 w-5 text-[#07a6ec] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-lg">AI + Blockchain verified security</span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#fa6724]/10 flex items-center justify-center group-hover:bg-[#fa6724] transition-colors">
                    <CheckCircle className="h-5 w-5 text-[#fa6724] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-lg">Instant UPI payouts upon approval</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-gradient-to-r from-[#fa6724] to-[#e55613] hover:from-[#e55613] hover:to-[#d44a0c] text-white shadow-lg hover:shadow-xl transition-all">
                    Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#07a6ec] text-[#07a6ec] hover:bg-[#07a6ec] hover:text-white transition-all"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-in-delay">
              <div className="relative h-[400px] md:h-[550px] w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
                <Image
                  src="https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2070&auto=format&fit=crop"
                  alt="TrustLynk Dashboard"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#fa6724]/20 to-[#07a6ec]/20"></div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                  <div className="flex items-start gap-3 animate-bounce-slow">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                      <Image
                        src="https://i.ibb.co/JFW8D5KV/claimsaathi-goodmood-happy.png"
                        alt="AI Assistant"
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    </div>
                    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-4 max-w-[85%] shadow-xl">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        👋 Hi! I'm your AI Claims Assistant. Ready to help you process your claim in just 3 minutes!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Stats badges */}
              <div className="absolute -bottom-8 -right-8 flex flex-col gap-3">
                <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-[#07a6ec] to-[#0589c7] flex flex-col items-center justify-center shadow-xl animate-float">
                  <span className="text-white font-bold text-3xl">90%</span>
                  <span className="text-white text-xs font-medium">Faster</span>
                </div>
              </div>
              <div className="absolute -top-6 -left-6 h-20 w-20 rounded-xl bg-gradient-to-br from-[#fa6724] to-[#e55613] flex flex-col items-center justify-center shadow-xl animate-float-delay">
                <Shield className="h-8 w-8 text-white mb-1" />
                <span className="text-white text-xs font-medium">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block">
              <span className="inline-flex items-center rounded-full bg-[#07a6ec]/10 px-4 py-2 text-sm font-medium text-[#07a6ec] ring-1 ring-inset ring-[#07a6ec]/20 mb-4">
                Why Choose TrustLynk
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Revolutionary Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              TrustLynk combines cutting-edge technology with intuitive design to transform the insurance claims
              experience into something magical.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-[#fa6724] dark:hover:border-[#fa6724] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#fa6724]/5 to-[#07a6ec]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="mb-5 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#fa6724]/10 to-[#07a6ec]/10 group-hover:from-[#fa6724] group-hover:to-[#e55613] transition-all duration-300">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-[#fa6724] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blockchain Section */}
      <section className="py-16 px-4 md:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Blockchain Technology</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              TrustLynk leverages blockchain technology to ensure secure, transparent, and efficient insurance claim
              processing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=2232&auto=format&fit=crop"
                alt="Blockchain Technology"
                width={600}
                height={400}
                className="rounded-xl shadow-lg object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#fa6724] flex items-center justify-center text-white">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Claim Submission</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      User submits claim with required documentation through the platform.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#fa6724] flex items-center justify-center text-white">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Smart Contract Verification</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Blockchain smart contract receives verification proof and validates the claim.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#fa6724] flex items-center justify-center text-white">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Policy Terms Check</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Contract automatically checks policy terms and coverage details.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#fa6724] flex items-center justify-center text-white">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Automatic Payment</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      If valid, contract triggers automatic payment via UPI to the policyholder.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#fa6724] flex items-center justify-center text-white">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Immutable Record</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      All verification steps, approvals, and payment are recorded on blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-r from-[#fa6724] to-[#07a6ec] text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Insurance Experience?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied users who have simplified their insurance claims process with TrustLynk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button className="bg-white text-[#fa6724] hover:bg-gray-100">Get Started Now</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white text-white hover:bg-white/20">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ChatbotWidget />
    </div>
  )
}

const features = [
  {
    icon: <Zap className="h-8 w-8 text-[#fa6724] group-hover:text-white transition-colors" />,
    title: "Lightning Fast Processing",
    description: "Process claims in 3 minutes with AI-powered automation. No more waiting weeks for approvals.",
  },
  {
    icon: <Shield className="h-8 w-8 text-[#07a6ec] group-hover:text-white transition-colors" />,
    title: "AI-Powered Assistant",
    description: "Smart AI assistant guides you through every step, answers questions, and provides instant updates.",
  },
  {
    icon: <Lock className="h-8 w-8 text-[#fa6724] group-hover:text-white transition-colors" />,
    title: "Blockchain Security",
    description: "Stellar blockchain ensures tamper-proof records with military-grade encryption and smart contract automation.",
  },
  {
    icon: <Heart className="h-8 w-8 text-[#07a6ec] group-hover:text-white transition-colors" />,
    title: "ABDM Integration",
    description: "Seamlessly fetch verified health records from India's Ayushman Bharat Digital Mission for instant validation.",
  },
  {
    icon: <Building className="h-8 w-8 text-[#fa6724] group-hover:text-white transition-colors" />,
    title: "Fraud Prevention",
    description: "Advanced AI algorithms detect anomalies and prevent fraudulent claims, protecting both insurers and policyholders.",
  },
  {
    icon: <Users className="h-8 w-8 text-[#07a6ec] group-hover:text-white transition-colors" />,
    title: "Instant UPI Payouts",
    description: "Receive approved claim amounts directly to your bank via UPI within minutes of approval.",
  },
]



