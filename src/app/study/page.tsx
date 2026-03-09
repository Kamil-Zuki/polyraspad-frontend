"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StudyPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-app-bg text-gray-200 font-sans">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  )
}
