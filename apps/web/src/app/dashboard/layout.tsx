'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <DashboardNav />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
