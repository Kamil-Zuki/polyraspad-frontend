"use client"

export default function ReaderPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Reader</h1>
          <p className="text-gray-400">Read texts and capture vocabulary</p>
        </div>

        <div className="glass-panel rounded-xl p-8">
          <div className="text-center">
            <div className="mb-4">
              <i className="fas fa-book-reader text-6xl text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Reader</h2>
            <p className="text-gray-400">
              Text reader functionality will be implemented soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

