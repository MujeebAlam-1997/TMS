import { NextRequest } from 'next/server';
import { createWriteStream, renameSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { closeDatabaseForRestore } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest) {
	const sess = getSessionFromRequest(req);
	if (!sess || sess.role !== 'Manager') {
		return new Response('Unauthorized', { status: 401 });
	}
	try {
		const formData = await req.formData();
		const file = formData.get('db');
		if (!(file instanceof File)) {
			return new Response('No file uploaded', { status: 400 });
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const appRoot = process.cwd();
		const dbPath = join(appRoot, 'tms.db');
		const tmpPath = join(appRoot, 'tms.db.upload');
		const backupPath = join(appRoot, 'tms.db.bak');

		// Write upload to temp file
		await new Promise<void>((resolve, reject) => {
			const out = createWriteStream(tmpPath);
			out.on('error', reject);
			out.on('finish', resolve);
			out.end(buffer);
		});

		// Close DB to release locks prior to replacement
		try { closeDatabaseForRestore(); } catch (_) {}

		// Backup existing DB if present
		if (existsSync(dbPath)) {
			try {
				renameSync(dbPath, backupPath);
			} catch (_) {
				return new Response('Failed to back up existing database', { status: 500 });
			}
		}

		// Replace with uploaded DB
		try {
			renameSync(tmpPath, dbPath);
		} catch (e) {
			// Attempt rollback
			if (existsSync(backupPath)) {
				renameSync(backupPath, dbPath);
			}
			return new Response('Failed to replace database', { status: 500 });
		}

		// Clean leftover temp
		try { if (existsSync(tmpPath)) unlinkSync(tmpPath); } catch (_) {}

		return new Response('OK');
	} catch (e) {
		return new Response('Invalid request', { status: 400 });
	}
}


