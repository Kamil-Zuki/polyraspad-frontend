"use client"

import { useEffect, useState, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { resolvePublicApiBaseUrl } from "@/lib/api/public-api-url"
import { ROUTES } from "@/lib/constants"
import polyraspadLogo from "@/assets/polyraspad-logo.png"

type Status = "loading" | "success" | "error"

function ConfirmContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const userId = searchParams.get("userId")
    const token = searchParams.get("token")

    if (!userId || !token) {
      setErrorMessage("Ссылка недействительна: отсутствуют необходимые параметры.")
      setStatus("error")
      return
    }

    const apiBase = resolvePublicApiBaseUrl()
    const url = `${apiBase}/api/Auth/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`

    fetch(url, { method: "GET" })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success")
        } else {
          const data = await res.json().catch(() => ({}))
          setErrorMessage(data?.error || "Не удалось подтвердить email. Возможно, ссылка устарела.")
          setStatus("error")
        }
      })
      .catch(() => {
        setErrorMessage("Не удалось подключиться к серверу. Проверьте соединение и попробуйте снова.")
        setStatus("error")
      })
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-app-bg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-10 glass-panel rounded-2xl border-app-border shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Image
            src={polyraspadLogo}
            alt="Polyraspad logo"
            priority
            className="mr-4 h-14 w-14 rounded-2xl object-cover shadow-glow"
          />
          <span className="font-bold text-white text-3xl tracking-tight">Polyraspad</span>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-brand-primary animate-spin" />
              <i className="fas fa-envelope text-brand-primary text-2xl" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Подтверждение email</h1>
              <p className="text-gray-500 text-sm">Пожалуйста, подождите...</p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-green-500/10 border border-green-500/30" />
              <i className="fas fa-check-circle text-green-400 text-4xl" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Email подтверждён!</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ваш аккаунт успешно активирован. Теперь вы можете войти и начать своё путешествие в изучении языков.
              </p>
            </div>
            <div className="w-full pt-2">
              <Link
                href={ROUTES.AUTH}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl font-semibold transition"
              >
                <i className="fas fa-sign-in-alt" />
                Войти в аккаунт
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/10 border border-red-500/30" />
              <i className="fas fa-times-circle text-red-400 text-4xl" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Что-то пошло не так</h1>
              <p className="text-gray-400 text-sm leading-relaxed">{errorMessage}</p>
            </div>
            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
              Ссылки для подтверждения действуют ограниченное время. Запросите новое письмо на странице входа.
            </div>
            <div className="w-full">
              <Link
                href={ROUTES.AUTH}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl font-semibold transition"
              >
                <i className="fas fa-redo" />
                Запросить новое письмо
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-app-bg">
          <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
