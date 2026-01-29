'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { CreateIssueModal } from '@/components/modals/create-issue-modal';
import { useIssues } from '@/hooks/use-issues';
import { Plus, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PROJECT_ID = 'proj-demo-123';

interface Issue {
  id: string;
  title: string;
  status: string;
  severity: string;
  reportedDate: Date;
  assignee?: any;
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'secondary',
};

const severityColors: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'destructive',
};

export default function IssuesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: issues, isLoading, error } = useIssues(PROJECT_ID);

  const columns: ColumnDef<Issue>[] = [
    {
      accessorKey: 'title',
      header: 'Issue',
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
      cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'default'}>{row.original.status}</Badge>,
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => <Badge variant={severityColors[row.original.severity] || 'default'}>{row.original.severity}</Badge>,
    },
    {
      accessorKey: 'reportedDate',
      header: 'Reported',
      cell: ({ row }) => formatDate(row.original.reportedDate),
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      cell: ({ row }) =>
        row.original.assignee ? <span>{row.original.assignee.name}</span> : <span className="text-muted-foreground">Unassigned</span>,
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-500">Error loading issues.</p>
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
            <h1 className="text-3xl font-bold">Issues</h1>
            <p className="text-gray-500">Track and resolve construction issues</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Report Issue
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DataTable columns={columns} data={issues || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <CreateIssueModal open={createModalOpen} onOpenChange={setCreateModalOpen} projectId={PROJECT_ID} />
    </>
  );
}
