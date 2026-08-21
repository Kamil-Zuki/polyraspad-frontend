"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, XCircle } from "lucide-react"

export function LimitPaywallModal() {
  const [open, setOpen] = useState(false)
  const [limitKey, setLimitKey] = useState<string>("maxCards")
  const router = useRouter()

  useEffect(() => {
    const handleLimitExceeded = (e: Event) => {
      const customEvent = e as CustomEvent<{ limitKey: string }>
      setLimitKey(customEvent.detail?.limitKey || "maxCards")
      setOpen(true)
    }

    window.addEventListener("billingLimitExceeded", handleLimitExceeded)
    return () => window.removeEventListener("billingLimitExceeded", handleLimitExceeded)
  }, [])

  const limitName = limitKey === "maxProjects" ? "проектов" : "карточек"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-6 w-6 text-destructive" />
            <DialogTitle>Лимит исчерпан</DialogTitle>
          </div>
          <DialogDescription>
            Вы достигли максимального количества {limitName} для вашего тарифа.
            Перейдите на тариф Pro, чтобы продолжить без ограничений.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Позже
          </Button>
          <Button onClick={() => {
            setOpen(false)
            router.push("/billing")
          }} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Перейти на Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
