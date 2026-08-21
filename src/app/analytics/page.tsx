import { redirect } from "next/navigation"

/** Legacy route: progress lives on the dashboard. */
export default function AnalyticsRedirectPage() {
  redirect("/dashboard#progress")
}
