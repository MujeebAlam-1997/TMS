const Database = require('better-sqlite3');

const db = new Database('tms.db');

try {
    console.log('Starting migration...');

    db.transaction(() => {
        // 1. Rename existing table
        db.prepare(`ALTER TABLE transport_requests RENAME TO transport_requests_old`).run();
        console.log('Renamed old table');

        // 2. Create new table with updated CHECK constraint
        db.prepare(`
        CREATE TABLE transport_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeNumber TEXT NOT NULL,
            name TEXT NOT NULL,
            requisitionType TEXT NOT NULL CHECK(requisitionType IN ('Official', 'Private')),
            departingLocation TEXT NOT NULL,
            destination TEXT NOT NULL,
            "from" DATETIME NOT NULL,
            "to" DATETIME NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Pending', 'Forwarded', 'Approved', 'Disapproved', 'Rejected', 'Recommended', 'Not Recommended', 'Cancelled')),
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
        `).run();
        console.log('Created new table with updated CHECK constraint');

        // 3. Copy data
        db.prepare(`
            INSERT INTO transport_requests 
            SELECT * FROM transport_requests_old;
        `).run();
        console.log('Copied data to new table');

        // 4. Drop old table
        db.prepare(`DROP TABLE transport_requests_old`).run();
        console.log('Dropped old table');
    })();

    console.log('Migration completed successfully!');

} catch (error) {
    console.error('Migration failed:', error);
} finally {
    db.close();
}
