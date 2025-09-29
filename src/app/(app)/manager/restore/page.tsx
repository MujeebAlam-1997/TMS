'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCallback, useRef, useState } from 'react';

export default function ManagerRestorePage() {
	const { userRole } = useAuth();
	const fileRef = useRef<HTMLInputElement | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const isManager = userRole === 'Manager';

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isManager) return;
		const file = fileRef.current?.files?.[0];
		if (!file) return;
		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append('db', file);
			const res = await fetch('/api/restore', {
				method: 'POST',
				body: formData,
			});
			if (!res.ok) {
				const msg = await res.text();
				alert(`Restore failed: ${msg}`);
				return;
			}
			alert('Database restored successfully. Please reload the app.');
		} finally {
			setIsUploading(false);
		}
	}, [isManager]);

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Restore Database</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Upload a SQLite database file to replace the current <code>tms.db</code>.
				</p>
			</div>
			<form onSubmit={handleSubmit} className="space-y-4">
				<Input type="file" accept=".db,.sqlite,application/octet-stream" ref={fileRef} disabled={!isManager || isUploading} />
				<Button type="submit" disabled={!isManager || isUploading}>
					{isUploading ? 'Restoring…' : 'Restore tms.db'}
				</Button>
			</form>
			{!isManager && (
				<p className="text-sm text-red-600">Only Managers can restore the database.</p>
			)}
		</div>
	);
}


