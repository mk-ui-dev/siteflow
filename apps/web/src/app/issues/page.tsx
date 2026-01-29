'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function IssuesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Issues</h1>
          <p className="text-gray-500">Track and resolve construction issues</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Report Issue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Issue list will appear here. Connect to API to load issues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
