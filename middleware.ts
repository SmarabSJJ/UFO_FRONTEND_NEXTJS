import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Clear seat cookies on every request - only keep LinkedIn cookies
  // This ensures seat information is only passed via URL parameters
  // Note: We don't delete _temp_seat_redirect here because middleware runs before
  // the page component, and we need the page to read it first. It will expire naturally (10 seconds)
  response.cookies.delete("temp_seat");
  response.cookies.delete("seat");
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 
     * Note: We include API routes to ensure seat cookies are cleared everywhere
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

