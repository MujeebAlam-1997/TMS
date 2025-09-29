'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteUserAction } from '@/lib/actions';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User;
  onUserDeleted: () => void;
}

export default function DeleteUserDialog({
  isOpen,
  setIsOpen,
  user,
  onUserDeleted,
}: DeleteUserDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteUserAction(user.id);
        toast({
          title: 'User Deleted',
          description: `User ${user.username} has been successfully deleted.`,
          variant: 'destructive'
        });
        onUserDeleted();
        setIsOpen(false);
    } catch (error) {
        toast({
            title: 'An error occurred',
            description: 'Failed to delete user. Please try again.',
            variant: 'destructive'
        })
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user account for{' '}
            <span className="font-semibold">{user.name} ({user.username})</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
             <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="destructive"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete User
              </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
