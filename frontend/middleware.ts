import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Check if the user is accessing a protected route
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const session = request.cookies.get('session')

        // If no session cookie exists, redirect to login
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/dashboard/:path*',
}
