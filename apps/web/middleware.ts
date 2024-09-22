import {authMiddleware} from '@clerk/nextjs/server'

// Disable redirects
export default authMiddleware({publicRoutes: [/^(.*)/], debug: false})

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next
   * - static (static files)
   * - favicon.ico (favicon file)
   * - public folder
   * - public folder
   * - connect (Venice connect, oauth, which has separate auth logic)
   * - debug page
   */
  matcher: [
    // Do not run clerk on api routes. More annoying than helpful.
    // Unexpectedly blocking requests with apikey if user agent has something like the following
    // User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36
    '/((?!.*\\..*|_next|connect|api|debug).*)',
    '/',
    // TODO: Figure out how to work properly with clerk... Should probably not depend on Clerk in the API layer unless
    // clerk itself handles api key auth.
    // '/(trpc|connector)(.*)',
    '/(api|trpc|connector)(.*)',
  ],
}
