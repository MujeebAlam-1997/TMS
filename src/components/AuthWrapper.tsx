'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/') {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <div className="flex w-full space-x-4">
          <Skeleton className="h-screen w-64 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-16 w-1/3 rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated && pathname !== '/') {
      return null;
  }

  return <>{children}</>;
}
