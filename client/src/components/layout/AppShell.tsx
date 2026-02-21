import React from 'react'
import { Sidebar } from './Sidebar'

interface AppShellProps {
    children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-[hsl(222,47%,5%)]">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
