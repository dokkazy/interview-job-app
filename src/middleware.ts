import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the path is public (login, register, etc.)
  const isPublicPath = path === "/login" || path === "/register" || path.startsWith("/onboarding")

  // Get the token from the cookies
  const token = request.cookies.get("auth-token")?.value

  // If the user is logged in and trying to access public paths, redirect to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If the user is not logged in and trying to access protected paths, redirect to login
  if (!token && !isPublicPath && !path.startsWith("/_next") && !path.startsWith("/api") && path !== "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/profile/:path*",
    "/jobs/:path*",
    "/messages/:path*",
    "/interviews/:path*",
    "/onboarding/:path*",
  ],
}
