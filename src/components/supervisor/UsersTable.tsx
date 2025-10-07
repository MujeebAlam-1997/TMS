'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, PlusCircle, KeyRound } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import AddEditUserDialog from './AddEditUserDialog';
import DeleteUserDialog from './DeleteUserDialog';
import { Skeleton } from '../ui/skeleton';
import { getAllUsersAction, resetPasswordAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

const roleVariant: { [key: string]: 'default' | 'secondary' | 'outline' } = {
    Manager: 'default',
    Supervisor: 'secondary',
    User: 'outline',
    PD: 'destructive'
  };

export default function UsersTable({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddEditOpen, setAddEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
        const userList = await getAllUsersAction();
        setUsers(userList);
    } catch (error) {
        toast({ title: 'Error fetching users', description: 'Could not retrieve user data.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setAddEditOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setAddEditOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleResetPassword = async (user: User) => {
    try {
        await resetPasswordAction(user.id);
        toast({ 
            title: 'Password Reset Successful', 
            description: `Password for ${user.username} has been reset.` 
        });
        fetchUsers();
    } catch (error) {
        toast({ 
            title: 'Password Reset Failed', 
            description: 'Could not reset the password. Please try again.',
            variant: 'destructive'
        });
    }
  }

  const ActionsCell = ({ user }: { user: User }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleEditUser(user)}>
          <Edit className="mr-2 h-4 w-4" /> Edit User
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDeleteUser(user)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
    <div className='-mt-8'>
        <Button onClick={handleAddUser}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      <Card>
        <div className="flex flex-col h-[600px]"> {/* or h-screen or calc height */}
  <CardContent className="flex-1 overflow-hidden flex flex-col">
    <ScrollArea className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.employeeNumber}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[user.role] || 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionsCell user={user} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
     
    </CardContent>
     </div>

      </Card>

      <AddEditUserDialog
        isOpen={isAddEditOpen}
        setIsOpen={setAddEditOpen}
        user={selectedUser}
        onUserAddedOrUpdated={fetchUsers}
      />
      {selectedUser && (
        <DeleteUserDialog
          isOpen={isDeleteOpen}
          setIsOpen={setDeleteOpen}
          user={selectedUser}
          onUserDeleted={fetchUsers}
        />
      )}
    </>
  );
}
