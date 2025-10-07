

import Database from 'better-sqlite3';
import type { TransportRequest, User, Official, Driver, Vehicle } from './types';
import { randomUUID } from 'crypto';

// Use a global singleton to prevent re-initialization during hot-reloads
const globalForDb = global as unknown as { db: Database.Database };

const db = globalForDb.db || new Database('tms.db');
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

db.pragma('journal_mode = WAL');

// Initial schema creation
function createTables() {
    // db.exec('DROP TABLE IF EXISTS users');
    // db.exec('DROP TABLE IF EXISTS transport_requests');
    // db.exec('DROP TABLE IF EXISTS drivers');
    // db.exec('DROP TABLE IF EXISTS vehicles');

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
            id TEXT PRIMARY KEY,
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
}

// Seed data if tables are empty
function seedData() {
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (usersCount.count === 0) {
        const pdId = randomUUID();
        const users: (Omit<User, 'id'> & {id?: string})[] = [
          { employeeNumber: '1001', username: 'supervisor', password: '123', name: 'Manager User', role: 'Manager' },
          { employeeNumber: '1002', username: 'manager', password: '123', name: 'Supervisor User', role: 'Supervisor' },
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
        // Ensure existing users have pdId if they are a user
        const pdUser = db.prepare(`SELECT id FROM users WHERE role = 'PD' LIMIT 1`).get() as {id: string} | undefined;
        if(pdUser) {
            db.prepare(`UPDATE users SET pdId = ? WHERE role = 'User' AND pdId IS NULL`).run(pdUser.id);
        }
    }

     // --- DUMMY TRANSPORT REQUESTS SEEDING ---
    const requestsCount = db.prepare('SELECT COUNT(*) as count FROM transport_requests').get() as { count: number };
    if (requestsCount.count < 50) {
        const users = db.prepare('SELECT * FROM users').all() as User[];
        const insertRequest = db.prepare(`
            INSERT INTO transport_requests (
                id, employeeNumber, name, requisitionType, departingLocation, destination, "from", "to", status, requestGeneratedDate,
                requestReason, letterId, meetingAgenda, venue, purchaseDetails, purchaseItems, purchaseCaseNumber, subject, otherPurpose, officials, pdId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        db.transaction(() => {
            for (let i = 1; i <= 50; i++) {
                const user = users[i % users.length];
                const now = new Date();
                const from = new Date(now.getTime() + i * 60 * 60 * 1000); // i hours from now
                const to = new Date(from.getTime() + 2 * 60 * 60 * 1000); // 2 hours after from
                insertRequest.run(
                    `V-REQ-${i}`,
                    user.employeeNumber,
                    user.name,
                    i % 2 === 0 ? 'Official' : 'Private',
                    `Location ${i}`,
                    `Destination ${i}`,
                    from.toISOString(),
                    to.toISOString(),
                    'Pending',
                    now.toISOString(),
                    `Reason for request #${i}`,
                    `LID-${i}`,
                    `Agenda #${i}`,
                    `Venue #${i}`,
                    `Purchase details #${i}`,
                    `ItemA,ItemB`,
                    `Case-${i}`,
                    `Subject #${i}`,
                    `Other purpose #${i}`,
                    JSON.stringify([{ name: `Official ${i}`, designation: 'Officer' }]),
                    user.pdId || null
                );
            }
        })();
    }
}


// Initialize and seed the database
createTables();
seedData();


// Data access functions
export function findUserByCredentials(username: string, password?: string): User | null {
  if (!password) return null;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as User | undefined;
  return user || null;
}

export function getAllUsers(): User[] {
    return db.prepare('SELECT id, employeeNumber, name, username, role, password, pdId FROM users').all() as User[];
}

export function getAllRequests(): TransportRequest[] {
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
}

