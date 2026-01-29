'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { CreateDeliveryModal } from '@/components/modals/create-delivery-modal';
import { useDeliveries, useConfirmDelivery } from '@/hooks/use-deliveries';
import { Plus, CheckCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PROJECT_ID = 'proj-demo-123';

interface Delivery {
  id: string;
  materialName: string;
  status: string;
  supplier: string;
  expectedDate: Date;
  actualDate?: Date;
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  SCHEDULED: 'secondary',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

export default function DeliveriesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: deliveries, isLoading, error } = useDeliveries(PROJECT_ID);
  const confirmDelivery = useConfirmDelivery();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try {
      await confirmDelivery.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<Delivery>[] = [
    {
      accessorKey: 'materialName',
      header: 'Material',
      cell: ({ row }) => <div className="font-medium">{row.original.materialName}</div>,
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => <div className="text-sm">{row.original.supplier}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={statusColors[row.original.status] || 'default'}>{row.original.status}</Badge>,
    },
    {
      accessorKey: 'expectedDate',
      header: 'Expected',
      cell: ({ row }) => formatDate(row.original.expectedDate),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const delivery = row.original;
        const isActing = actionLoading === delivery.id;

        if (delivery.status === 'IN_TRANSIT') {
          return (
            <Button size="sm" variant="outline" onClick={() => handleConfirm(delivery.id)} disabled={isActing}>
              {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
            </Button>
          );
        }
        return null;
      },
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-500">Error loading deliveries.</p>
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
            <h1 className="text-3xl font-bold">Deliveries</h1>
            <p className="text-gray-500">Track material deliveries</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Delivery
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DataTable columns={columns} data={deliveries || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <CreateDeliveryModal open={createModalOpen} onOpenChange={setCreateModalOpen} projectId={PROJECT_ID} />
    </>
  );
}
