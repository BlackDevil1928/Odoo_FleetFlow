import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Truck,
    Navigation,
    Wrench,
    Receipt,
    BarChart2,
    LineChart,
    LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'

interface NavItem {
    label: string
    icon: React.ReactNode
    path: string
}

const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'Vehicle Registry', icon: <Truck size={18} />, path: '/vehicles' },
    { label: 'Trip Dispatcher', icon: <Navigation size={18} />, path: '/trips' },
    { label: 'Maintenance', icon: <Wrench size={18} />, path: '/maintenance' },
    { label: 'Trip & Expense', icon: <Receipt size={18} />, path: '/expenses' },
    { label: 'Performance', icon: <BarChart2 size={18} />, path: '/drivers' },
    { label: 'Analytics', icon: <LineChart size={18} />, path: '/analytics' },
]

export const Sidebar: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { clearAuth } = useAuthStore()

    const handleLogout = async () => {
        await authService.signOut()
        clearAuth()
        navigate('/login')
    }

    return (
        <aside className="w-56 min-h-screen flex flex-col bg-[hsl(222,47%,6%)] border-r border-[hsl(217,32%,14%)]">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-[hsl(217,32%,14%)]">
                <span className="text-lg font-bold text-white tracking-tight">
                    Fleet<span className="text-emerald-400">Flow</span>
                </span>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                                transition-all duration-150 text-left
                                ${isActive
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }
                            `}
                        >
                            <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-[hsl(217,32%,14%)]">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
