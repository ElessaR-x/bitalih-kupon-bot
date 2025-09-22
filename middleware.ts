import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Middleware logic buraya eklenebilir
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Auth sayfalarına herkes erişebilir
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true
        }
        // Diğer sayfalar için token gerekli
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Next-Auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
