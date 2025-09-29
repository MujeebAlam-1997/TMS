
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addVehicleAction, updateVehicleAction } from '@/lib/actions';
import type { Vehicle } from '@/lib/types';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AddEditVehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vehicle: Vehicle | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required.'),
  type: z.string().min(2, 'Vehicle type is required.'),
});

export default function AddEditVehicleDialog({
  isOpen,
  setIsOpen,
  vehicle,
  onSuccess,
}: AddEditVehicleDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!vehicle;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { vehicleId: '', type: '' },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset(vehicle);
    } else {
      form.reset({ vehicleId: '', type: '' });
    }
  }, [vehicle, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditMode && vehicle) {
        await updateVehicleAction({ ...values, id: vehicle.id });
      } else {
        await addVehicleAction(values);
      }
      toast({
        title: 'Success',
        description: `Vehicle successfully ${isEditMode ? 'updated' : 'added'}.`,
      });
      onSuccess();
      setIsOpen(false);
    } catch (error) {
       const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'add'} vehicle. ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          <DialogDescription>
            Enter the details for the vehicle below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., VEH-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sedan, SUV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditMode ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
