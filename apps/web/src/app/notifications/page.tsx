'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-500">Stay updated on project activities</p>
        </div>
        <Button variant="outline">Mark all as read</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notifications will appear here. Connect to API to load notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
