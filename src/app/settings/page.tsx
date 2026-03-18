import { redirect } from "next/navigation"

/** Старый маршрут: перенаправление на профиль. */
export default function SettingsRedirectPage() {
  redirect("/profile")
}
