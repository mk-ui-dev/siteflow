'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { CreateTaskModal } from '@/components/modals/create-task-modal';
import { useTasks, useStartTask, useCompleteTask } from '@/hooks/use-tasks';
import { Plus, Play, CheckCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PROJECT_ID = 'proj-demo-123';

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: Date;
  assignees?: any[];
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
};

const priorityColors: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'destructive',
};

export default function TasksPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: tasks, isLoading, error } = useTasks(PROJECT_ID);
  const startTask = useStartTask();
  const completeTask = useCompleteTask();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStartTask = async (id: string) => {
    setActionLoading(id);
    try {
      await startTask.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTask = async (id: string) => {
    setActionLoading(id);
    try {
      await completeTask.mutateAsync({ id });
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'title',
      header: 'Task',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted-foreground">ID: {row.original.id}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusColors[row.original.status] || 'default'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) =>
        row.original.priority ? (
          <Badge variant={priorityColors[row.original.priority] || 'default'}>
            {row.original.priority}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) =>
        row.original.dueDate ? (
          formatDate(row.original.dueDate)
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const task = row.original;
        const isActing = actionLoading === task.id;

        return (
          <div className="flex gap-2">
            {task.status === 'PENDING' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartTask(task.id)}
                disabled={isActing}
              >
                {isActing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCompleteTask(task.id)}
                disabled={isActing}
              >
                {isActing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-gray-500">Manage your construction tasks</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-500">
              Error loading tasks. Please make sure the API is running.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Expected API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-gray-500">Manage your construction tasks</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DataTable columns={columns} data={tasks || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        projectId={PROJECT_ID}
      />
    </>
  );
}
