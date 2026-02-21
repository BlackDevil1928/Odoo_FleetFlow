import React, { useEffect } from 'react'
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Lazy-loaded pages
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'))

// Placeholder pages (to be built page-by-page)
const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'))
const VehiclesPage = React.lazy(() => import('@/pages/vehicles/VehiclesPage'))
const TripsPage = React.lazy(() => import('@/pages/trips/TripsPage'))
const DriversPage = React.lazy(() => import('@/pages/drivers/DriversPage'))
const AnalyticsPage = React.lazy(() => import('@/pages/analytics/AnalyticsPage'))
const MaintenancePage = React.lazy(() => import('@/pages/maintenance/MaintenancePage'))
const UnauthorizedPage = React.lazy(() => import('@/pages/UnauthorizedPage'))

const Spinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
)

const router = createBrowserRouter([
    // Public routes
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    { path: '/unauthorized', element: <UnauthorizedPage /> },

    // Role-based protected routes
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute allowedRoles={['manager', 'dispatcher', 'safety', 'finance']}>
                <DashboardPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/trips',
        element: (
            <ProtectedRoute allowedRoles={['manager', 'dispatcher']}>
                <TripsPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/drivers',
        element: (
            <ProtectedRoute allowedRoles={['manager', 'safety']}>
                <DriversPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/vehicles',
        element: (
            <ProtectedRoute allowedRoles={['manager', 'dispatcher', 'safety', 'finance']}>
                <VehiclesPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/maintenance',
        element: (
            <ProtectedRoute allowedRoles={['manager', 'dispatcher', 'safety', 'finance']}>
                <MaintenancePage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/analytics',
        element: (
            <ProtectedRoute allowedRoles={['manager', 'finance']}>
                <AnalyticsPage />
            </ProtectedRoute>
        ),
    },

    // Default redirect
    { path: '/', element: <Navigate to="/login" replace /> },
    { path: '*', element: <Navigate to="/login" replace /> },
])

/**
 * AppRouter — handles session restoration on mount before rendering routes.
 */
export const AppRouter: React.FC = () => {
    const { setUser, clearAuth, setLoading } = useAuthStore()

    useEffect(() => {
        // Restore session from Supabase on app boot
        setLoading(true)
        authService.getSession()
            .then((user) => setUser(user))
            .catch(() => clearAuth())
    }, [setUser, clearAuth, setLoading])

    return (
        <React.Suspense fallback={<Spinner />}>
            <RouterProvider router={router} />
        </React.Suspense>
    )
}
