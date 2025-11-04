"use client"

import { createContext, useContext, useState, useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { PageLoader } from "@/components/ui/page-loader"

const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: (loading: boolean) => {}
})

function RouteChangeTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setIsLoading } = useLoading()
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])
  return null
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading && <PageLoader />}
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => useContext(LoadingContext) 

