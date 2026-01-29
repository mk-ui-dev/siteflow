'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/data-table';
import { FileUpload } from '@/components/file-upload';
import { useFiles, useDeleteFile } from '@/hooks/use-files';
import { Upload, Download, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PROJECT_ID = 'proj-demo-123';

interface FileItem {
  id: string;
  name: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export default function FilesPage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { data: files, isLoading, error } = useFiles(PROJECT_ID);
  const deleteFile = useDeleteFile();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile.mutateAsync(id);
    }
  };

  const columns: ColumnDef<FileItem>[] = [
    {
      accessorKey: 'name',
      header: 'File Name',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => <div className="text-sm">{(row.original.size / 1024).toFixed(1)} KB</div>,
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Uploaded By',
      cell: ({ row }) => <div className="text-sm">{row.original.uploadedBy}</div>,
    },
    {
      accessorKey: 'uploadedAt',
      header: 'Uploaded',
      cell: ({ row }) => formatDate(row.original.uploadedAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-500">Error loading files.</p>
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
            <h1 className="text-3xl font-bold">Files</h1>
            <p className="text-gray-500">Manage project files and documents</p>
          </div>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Files</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DataTable columns={columns} data={files || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <FileUpload
            projectId={PROJECT_ID}
            onUploadComplete={() => setUploadModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
