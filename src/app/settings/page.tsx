"use client"

import { UserSettingsForm } from "@/components/settings/user-settings-form"

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <UserSettingsForm />
      </div>
    </div>
  )
}

