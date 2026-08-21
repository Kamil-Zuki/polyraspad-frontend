import { redirect } from "next/navigation"

/**
 * Legacy /browser route — redirects to the unified Vocabulary page with the Cards tab active.
 * Keeps old bookmarks and links functional.
 */
export default function BrowserRedirect() {
  redirect("/vocabulary?tab=cards")
}
