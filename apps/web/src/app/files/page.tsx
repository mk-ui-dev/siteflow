'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-gray-500">Manage project files and documents</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            File list will appear here. Connect to API to load files.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