export function addUser(user: Omit<User, 'id'>) {
    const id = randomUUID();
    const { employeeNumber, name, username, password, role, pdId } = user;
    db.prepare('INSERT INTO users (id, employeeNumber, name, username, password, role, pdId) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, employeeNumber, name, username, password, role, pdId);
}

export function updateUser(user: User) {
    const { id, employeeNumber, name, username, password, role, pdId } = user;
    db.prepare('UPDATE users SET employeeNumber = ?, name = ?, username = ?, password = ?, role = ?, pdId = ? WHERE id = ?').run(employeeNumber, name, username, password, role, pdId, id);
}

export function deleteUser(userId: string) {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

export function resetPassword(userId: string) {
    const user = db.prepare('SELECT employeeNumber FROM users WHERE id = ?').get(userId) as { employeeNumber: string } | undefined;
    if (user) {
        const newPassword = `${user.employeeNumber}${user.employeeNumber}${user.employeeNumber}`;
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
    }
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean, error?: string } {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

    if (!user) {
        return { success: false, error: 'User not found.' };
    }

    if (user.password !== oldPassword) {
        return { success: false, error: 'Incorrect old password.' };
    }

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, userId);
    return { success: true };
}


export function addRequest(request: Omit<TransportRequest, 'id' | 'status'>) {
    const lastRequest = db.prepare('SELECT id FROM transport_requests ORDER BY id DESC LIMIT 1').get() as { id: string } | undefined;
    
    let nextIdNumber = 1;
    if (lastRequest && lastRequest.id.startsWith('V-REQ-')) {
        const lastIdNumber = parseInt(lastRequest.id.split('-')[2], 10);
        if (!isNaN(lastIdNumber)) {
            nextIdNumber = lastIdNumber + 1;
        }
    }
    
    const id = `V-REQ-${nextIdNumber}`;
    const status: TransportRequest['status'] = 'Pending';

    db.prepare(`
        INSERT INTO transport_requests 
        (id, employeeNumber, name, requisitionType, departingLocation, destination, "from", "to", status, requestGeneratedDate,
         requestReason, letterId, meetingAgenda, venue, purchaseDetails, purchaseItems, purchaseCaseNumber, subject, otherPurpose, officials, pdId) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id, 
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
}

export function forwardRequest(data: { id: string; driverId: string; vehicleId: string; managerComments?: string; forwardedBy: string; }) {
    db.prepare(`
        UPDATE transport_requests 
        SET status = 'Forwarded', 
            driverId = ?, 
            vehicleId = ?, 
            managerComments = ?,
            forwardedBy = ?
        WHERE id = ?
    `).run(data.driverId, data.vehicleId, data.managerComments, data.forwardedBy, data.id);
}

export function reviewRequest(data: { id: string; status: 'Approved' | 'Disapproved' | 'Recommended' | 'Not Recommended'; supervisorComments?: string; pdComments?: string; reviewedBy?: string; recommendedBy?: string; }) {
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
}

// Fleet Management Functions
export function getAllDrivers(): Driver[] {
    return db.prepare('SELECT * FROM drivers').all() as Driver[];
}

export function addDriver(driver: Omit<Driver, 'id'>): void {
  const existing = db
    .prepare('SELECT id FROM drivers WHERE name = ? AND contact = ?')
    .get(driver.name, driver.contact);

  if (existing) {
    throw new Error('Driver with the same name and contact already exists.');
  }

  const id = randomUUID();
  db.prepare('INSERT INTO drivers (id, name, contact) VALUES (?, ?, ?)').run(id, driver.name, driver.contact);
}


export function updateDriver(driver: Driver): void {
    db.prepare('UPDATE drivers SET name = ?, contact = ? WHERE id = ?').run(driver.name, driver.contact, driver.id);
}

export function deleteDriver(driverId: string): void {
    db.prepare('DELETE FROM drivers WHERE id = ?').run(driverId);
}

export function getAllVehicles(): Vehicle[] {
    return db.prepare('SELECT * FROM vehicles').all() as Vehicle[];
}

export function addVehicle(vehicle: Omit<Vehicle, 'id'>): void {
    const id = randomUUID();
    db.prepare('INSERT INTO vehicles (id, vehicleId, type) VALUES (?, ?, ?)').run(id, vehicle.vehicleId, vehicle.type);
}

export function updateVehicle(vehicle: Vehicle): void {
    db.prepare('UPDATE vehicles SET vehicleId = ?, type = ? WHERE id = ?').run(vehicle.vehicleId, vehicle.type, vehicle.id);
}

export function deleteVehicle(vehicleId: string): void {
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(vehicleId);
}


export default db;

// Maintenance helpers
export function closeDatabaseForRestore(): void {
	try {
		// Close current connection to release file locks (important on Windows)
		(db as unknown as Database.Database).close();
		// Remove global reference so a fresh connection will be created on next load
		try { (global as any).db = undefined; } catch (_) {}
	} catch (_) {
		// Ignore errors on close; replacement will proceed
	}
}
