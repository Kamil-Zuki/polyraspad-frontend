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
    <div className="flex items-center justify-center min-h-screen bg-dark-900">
      <div className="w-full max-w-md p-8 glass-panel rounded-xl border-white/10 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg shadow-purple-500/20">
            P
          </div>
          <span className="font-bold text-white text-2xl tracking-tight">PVS.ai</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-envelope text-gray-500" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-lock text-gray-500" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                placeholder="••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                  placeholder="••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {isLogin ? (
                  <>
                    <i className="fas fa-sign-in-alt" /> Sign In
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus" /> Sign Up
                  </>
                )}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
            }}
            className="text-sm text-gray-400 hover:text-brand-purple transition"
          >
            {isLogin ? (
              <>
                Don't have an account? <span className="text-brand-purple font-medium">Sign Up</span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-brand-purple font-medium">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
