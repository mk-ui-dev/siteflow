'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-500">View project insights and metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Task analytics will appear here
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Inspection pass rates and quality metrics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
