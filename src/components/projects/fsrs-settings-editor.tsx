"use client"

import type { SrsSettingsDto } from "@/lib/api/types"

/** Редактор параметров FSRS (SrsParamsDto): requestRetention, maximumInterval, w, enableShortTerm. */
interface FsrsSettingsEditorProps {
  settings?: SrsSettingsDto
  onChange: (settings: SrsSettingsDto) => void
  onSave: () => void
  onCancel: () => void
  isLoading: boolean
}

export function FsrsSettingsEditor({
  settings,
  onChange,
  onSave,
  onCancel,
  isLoading,
}: FsrsSettingsEditorProps) {
  const requestRetention = settings?.requestRetention ?? 0.9
  const maximumInterval = settings?.maximumInterval ?? 36500
  const enableShortTerm = settings?.enableShortTerm ?? true

  const handleRequestRetentionChange = (value: number) => {
    onChange({
      ...settings,
      requestRetention: value,
      maximumInterval: settings?.maximumInterval ?? 36500,
      enableShortTerm: settings?.enableShortTerm ?? true,
      w: settings?.w,
    })
  }

  const handleMaximumIntervalChange = (value: number) => {
    onChange({
      ...settings,
      requestRetention: settings?.requestRetention ?? 0.9,
      maximumInterval: value,
      enableShortTerm: settings?.enableShortTerm ?? true,
      w: settings?.w,
    })
  }

  return (
    <div className="space-y-6">
      {/* Request Retention */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Request Retention: {(requestRetention * 100).toFixed(1)}%
        </label>
        <input
          type="range"
          min="0.7"
          max="0.99"
          step="0.01"
          value={requestRetention}
          onChange={(e) => handleRequestRetentionChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Target percentage of cards remembered (70% - 99%)
        </p>
      </div>

      {/* Maximum Interval */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Maximum Interval: {maximumInterval} days
        </label>
        <input
          type="number"
          min="1"
          max="36500"
          value={maximumInterval}
          onChange={(e) => handleMaximumIntervalChange(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
        />
        <p className="text-xs text-gray-500 mt-1">
          Maximum days between reviews (1 - 36500)
        </p>
      </div>

      {/* Enable Short Term */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableShortTerm}
            onChange={(e) =>
              onChange({
                ...settings,
                requestRetention: settings?.requestRetention ?? 0.9,
                maximumInterval: settings?.maximumInterval ?? 36500,
                enableShortTerm: e.target.checked,
                w: settings?.w,
              })
            }
            className="rounded"
          />
          <span className="text-sm text-gray-300">Enable Short Term Intervals</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-300 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}

