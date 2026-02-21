import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronDown } from 'lucide-react'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/auth'

/** Role → redirect path map — all roles land on dashboard */
const ROLE_ROUTES: Record<UserRole, string> = {
    manager: '/dashboard',
    dispatcher: '/dashboard',
    safety: '/dashboard',
    finance: '/dashboard',
}

const ROLES: { label: string; value: UserRole }[] = [
    { label: 'Manager', value: 'manager' },
    { label: 'Dispatcher', value: 'dispatcher' },
    { label: 'Safety', value: 'safety' },
    { label: 'Finance', value: 'finance' },
]

/**
 * LoginPage — matches wireframe:
 *  • FleetFlow logo + truck icon centered top
 *  • Role selector badge (top-right of card)
 *  • Email input
 *  • Password input with show/hide toggle
 *  • Login button
 *  • Forgot password link
 */
const LoginPage: React.FC = () => {
    const navigate = useNavigate()
    const { setUser } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<UserRole>('dispatcher')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showRoleDD, setShowRoleDD] = useState(false)
    const [forgotSent, setForgotSent] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            setError('Please fill in all fields.')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const user = await authService.signIn(email, password)
            setUser(user)
            navigate(ROLE_ROUTES[user.role], { replace: true })
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed.')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) { setError('Enter your email first.'); return }
        setLoading(true)
        setError(null)
        try {
            await authService.forgotPassword(email)
            setForgotSent(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            {/* Background grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative w-full max-w-md z-10">
                {/* Card */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-black/60">

                    {/* Role selector badge — top-right, matching wireframe */}
                    <div className="absolute top-4 right-4">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowRoleDD(!showRoleDD)}
                                className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/40 text-blue-400
                           text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-blue-600/30 transition-colors"
                            >
                                {ROLES.find(r => r.value === role)?.label}
                                <ChevronDown size={12} className={`transition-transform ${showRoleDD ? 'rotate-180' : ''}`} />
                            </button>
                            {showRoleDD && (
                                <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 min-w-[130px] overflow-hidden">
                                    {ROLES.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => { setRole(r.value); setShowRoleDD(false) }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${role === r.value
                                                    ? 'bg-blue-600/30 text-blue-400 font-semibold'
                                                    : 'text-slate-300 hover:bg-slate-700'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logo — circle in wireframe = truck icon */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                            flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
                            <Truck size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">FleetFlow</h1>
                        <p className="text-slate-400 text-sm mt-1">Logistics Management Platform</p>
                    </div>

                    {/* Error alert */}
                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5">
                            <AlertCircle size={16} className="text-red-400 shrink-0" />
                            <span className="text-red-400 text-sm">{error}</span>
                        </div>
                    )}

                    {/* Forgot password success */}
                    {forgotSent && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-5">
                            <span className="text-green-400 text-sm">Password reset email sent! Check your inbox.</span>
                        </div>
                    )}

                    {/* Login form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                                Email / Username
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl
                             pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                             transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl
                             pl-10 pr-11 py-3 text-sm text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                             transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                         text-white font-semibold py-3 rounded-xl transition-all duration-200
                         shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {/* Forgot password link */}
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
                        >
                            Forgot password?
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                            Create account →
                        </button>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    FleetFlow v1.0 · Secured by Supabase Auth
                </p>
            </div>
        </div>
    )
}

export default LoginPage
