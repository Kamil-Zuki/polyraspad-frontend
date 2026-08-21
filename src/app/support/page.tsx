"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Send } from "lucide-react"

export default function SupportPage() {
  const { user, isLoading } = useAuth()
  const [manualEmail, setManualEmail] = useState("")
  const email = user?.email || manualEmail
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields.")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success("Your message has been sent. We'll be in touch soon!")
      setSubject("")
      setMessage("")
    } catch {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@polyraspad.online"

  return (
    <div className="min-h-screen bg-app-bg text-gray-300 py-12 px-4 sm:px-6 lg:px-8 custom-scroll relative">
      <div className="max-w-2xl mx-auto relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Support</h1>
          <p className="text-gray-400">
            Need help? Contact us at{" "}
            <a href={`mailto:${supportEmail}`} className="text-brand-primary hover:underline">
              {supportEmail}
            </a>{" "}
            or use the form below.
          </p>
        </div>

        <div className="glass-panel border border-white/10 rounded-xl p-6 sm:p-8 bg-app-surface/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                disabled={isLoading || !!user?.email}
                value={email}
                onChange={(e) => setManualEmail(e.target.value)}
                className="w-full bg-app-bg/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-app-bg/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-app-bg/80 border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-primary text-white py-3 rounded-lg font-medium hover:bg-brand-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
