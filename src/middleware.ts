import { NextRequest, NextResponse } from 'next/server';

type Role = 'User' | 'Supervisor' | 'Manager' | 'PD';

function getSecret(): string {
	return process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SESSION_SECRET || 'dev-insecure-secret-change-me';
}

function base64url(input: ArrayBuffer): string {
	const bytes = new Uint8Array(input);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function base64urlToString(s: string): string {
	let b64 = s.replace(/-/g,'+').replace(/_/g,'/');
	while (b64.length % 4) b64 += '=';
	const bin = atob(b64);
	return bin;
}

async function hmacSHA256(message: string, secret: string): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
	return base64url(sig);
}

async function decodeSessionEdge(token: string | null | undefined): Promise<null | { id: string; role: Role; exp: number }>{
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [body, signature] = parts;
	const expected = await hmacSHA256(body, getSecret());
	if (expected !== signature) return null;
	try {
		const jsonStr = base64urlToString(body);
		const payload = JSON.parse(jsonStr) as { id: string; role: Role; exp: number };
		if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
		return payload;
	} catch {
		return null;
	}
}

function isPublicPath(pathname: string): boolean {
	// Allow public and framework assets
	return (
		pathname === '/' ||
		pathname.startsWith('/_next') ||
		pathname.startsWith('/favicon') ||
		pathname.startsWith('/assets') ||
		pathname.startsWith('/api/login') ||
		pathname.startsWith('/api/logout') ||
		pathname.startsWith('/api/me')
	);
}

function isAllowedForRole(pathname: string, role: Role): boolean {
	// Normalize to unify matched prefixes
	if (role === 'Manager') {
		// Manager has widest access to admin and manager areas
		return (
			pathname.startsWith('/dashboard') ||
			pathname.startsWith('/requests') ||
			pathname.startsWith('/admin') ||
			pathname.startsWith('/manager')
		);
	}
	if (role === 'Supervisor') {
		return (
			pathname.startsWith('/dashboard') ||
			pathname.startsWith('/requests') ||
			pathname.startsWith('/admin/requests')
		);
	}
	if (role === 'PD') {
		return (
			pathname.startsWith('/dashboard') ||
			pathname.startsWith('/requests') ||
			pathname.startsWith('/admin/requests')
		);
	}
	// User
	return (
		pathname.startsWith('/dashboard') ||
		pathname.startsWith('/requests')
	);
}

export async function middleware(request: NextRequest) {
	const { nextUrl, cookies } = request;
	const pathname = nextUrl.pathname;

	// Read session cookie and validate
	const token = cookies.get('session')?.value || null;
	const session = await decodeSessionEdge(token);

	// If already logged in and trying to access the login page or root, redirect to dashboard
	if ((pathname === '/' || pathname === '/login') && session) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	// Always allow public paths and static assets (after handling logged-in root redirect)
	if (isPublicPath(pathname) || pathname.startsWith('/api')) {
		return NextResponse.next();
	}

	// If not logged in, redirect to home (login) for app pages
	if (!session) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	// Enforce role-based access for non-public routes
	if (!isAllowedForRole(pathname, session.role)) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!_next|.*\\.\w+$).*)',
	],
};


