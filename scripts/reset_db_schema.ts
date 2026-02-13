
import db from '../src/lib/db';

console.log('Dropping transport_requests table...');
try {
    db.exec('DROP TABLE IF EXISTS transport_requests');
    console.log('Table dropped. Restart the application or run generate_load to recreate it with the new schema.');
} catch (e) {
    console.error('Failed to drop table:', e);
}
