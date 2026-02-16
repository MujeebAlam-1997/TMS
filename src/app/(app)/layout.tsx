'use client';

import { AppLogo } from '@/components/AppLogo';
import AppSidebar from '@/components/shared/AppSidebar';
import AuthWrapper from '@/components/AuthWrapper';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 bg-secondary/20 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}
