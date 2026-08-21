"use client"

import { useEffect, useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ROUTES } from "@/lib/constants"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMounted, setIsMounted] = useState(false)

  // Отслеживаем монтирование на клиенте для избежания проблем с гидратацией
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      startTransition(() => {
        router.push(ROUTES.AUTH)
      })
    }
  }, [isAuthenticated, isLoading, router, isMounted])

  // На сервере всегда возвращаем null, чтобы избежать несоответствия гидратации
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
