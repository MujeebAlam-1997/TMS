'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useCallback } from 'react';

export default function ManagerBackupPage() {
	const { userRole } = useAuth();

	const handleDownload = useCallback(() => {
		// Navigating to the API will trigger the browser download
		window.location.href = '/api/backup';
	}, []);

	const isManager = userRole === 'Manager';

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Database Backup</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Download a backup of the current SQLite database file (tms.db).
				</p>
			</div>
			<Button onClick={handleDownload} disabled={!isManager} className="gap-2">
				<Download className="h-4 w-4" />
				Download tms.db
			</Button>
			{!isManager && (
				<p className="text-sm text-red-600">Only Managers can download backups.</p>
			)}
		</div>
	);
}


