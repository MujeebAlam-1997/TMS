'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { getAllUsersAction, resetPasswordAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';

const roleVariant: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
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
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: 'contains' },
    employeeNumber: { value: null, matchMode: 'contains' },
    name: { value: null, matchMode: 'contains' },
    username: { value: null, matchMode: 'contains' },
    role: { value: null, matchMode: 'equals' },
  });
  const [globalFilter, setGlobalFilter] = useState<string>('');
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
    // If the page already provided users, use them without refetching.
    // Only fetch if we have no initial data.
    if (!initialUsers || initialUsers.length === 0) {
      fetchUsers();
    } else {
      setUsers(initialUsers);
    }
  }, [fetchUsers, initialUsers]);

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

  const header = (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base">Users</h2>
      <div className="relative">
        <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <InputText
          value={globalFilter}
          onChange={(e: any) => {
            setGlobalFilter(e.target.value);
            setFilters((f: any) => ({
              ...f,
              global: { value: e.target.value, matchMode: 'contains' },
            }));
          }}
          placeholder="Search"
          className="pl-10 font-normal"
        />
      </div>
    </div>
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
        <CardContent  >


          <DataTable
            value={users}
            loading={isLoading}
            header={header}
            paginator
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            removableSort
            sortMode="multiple"
            filters={filters}
            onFilter={(e: any) => setFilters(e.filters)}
            emptyMessage="No users found."
            dataKey="id"
            className="text-[14px]"
            style={{ fontFamily: '"Inter var", sans-serif' }}
          >
            <Column field="employeeNumber" header="Employee No." headerClassName="!text-sm  " />
            <Column field="name" header="Name" headerClassName="!text-sm  " />
            <Column field="username" header="Username" headerClassName="!text-sm  " />
            <Column field="role" header="Role" headerClassName="!text-sm  " body={(u: User) => <Badge variant={roleVariant[u.role] || 'outline'}>{u.role}</Badge>} sortable />
            <Column header="Actions" headerClassName="text-right !text-sm  " bodyClassName="text-right" body={(u: User) => <ActionsCell user={u} />} style={{ width: '6rem' }} />
          </DataTable>
        </CardContent>
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
