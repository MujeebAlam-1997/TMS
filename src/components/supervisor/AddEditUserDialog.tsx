'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import type { User, UserRole } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addUserAction, getAllUsersAction, updateUserAction } from '@/lib/actions';

interface AddEditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user?: User | null;
  onUserAddedOrUpdated: () => void;
}

const formSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  role: z.enum(['User', 'Supervisor', 'Manager', 'PD']),
  password: z.string().min(3, 'Password must be at least 3 characters.'),
  pdId: z.string().optional(),
}).refine(data => {
    if (data.role === 'User') {
      return !!data.pdId;
    }
    return true;
  }, {
    message: "A PD must be assigned to a User.",
    path: ["pdId"],
});

export default function AddEditUserDialog({
  isOpen,
  setIsOpen,
  user,
  onUserAddedOrUpdated
}: AddEditUserDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!user;
  const [pdUsers, setPdUsers] = useState<User[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeNumber: '',
      name: '',
      username: '',
      role: 'User',
      password: '',
      pdId: '',
    },
  });
  
  const selectedRole = form.watch('role');

  useEffect(() => {
    async function fetchPds() {
        const allUsers = await getAllUsersAction();
        setPdUsers(allUsers.filter(u => u.role === 'PD'));
    }
    fetchPds();
  }, [])

  useEffect(() => {
    if (user) {
      form.reset({
        employeeNumber: user.employeeNumber,
        name: user.name,
        username: user.username,
        role: user.role,
        password: user.password,
        pdId: user.pdId
      });
    } else {
      form.reset({
        employeeNumber: '',
        name: '',
        username: '',
        role: 'User',
        password: '',
        pdId: '',
      });
    }
  }, [user, form]);

  const {
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditMode && user) {
        await updateUserAction({ ...values, id: user.id });
      } else {
        await addUserAction(values);
      }
      
      toast({
        title: isEditMode ? 'User Updated' : 'User Created',
        description: `User ${values.username} has been successfully ${
          isEditMode ? 'updated' : 'created'
        }.`,
      });
      onUserAddedOrUpdated();
      setIsOpen(false);
    } catch (error) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Unknown error occurred';

  toast({
    title: 'An error occurred',
    description: `Failed to save the user. ${errorMessage}`,
    variant: 'destructive',
  });
}

  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the user's details below."
              : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="employeeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="PD">PD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedRole === 'User' && (
              <FormField
              control={form.control}
              name="pdId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign PD</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a PD" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {pdUsers.map(pd => (
                            <SelectItem key={pd.id} value={pd.id}>{pd.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
