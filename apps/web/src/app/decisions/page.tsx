'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DecisionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Decisions</h1>
          <p className="text-gray-500">Manage approval decisions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Decision
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Decision list will appear here. Connect to API to load decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
