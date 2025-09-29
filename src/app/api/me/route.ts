import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getAllUsers } from '@/lib/db';

export async function GET(req: NextRequest) {
	const sess = getSessionFromRequest(req);
	if (!sess) return NextResponse.json({ user: null }, { status: 200 });
	// Fetch user basic info from DB
	const users = getAllUsers();
	const user = users.find(u => u.id === sess.id) || null;
	return NextResponse.json({ user });
}


