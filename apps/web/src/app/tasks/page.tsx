'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-500">Manage your construction tasks</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Task list will appear here. Connect to API to load tasks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
