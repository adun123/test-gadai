'use client'

import { useActionState } from 'react'
import { login } from './action'
import { Loader2 } from 'lucide-react'

const initialState = {
    error: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
                <div className="bg-primary/5 p-10 text-center border-b border-border/50">
                    <div className="mx-auto bg-primary text-primary-foreground w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
                        {/* Scale/Logo Icon */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v18" />
                            <path d="M6 8l-4 4 4 4" />
                            <path d="M18 8l4 4-4 4" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Pegadaian AI</h1>
                    <p className="text-muted-foreground text-sm font-medium">Pricing & Risk Analytics System</p>
                </div>

                <div className="p-10">
                    <form action={formAction} className="space-y-5">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="username"
                                className="block text-xs font-bold text-foreground uppercase tracking-wider"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-all outline-none placeholder:text-muted-foreground/50"
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="block text-xs font-bold text-foreground uppercase tracking-wider"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-all outline-none placeholder:text-muted-foreground/50"
                                placeholder="Enter password"
                            />
                        </div>

                        {state?.error && (
                            <div className="p-3 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl flex items-center justify-center">
                                {state.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Authorized Personnel Only
                        </p>
                        <p className="text-xs text-muted-foreground/50">
                            © 2024 PT Pegadaian
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
