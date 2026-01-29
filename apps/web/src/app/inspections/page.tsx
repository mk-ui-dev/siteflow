'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function InspectionsPage() {
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
          <CardTitle>Upcoming Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Inspection list will appear here. Connect to API to load inspections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
