
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
import { addDriverAction, updateDriverAction } from '@/lib/actions';
import type { Driver } from '@/lib/types';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AddEditDriverDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  driver: Driver | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  contact: z.string().min(10, 'A valid contact number is required.'),
});

export default function AddEditDriverDialog({
  isOpen,
  setIsOpen,
  driver,
  onSuccess,
}: AddEditDriverDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!driver;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', contact: '' },
  });

  useEffect(() => {
    if (driver) {
      form.reset(driver);
    } else {
      form.reset({ name: '', contact: '' });
    }
  }, [driver, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditMode && driver) {
        await updateDriverAction({ ...values, id: driver.id });
      } else {
        await addDriverAction(values);
      }
      toast({
        title: 'Success',
        description: `Driver successfully ${isEditMode ? 'updated' : 'added'}.`,
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
    description: `Failed to ${isEditMode ? 'update' : 'add'} driver. ${errorMessage}`,
    variant: 'destructive',
  });
}
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
          <DialogDescription>
            Enter the details for the driver below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 555-1234" {...field} />
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
                {isEditMode ? 'Save Changes' : 'Add Driver'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
