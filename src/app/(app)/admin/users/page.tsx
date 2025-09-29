'use client';

import PageHeader from '@/components/shared/PageHeader';
import UsersTable from '@/components/supervisor/UsersTable';
import { useAuth } from '@/context/AuthContext';
import { getAllUsersAction } from '@/lib/actions';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (userRole && userRole !== 'Manager') {
      router.push('/dashboard');
    } else if (userRole === 'Manager') {
        async function fetchUsers() {
            const userList = await getAllUsersAction();
            setUsers(userList);
        }
        fetchUsers();
    }
  }, [userRole, router]);

  if (userRole !== 'Manager') {
    return null; // Or a loading/unauthorized component
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Users"
        description="Add, edit, or delete user accounts."
      />
      <UsersTable users={users} />
    </div>
  );
}
