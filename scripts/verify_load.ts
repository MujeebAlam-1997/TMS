
import { getAllRequests } from '../src/lib/db';

const requests = getAllRequests();
console.log(`Total requests: ${requests.length}`);
// Check distribution?
const counts = requests.reduce((acc, req) => {
    acc[req.employeeNumber] = (acc[req.employeeNumber] || 0) + 1;
    return acc;
}, {} as Record<string, number>);
console.log('Requests per user:', counts);
