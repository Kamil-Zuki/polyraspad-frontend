"use client"

import { useState, useTransition, Suspense, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { resolvePublicApiBaseUrl } from "@/lib/api/public-api-url"
import { ROUTES } from "@/lib/constants"
import polyraspadLogo from "@/assets/polyraspad-logo.png"
import { apiClient } from "@/lib/api"

function AuthContent() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") || ""
  const mode = searchParams.get("mode")
  
  const apiBaseUrl = resolvePublicApiBaseUrl()
  const [isLogin, setIsLogin] = useState(mode === "register" ? false : mode === "login" ? true : !initialEmail)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [resendStatus, setResendStatus] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { login, register } = useAuth()
  const router = useRouter()

  const handleResendConfirmation = async () => {
    if (!email) return
    setIsResending(true)
    setResendStatus("")
    try {
      await apiClient.auth.resendConfirmationEmail(email)
      setResendStatus("Письмо подтверждения успешно отправлено. Проверьте вашу почту.")
    } catch (err: any) {
      setResendStatus(err?.message || "Не удалось отправить письмо повторно")
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    setResendStatus("")

    try {
      if (isLogin) {
        await login(email, password)
        startTransition(() => {
          router.push(ROUTES.HOME)
          router.refresh()
        })
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          return
        }
        await register(email, password, confirmPassword)
        setIsLogin(true)
        setPassword("")
        setConfirmPassword("")
        setSuccessMsg("Аккаунт успешно создан! Пожалуйста, проверьте вашу почту для подтверждения.")
      }
    } catch (err: any) {
      // Более детальная обработка ошибок
      let errorMessage = "Something went wrong"

      if (err instanceof Error) {
        errorMessage = err.message
        // Если это ошибка сети
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          errorMessage = `Could not connect to the server. Check that the API is available at ${apiBaseUrl}`
        }
      } else if (err?.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      console.error("Login error:", err)
    }
  }

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

        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {isLogin ? "Continue your learning journey" : "Start mastering new languages today"}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
            {(error.toLowerCase().includes("not confirmed") || error.toLowerCase().includes("email confirmed")) && (
              <div className="mt-2 pt-2 border-t border-red-500/20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending || !email}
                  className="text-xs font-semibold text-brand-primary hover:underline self-start flex items-center gap-1.5"
                >
                  {isResending ? (
                    <>
                      <i className="fas fa-spinner fa-spin" />
                      Отправка...
                    </>
                  ) : (
                    "Отправить письмо подтверждения повторно"
                  )}
                </button>
                {resendStatus && (
                  <span className="text-xs text-gray-300">{resendStatus}</span>
                )}
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-3">
            <i className="fas fa-check-circle" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className="fas fa-envelope text-gray-600" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark w-full pl-10"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className="fas fa-lock text-gray-600" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-dark w-full pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-600" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-dark w-full pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full py-3 mt-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isLogin ? (
                  <>
                    <i className="fas fa-sign-in-alt" /> Sign In
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus" /> Create Account
                  </>
                )}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-app-border">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
              setSuccessMsg("")
            }}
            className="text-sm text-gray-500 hover:text-brand-primary transition"
          >
            {isLogin ? (
              <>
                Don't have an account? <span className="text-brand-primary font-bold">Sign Up</span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-brand-primary font-bold">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-app-bg relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
