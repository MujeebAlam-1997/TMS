

import Database from 'better-sqlite3';
import type { TransportRequest, User, Official, Driver, Vehicle } from './types';
import { randomUUID } from 'crypto';

// Use a global singleton to prevent re-initialization during hot-reloads
const globalForDb = global as unknown as { db: Database.Database };

let db: Database.Database;
try {
    db = globalForDb.db || new Database('tms.db');
    if (process.env.NODE_ENV !== 'production') (globalForDb as any).db = db;
    try { db.pragma('journal_mode = WAL'); } catch (e) { console.error('WAL pragma failed', e); }
} catch (e) {
    console.error('Failed to open database, creating new handle', e);
    db = new Database('tms.db');
    try { db.pragma('journal_mode = WAL'); } catch { }
    if (process.env.NODE_ENV !== 'production') (globalForDb as any).db = db;
}

// Initial schema creation
function createTables() {
    try {
        const createUsersTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            employeeNumber TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('User', 'Supervisor', 'Manager', 'PD')),
            pdId TEXT
        );
    `);

        const createRequestsTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS transport_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeNumber TEXT NOT NULL,
            name TEXT NOT NULL,
            requisitionType TEXT NOT NULL CHECK(requisitionType IN ('Official', 'Private')),
            departingLocation TEXT NOT NULL,
            destination TEXT NOT NULL,
            "from" DATETIME NOT NULL,
            "to" DATETIME NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Pending', 'Forwarded', 'Approved', 'Disapproved', 'Rejected', 'Recommended', 'Not Recommended')),
            requestGeneratedDate DATETIME NOT NULL,
            
            managerComments TEXT,
            supervisorComments TEXT,
            pdComments TEXT,
            forwardedBy TEXT,
            reviewedBy TEXT,
            recommendedBy TEXT,

            requestReason TEXT,
            letterId TEXT,
            meetingAgenda TEXT,
            venue TEXT,
            purchaseDetails TEXT,
            purchaseItems TEXT,
            purchaseCaseNumber TEXT,
            subject TEXT,
            otherPurpose TEXT,
            officials TEXT,
            pdId TEXT,
            driverId TEXT,
            vehicleId TEXT
        );
    `);

        const createDriversTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS drivers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact TEXT NOT NULL
        )
    `);

        const createVehiclesTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS vehicles (
            id TEXT PRIMARY KEY,
            vehicleId TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL
        )
    `);

        db.transaction(() => {
            createUsersTable.run();
            createRequestsTable.run();
            createDriversTable.run();
            createVehiclesTable.run();
        })();
    } catch (e) {
        console.error('createTables failed', e);
    }
}

// Seed data if tables are empty
function seedData() {
    try {
        const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count?: number } | undefined;
        const count = row?.count ?? 0;
        if (count === 0) {
            const pdId = randomUUID();
            const users: (Omit<User, 'id'> & { id?: string })[] = [
                { employeeNumber: '1001', username: 'manager', password: '123', name: 'Manager User', role: 'Manager' },
                { employeeNumber: '1002', username: 'supervisor', password: '123', name: 'Supervisor User', role: 'Supervisor' },
                { id: pdId, employeeNumber: '1004', username: 'pd', password: '123', name: 'PD User', role: 'PD' },
                { employeeNumber: '1003', username: 'user', password: '123', name: 'Regular User', role: 'User', pdId: pdId },
            ];
            const insertUser = db.prepare('INSERT INTO users (id, employeeNumber, name, username, password, role, pdId) VALUES (?, ?, ?, ?, ?, ?, ?)');
            db.transaction((users) => {
                for (const user of users) {
                    insertUser.run(user.id || randomUUID(), user.employeeNumber, user.name, user.username, user.password, user.role, user.pdId || null);
                }
            })(users);
        } else {
            try {
                const pdUser = db.prepare(`SELECT id FROM users WHERE role = 'PD' LIMIT 1`).get() as { id: string } | undefined;
                if (pdUser) {
                    db.prepare(`UPDATE users SET pdId = ? WHERE role = 'User' AND pdId IS NULL`).run(pdUser.id);
                }
            } catch (e) { console.error('post-seed update failed', e); }
        }
    } catch (e) {
        console.error('seedData failed', e);
    }
}


