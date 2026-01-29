'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deliveries</h1>
          <p className="text-gray-500">Track material deliveries</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Delivery
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Delivery list will appear here. Connect to API to load deliveries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
