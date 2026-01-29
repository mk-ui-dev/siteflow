'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateInspection } from '@/hooks/use-inspections';

const inspectionSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  scheduledDate: z.string().min(1, 'Date is required'),
  checklistId: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

interface CreateInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateInspectionModal({ open, onOpenChange, projectId }: CreateInspectionModalProps) {
  const createInspection = useCreateInspection();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
  });

  const onSubmit = async (data: InspectionFormData) => {
    try {
      await createInspection.mutateAsync({ ...data, projectId });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create inspection:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Inspection</DialogTitle>
          <DialogDescription>Schedule a quality inspection for a task.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskId">Task ID *</Label>
            <Input id="taskId" {...register('taskId')} placeholder="task-id" />
            {errors.taskId && <p className="text-sm text-red-500">{errors.taskId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Scheduled Date *</Label>
            <Input id="scheduledDate" type="datetime-local" {...register('scheduledDate')} />
            {errors.scheduledDate && <p className="text-sm text-red-500">{errors.scheduledDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="checklistId">Checklist (Optional)</Label>
            <Input id="checklistId" {...register('checklistId')} placeholder="checklist-id" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInspection.isPending}>
              {createInspection.isPending ? 'Scheduling...' : 'Schedule Inspection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
