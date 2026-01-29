'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { useInspections, usePassInspection, useRejectInspection } from '@/hooks/use-inspections';
import { Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

const PROJECT_ID = 'proj-demo-123';

interface Inspection {
  id: string;
  taskId: string;
  status: string;
  scheduledDate: Date;
  conductedDate?: Date;
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  SCHEDULED: 'secondary',
  IN_PROGRESS: 'warning',
  PASSED: 'success',
  FAILED: 'destructive',
};

export default function InspectionsPage() {
  const { data: inspections, isLoading, error } = useInspections(PROJECT_ID);
  const passInspection = usePassInspection();
  const rejectInspection = useRejectInspection();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handlePass = async (id: string) => {
    setActionLoading(id);
    try {
      await passInspection.mutateAsync({ id });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectInspection.mutateAsync({ id, data: { reason: 'Does not meet standards' } });
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<Inspection>[] = [
    {
      accessorKey: 'id',
      header: 'Inspection ID',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.id.slice(0, 8)}...</div>
      ),
    },
    {
      accessorKey: 'taskId',
      header: 'Task',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.taskId}</div>
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
      accessorKey: 'scheduledDate',
      header: 'Scheduled',
      cell: ({ row }) => formatDate(row.original.scheduledDate),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const inspection = row.original;
        const isActing = actionLoading === inspection.id;

        if (inspection.status === 'IN_PROGRESS') {
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePass(inspection.id)}
                disabled={isActing}
              >
                {isActing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(inspection.id)}
                disabled={isActing}
              >
                {isActing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inspections</h1>
            <p className="text-gray-500">Schedule and conduct quality inspections</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-500">Error loading inspections.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspections</h1>
          <p className="text-gray-500">Schedule and conduct quality inspections</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Inspection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable columns={columns} data={inspections || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
