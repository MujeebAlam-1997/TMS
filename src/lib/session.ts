import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
	id: string;
	role: 'User' | 'Supervisor' | 'Manager' | 'PD';
	exp: number; // unix seconds
};

function getSecret(): string {
	const secret = process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SESSION_SECRET;
	if (!secret) {
		// Development fallback only
		return 'dev-insecure-secret-change-me';
	}
	return secret;
}

function base64url(input: Buffer | string): string {
	const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
	return b.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(data: string): string {
	const crypto = require('crypto');
	const h = crypto.createHmac('sha256', getSecret());
	h.update(data);
	return base64url(h.digest());
}

export function encodeSession(payload: SessionPayload): string {
	const body = base64url(JSON.stringify(payload));
	const signature = sign(body);
	return `${body}.${signature}`;
}

export function decodeSession(token: string | undefined | null): SessionPayload | null {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [body, signature] = parts;
	if (sign(body) !== signature) return null;
	try {
		const json = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as SessionPayload;
		if (!json.exp || Date.now() / 1000 > json.exp) return null;
		return json;
	} catch {
		return null;
	}
}
function cookieIsSecure(): boolean {
	// Default to false to allow HTTP access (e.g. LAN) unless explicitly set to true
	return process.env.COOKIE_SECURE === 'true';
}
export function setSessionCookie(res: NextResponse, payload: Omit<SessionPayload, 'exp'>, ttlSeconds: number = DEFAULT_TTL_SECONDS) {
	const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
	const token = encodeSession({ ...payload, exp });
	res.cookies.set({
		name: COOKIE_NAME,
		value: token,
		httpOnly: true,
		secure: cookieIsSecure(),
		path: '/',
		sameSite: 'lax',
		maxAge: ttlSeconds,
	});
}

export function clearSessionCookie(res: NextResponse) {
	res.cookies.set({
		name: COOKIE_NAME,
		value: '',
		path: '/',
		httpOnly: true,
		secure: cookieIsSecure(),
		sameSite: 'lax',
		maxAge: 0
	});
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
	const cookie = req.cookies.get(COOKIE_NAME)?.value;
	return decodeSession(cookie);
}

export function getSessionFromHeaders(): SessionPayload | null {
	try {
		const cookieStore = cookies();
		const token = cookieStore.get(COOKIE_NAME)?.value;
		return decodeSession(token || null);
	} catch {
		return null;
	}
}


