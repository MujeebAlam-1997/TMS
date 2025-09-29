import { NextRequest, NextResponse } from 'next/server';
import { findUserByCredentials } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
	const { username, password } = await req.json().catch(() => ({}));
	if (!username || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
	const user = findUserByCredentials(username, password);
	if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
	const res = NextResponse.json({ id: user.id, name: user.name, role: user.role, username: user.username });
	setSessionCookie(res, { id: user.id, role: user.role });
	return res;
}