// Initialize and seed the database
try { createTables(); } catch (e) { console.error('createTables error', e); }
try { seedData(); } catch (e) { console.error('seedData error', e); }


// Data access functions
export function findUserByCredentials(username: string, password?: string): User | null {
    if (!password) return null;
    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as User | undefined;
        return user || null;
    } catch (e) {
        console.error('findUserByCredentials failed', e);
        return null;
    }
}

export function getAllUsers(): User[] {
    try { return db.prepare('SELECT id, employeeNumber, name, username, role, password, pdId FROM users').all() as User[]; } catch (e) { console.error('getAllUsers failed', e); return []; }
}

export function getAllRequests(): TransportRequest[] {
    try {
        const rows = db.prepare(`
        SELECT 
            tr.*,
            d.name as driverName,
            d.contact as driverContact,
            v.type as vehicleType
        FROM transport_requests tr
        LEFT JOIN drivers d ON tr.driverId = d.id
        LEFT JOIN vehicles v ON tr.vehicleId = v.id
        ORDER BY tr.requestGeneratedDate DESC
    `).all() as any[];
        return rows.map(row => ({
            ...row,
            from: new Date(row.from),
            to: new Date(row.to),
            requestGeneratedDate: row.requestGeneratedDate ? new Date(row.requestGeneratedDate) : new Date(row.from),
            officials: row.officials ? JSON.parse(row.officials) : [],
        }));
    } catch (e) { console.error('getAllRequests failed', e); return []; }
}

export function addUser(user: Omit<User, 'id'>) {
    try {
        const id = randomUUID();
        const { employeeNumber, name, username, password, role, pdId } = user;
        db.prepare('INSERT INTO users (id, employeeNumber, name, username, password, role, pdId) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, employeeNumber, name, username, password, role, pdId);
    } catch (e) { console.error('addUser failed', e); }
}

export function updateUser(user: User) {
    try {
        const { id, employeeNumber, name, username, password, role, pdId } = user;
        db.prepare('UPDATE users SET employeeNumber = ?, name = ?, username = ?, password = ?, role = ?, pdId = ? WHERE id = ?').run(employeeNumber, name, username, password, role, pdId, id);
    } catch (e) { console.error('updateUser failed', e); }
}

export function deleteUser(userId: string) {
    try { db.prepare('DELETE FROM users WHERE id = ?').run(userId); } catch (e) { console.error('deleteUser failed', e); }
}

export function resetPassword(userId: string) {
    try {
        const user = db.prepare('SELECT employeeNumber FROM users WHERE id = ?').get(userId) as { employeeNumber: string } | undefined;
        if (user) {
            const newPassword = `${user.employeeNumber}${user.employeeNumber}${user.employeeNumber}`;
            db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
        }
    } catch (e) { console.error('resetPassword failed', e); }
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean, error?: string } {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
        if (!user) return { success: false, error: 'User not found.' };
        if (user.password !== oldPassword) return { success: false, error: 'Incorrect old password.' };
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
        return { success: true };
    } catch (e) { console.error('changePassword failed', e); return { success: false, error: 'Unexpected error' }; }
}


