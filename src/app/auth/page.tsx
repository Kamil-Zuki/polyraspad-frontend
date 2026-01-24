"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ROUTES } from "@/lib/constants"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const { login, register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        if (password !== confirmPassword) {
          setError("Пароли не совпадают")
          return
        }
        await register(email, password, confirmPassword)
      }
      startTransition(() => {
        router.push(ROUTES.HOME)
        router.refresh()
      })
    } catch (err: any) {
      // Более детальная обработка ошибок
      let errorMessage = "Произошла ошибка"

      if (err instanceof Error) {
        errorMessage = err.message
        // Если это ошибка сети
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          errorMessage = "Не удалось подключиться к серверу. Проверьте, что API сервер запущен на http://localhost:5206"
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-xl mr-4 shadow-glow">
            P
          </div>
          <span className="font-bold text-white text-3xl tracking-tight">PVS.ai</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {isLogin ? "Continue your learning journey" : "Start mastering new languages today"}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <i className="fas fa-exclamation-circle" />
            {error}
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
