'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type LoginState = { error?: string } | null;

export async function login(prevState: LoginState, formData: FormData) {
    const username = formData.get('username')
    const password = formData.get('password')

    let expectedUsername = process.env.NEXT_PUBLIC_POC_USERNAME
    let expectedPassword = process.env.NEXT_PUBLIC_POC_PASSWORD

    // Sanitize quotes if present
    if (expectedUsername?.startsWith('"') && expectedUsername?.endsWith('"')) {
        expectedUsername = expectedUsername.slice(1, -1)
    }
    if (expectedPassword?.startsWith('"') && expectedPassword?.endsWith('"')) {
        expectedPassword = expectedPassword.slice(1, -1)
    }

    if (
        username === expectedUsername &&
        password === expectedPassword
    ) {
        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set('session', 'bg-authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        })

        redirect('/dashboard')
    } else {
        return { error: 'Invalid credentials' }
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    redirect('/login')
}