export function addRequest(request: Omit<TransportRequest, 'id' | 'status'>) {
    try {
        const status: TransportRequest['status'] = 'Pending';

        db.prepare(`
        INSERT INTO transport_requests 
        (employeeNumber, name, requisitionType, departingLocation, destination, "from", "to", status, requestGeneratedDate,
         requestReason, letterId, meetingAgenda, venue, purchaseDetails, purchaseItems, purchaseCaseNumber, subject, otherPurpose, officials, pdId) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            request.employeeNumber,
            request.name,
            request.requisitionType,
            request.departingLocation,
            request.destination,
            request.from.toISOString(),
            request.to.toISOString(),
            status,
            request.requestGeneratedDate.toISOString(),
            request.requestReason,
            request.letterId,
            request.meetingAgenda,
            request.venue,
            request.purchaseDetails,
            request.purchaseItems,
            request.purchaseCaseNumber,
            request.subject,
            request.otherPurpose,
            JSON.stringify(request.officials),
            request.pdId
        );
    } catch (e) { console.error('addRequest failed', e); }
}

export function forwardRequest(data: { id: number; driverId: string; vehicleId: string; managerComments?: string; forwardedBy: string; }) {
    try {
        db.prepare(`
        UPDATE transport_requests 
        SET status = 'Forwarded', 
            driverId = ?, 
            vehicleId = ?, 
            managerComments = ?,
            forwardedBy = ?
        WHERE id = ?
    `).run(data.driverId, data.vehicleId, data.managerComments, data.forwardedBy, data.id);
    } catch (e) { console.error('forwardRequest failed', e); }
}

export function reviewRequest(data: { id: number; status: 'Approved' | 'Disapproved' | 'Recommended' | 'Not Recommended'; supervisorComments?: string; pdComments?: string; reviewedBy?: string; recommendedBy?: string; }) {
    try {
        if (data.status === 'Recommended' || data.status === 'Not Recommended') {
            db.prepare(`
            UPDATE transport_requests 
            SET status = ?, 
                pdComments = ?,
                recommendedBy = ?
            WHERE id = ?
        `).run(data.status, data.pdComments, data.recommendedBy, data.id);
        } else {
            db.prepare(`
            UPDATE transport_requests 
            SET status = ?, 
                supervisorComments = ?,
                reviewedBy = ?
            WHERE id = ?
        `).run(data.status, data.supervisorComments, data.reviewedBy, data.id);
        }
    } catch (e) { console.error('reviewRequest failed', e); }
}

// Fleet Management Functions
export function getAllDrivers(): Driver[] {
    try { return db.prepare('SELECT * FROM drivers').all() as Driver[]; } catch (e) { console.error('getAllDrivers failed', e); return []; }
}

export function addDriver(driver: Omit<Driver, 'id'>): void {
    try {
        const existing = db.prepare('SELECT id FROM drivers WHERE name = ? AND contact = ?').get(driver.name, driver.contact);
        if (existing) throw new Error('Driver with the same name and contact already exists.');
        const id = randomUUID();
        db.prepare('INSERT INTO drivers (id, name, contact) VALUES (?, ?, ?)').run(id, driver.name, driver.contact);
    } catch (e) { console.error('addDriver failed', e); }
}


export function updateDriver(driver: Driver): void {
    try { db.prepare('UPDATE drivers SET name = ?, contact = ? WHERE id = ?').run(driver.name, driver.contact, driver.id); } catch (e) { console.error('updateDriver failed', e); }
}

export function deleteDriver(driverId: string): void {
    try { db.prepare('DELETE FROM drivers WHERE id = ?').run(driverId); } catch (e) { console.error('deleteDriver failed', e); }
}

export function getAllVehicles(): Vehicle[] {
    try { return db.prepare('SELECT * FROM vehicles').all() as Vehicle[]; } catch (e) { console.error('getAllVehicles failed', e); return []; }
}

export function addVehicle(vehicle: Omit<Vehicle, 'id'>): void {
    try { const id = randomUUID(); db.prepare('INSERT INTO vehicles (id, vehicleId, type) VALUES (?, ?, ?)').run(id, vehicle.vehicleId, vehicle.type); } catch (e) { console.error('addVehicle failed', e); }
}

export function updateVehicle(vehicle: Vehicle): void {
    try { db.prepare('UPDATE vehicles SET vehicleId = ?, type = ? WHERE id = ?').run(vehicle.vehicleId, vehicle.type, vehicle.id); } catch (e) { console.error('updateVehicle failed', e); }
}

export function deleteVehicle(vehicleId: string): void {
    try { db.prepare('DELETE FROM vehicles WHERE id = ?').run(vehicleId); } catch (e) { console.error('deleteVehicle failed', e); }
}


export default db;

// Maintenance helpers
export function closeDatabaseForRestore(): void {
    try {
        // Close current connection to release file locks (important on Windows)
        (db as unknown as Database.Database).close();
        // Remove global reference so a fresh connection will be created on next load
        try { (global as any).db = undefined; } catch (_) { }
    } catch (_) {
        // Ignore errors on close; replacement will proceed
    }
}
