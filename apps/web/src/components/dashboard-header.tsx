'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from './ui/button';
import { LogOut, User } from 'lucide-react';

export function DashboardHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold">Welcome back, {user?.name}</h2>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          {user?.role}
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
