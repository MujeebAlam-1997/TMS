'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { changePasswordAction } from '@/lib/actions';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const formSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required.'),
    newPassword: z.string().min(3, 'New password must be at least 3 characters.'),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ChangePasswordDialog({ isOpen, setIsOpen }: ChangePasswordDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const {formState: {isSubmitting}} = form;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        try {
            const result = await changePasswordAction({
                userId: user.id,
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });

            if (result.success) {
                toast({
                    title: 'Password Changed',
                    description: 'Your password has been successfully updated.',
                });
                setIsOpen(false);
                form.reset();
            } else {
                 toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            }

        } catch (error) {
            toast({
                title: 'Update Failed',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive'
            })
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Update your account password below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                 <div className="space-y-2">
                    <p className="text-sm font-medium">Employee Number: <span className="font-normal text-muted-foreground">{user?.employeeNumber}</span></p>
                    <p className="text-sm font-medium">Name: <span className="font-normal text-muted-foreground">{user?.name}</span></p>
                </div>
                <FormField
                    control={form.control}
                    name="oldPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Old Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
