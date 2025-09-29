import { NextRequest } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(_req: NextRequest) {
	const sess = getSessionFromRequest(_req);
	if (!sess || sess.role !== 'Manager') {
		return new Response('Unauthorized', { status: 401 });
	}

	const dbPath = join(process.cwd(), 'tms.db');
	try {
		const stats = statSync(dbPath);
		const stream = createReadStream(dbPath);

		return new Response(stream as unknown as ReadableStream, {
			headers: new Headers({
				'Content-Type': 'application/octet-stream',
				'Content-Length': String(stats.size),
				'Content-Disposition': 'attachment; filename="tms.db"',
				'Cache-Control': 'no-store',
			}),
		});
	} catch (err) {
		return new Response('Database file not found', { status: 404 });
	}
}


