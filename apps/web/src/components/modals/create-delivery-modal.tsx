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
import { Textarea } from '@/components/ui/textarea';
import { useCreateDelivery } from '@/hooks/use-deliveries';

const deliverySchema = z.object({
  materialName: z.string().min(3, 'Material name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  expectedDate: z.string().min(1, 'Expected date is required'),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface CreateDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateDeliveryModal({ open, onOpenChange, projectId }: CreateDeliveryModalProps) {
  const createDelivery = useCreateDelivery();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
  });

  const onSubmit = async (data: DeliveryFormData) => {
    try {
      await createDelivery.mutateAsync({ ...data, projectId });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create delivery:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Delivery</DialogTitle>
          <DialogDescription>Schedule a material delivery.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="materialName">Material Name *</Label>
            <Input id="materialName" {...register('materialName')} placeholder="Concrete, Steel, etc." />
            {errors.materialName && <p className="text-sm text-red-500">{errors.materialName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input id="quantity" {...register('quantity')} placeholder="100 tons" />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier *</Label>
            <Input id="supplier" {...register('supplier')} placeholder="Company name" />
            {errors.supplier && <p className="text-sm text-red-500">{errors.supplier.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedDate">Expected Date *</Label>
            <Input id="expectedDate" type="date" {...register('expectedDate')} />
            {errors.expectedDate && <p className="text-sm text-red-500">{errors.expectedDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Special instructions" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDelivery.isPending}>
              {createDelivery.isPending ? 'Scheduling...' : 'Schedule Delivery'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
