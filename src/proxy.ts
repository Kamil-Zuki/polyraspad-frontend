import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Публичные маршруты
  if (pathname === "/auth") {
    return NextResponse.next()
  }

  // Проверяем наличие токена для защищенных маршрутов
  // В proxy мы можем проверить только cookies, не localStorage
  // Поэтому проверяем наличие cookie или пропускаем (проверка будет в компонентах)
  const token = request.cookies.get("accessToken")?.value

  // Если нет токена в cookies, но это не страница авторизации - пропускаем
  // Фактическая проверка будет в ProtectedRoute компоненте
  // Proxy здесь используется для базовой защиты
  if (!token && pathname !== "/auth" && !pathname.startsWith("/_next")) {
    // Можно добавить дополнительную логику, но основная проверка в компонентах
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
