import { redirect } from "next/navigation"

// Отдельная страница Generator не используется: редирект на Editor с вкладкой AI
export default function GeneratorPage() {
  redirect("/editor?tab=ai")
}
