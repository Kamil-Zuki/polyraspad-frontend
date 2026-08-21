"use client"

import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-app-bg text-gray-300 py-12 px-4 sm:px-6 lg:px-8 relative custom-scroll">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
          <p className="text-gray-400">Basic concepts and guides for Polyraspad.</p>
        </div>

        <div className="space-y-4">
          <section className="glass-panel border border-white/10 rounded-xl p-6 bg-app-surface/40">
            <h2 className="text-xl font-bold text-white mb-3">Core Concepts</h2>
            <ul className="space-y-4 text-sm text-gray-300">
              <li>
                <strong className="text-white block mb-1">Projects & Languages</strong>
                Start by creating a project for the language you want to learn. All your vocabulary, decks, and reading materials belong to a specific project.
              </li>
              <li>
                <strong className="text-white block mb-1">Smart Reader</strong>
                Import texts or books. Click on any unknown word to get a translation, hear its pronunciation, and save it to your vocabulary for later review.
              </li>
              <li>
                <strong className="text-white block mb-1">Spaced Repetition (FSRS)</strong>
                Saved words are scheduled for review using the FSRS algorithm, which optimizes your memory retention by asking you to review words right before you forget them.
              </li>
              <li>
                <strong className="text-white block mb-1">Word Statuses</strong>
                Words are color-coded: <span className="text-blue-400">Blue (New)</span>, <span className="text-yellow-400">Yellow (Saved)</span>, and White (Known). You can also ignore words (like names) so they don't clutter your vocabulary.
              </li>
            </ul>
          </section>

          <section className="glass-panel border border-white/10 rounded-xl p-6 bg-app-surface/40">
            <h2 className="text-xl font-bold text-white mb-3">Chrome Extension</h2>
            <p className="text-sm text-gray-300 mb-4">
              Use the Polyraspad Chrome Extension to capture words and sentences directly from web pages and YouTube subtitles.
            </p>
            <div className="text-sm text-gray-400">
              <p>1. Install the extension from the Chrome Web Store.</p>
              <p>2. Ensure you are logged into Polyraspad.</p>
              <p>3. Select text on any website or use the subtitle capture on YouTube to send words to your active project.</p>
            </div>
          </section>
        </div>

        <div className="pt-4">
          <Link href="/support" className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
            Need more help? Contact Support <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
