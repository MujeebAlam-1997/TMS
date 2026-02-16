
import { getAllRequests } from '../src/lib/db';

const requests = getAllRequests();
console.log(`Total requests: ${requests.length}`);

// Status distribution
const statusCounts = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
}, {} as Record<string, number>);

console.log('Requests by Status:', statusCounts);

// User distribution
const userCounts = requests.reduce((acc, req) => {
    acc[req.employeeNumber] = (acc[req.employeeNumber] || 0) + 1;
    return acc;
}, {} as Record<string, number>);

console.log('Requests by User:', userCounts);
