
import {
  addUser,
  addRequest,
  findUserByCredentials,
  addDriver,
  addVehicle,
  getAllRequests,
  getAllDrivers,
  getAllVehicles,
  forwardRequest,
  reviewRequest
} from '../src/lib/db';
import { TransportRequest, User } from '../src/lib/types';
import { randomUUID } from 'crypto';

const USERS_TO_CREATE = [
  { employeeNumber: 'EMP001', name: 'Employee One', username: 'emp1', password: '123', role: 'User' },
  { employeeNumber: 'EMP002', name: 'Employee Two', username: 'emp2', password: '123', role: 'User' },
  { employeeNumber: 'EMP003', name: 'Employee Three', username: 'emp3', password: '123', role: 'User' },
  { employeeNumber: 'EMP004', name: 'Employee Four', username: 'emp4', password: '123', role: 'User' },
  { employeeNumber: 'SUP001', name: 'Supervisor One', username: 'sup1', password: '123', role: 'Supervisor' },
  { employeeNumber: 'MGR001', name: 'Manager One', username: 'mgr1', password: '123', role: 'Manager' },
  { employeeNumber: 'PD001', name: 'Project Director', username: 'pd1', password: '123', role: 'PD' },
] as const;

const DRIVERS = [
  { name: 'John Doe', contact: '555-0101' },
  { name: 'Jane Smith', contact: '555-0102' },
  { name: 'Bob Johnson', contact: '555-0103' },
];

const VEHICLES = [
  { vehicleId: 'V-101', type: 'Sedan' },
  { vehicleId: 'V-102', type: 'SUV' },
  { vehicleId: 'V-103', type: 'Van' },
];

const REQUISITION_TYPES = ['Official', 'Private'] as const;
const REQUEST_REASONS = ['For Meeting', 'For Purchase', 'Other'] as const;

function generateRandomRequest(user: typeof USERS_TO_CREATE[number], index: number): Omit<TransportRequest, 'id' | 'status'> {
  const isOfficial = Math.random() > 0.5;
  const type = isOfficial ? 'Official' : 'Private';
  const reason = REQUEST_REASONS[Math.floor(Math.random() * REQUEST_REASONS.length)];
  const now = new Date();
  const from = new Date(now.getTime() + Math.random() * 10000000); // Future date
  const to = new Date(from.getTime() + 3600000); // 1 hour later

  return {
    employeeNumber: user.employeeNumber,
    name: user.name,
    requisitionType: type,
    requestReason: reason,
    departingLocation: `Location A ${index}`,
    destination: `Location B ${index}`,
    from: from,
    to: to,
    requestGeneratedDate: now,
    // Optional fields based on type
    meetingAgenda: reason === 'For Meeting' ? `Meeting Agenda ${index}` : undefined,
    venue: reason === 'For Meeting' ? `Venue ${index}` : undefined,
    purchaseDetails: reason === 'For Purchase' ? `Purchase Details ${index}` : undefined,
    purchaseItems: reason === 'For Purchase' ? `Item ${index}` : undefined,
    otherPurpose: reason === 'Other' ? `Other Purpose ${index}` : undefined,
    officials: [],
    subject: `Subject ${index}`
  };
}

async function main() {
  console.log('Starting load generation...');

  // 1. Create Users
  for (const userConfig of USERS_TO_CREATE) {
    let user = findUserByCredentials(userConfig.username, userConfig.password);
    if (!user) {
      console.log(`Creating user: ${userConfig.username}`);
      addUser({
        employeeNumber: userConfig.employeeNumber,
        name: userConfig.name,
        username: userConfig.username,
        password: userConfig.password,
        role: userConfig.role as any,
        pdId: undefined
      });
    } else {
      console.log(`User ${userConfig.username} already exists.`);
    }
  }

  // 2. Create Fleet
  const existingDrivers = getAllDrivers();
  if (existingDrivers.length === 0) {
    console.log('Creating drivers...');
    DRIVERS.forEach(d => addDriver(d));
  }

  const existingVehicles = getAllVehicles();
  if (existingVehicles.length === 0) {
    console.log('Creating vehicles...');
    VEHICLES.forEach(v => addVehicle(v));
  }

  const drivers = getAllDrivers();
  const vehicles = getAllVehicles();

  // 3. Generate Requests (Only for regular users)
  const regularUsers = USERS_TO_CREATE.filter(u => u.role === 'User');

  for (const userConfig of regularUsers) {
    // Check if user has requests roughly? Simplified: just add 5 new ones per run to avoid infinite growth if called repeatedly, 
    // or just assume we want to top up.
    // Let's just generate 10 new requests per user per run to add to the pile.
    console.log(`Generating 10 new requests for ${userConfig.username}...`);
    for (let i = 0; i < 10; i++) {
      const request = generateRandomRequest(userConfig, i);
      addRequest(request);
    }
  }

  // 4. Simulate Workflow
  console.log('Simulating workflow transitions...');
  const allRequests = getAllRequests();

  // A. Forward Pending Requests (Supervisor Action)
  const pendingRequests = allRequests.filter(r => r.status === 'Pending');
  const requestsToForward = pendingRequests.slice(0, Math.floor(pendingRequests.length * 0.4)); // Forward 40% of pending

  console.log(`Forwarding ${requestsToForward.length} pending requests...`);
  for (const req of requestsToForward) {
    if (drivers.length > 0 && vehicles.length > 0) {
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      forwardRequest({
        id: req.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        managerComments: 'Forwarding for approval',
        forwardedBy: 'Supervisor One'
      });
    }
  }

  // B. Review Forwarded Requests (Manager Action)
  // Fetch again to get updated statuses ? No need, we know what we just forwarded, 
  // but let's re-fetch to be safe and simple or just use the list we have if we assume DB is sync.
  // DB is sync. But 'allRequests' is stale.
  // Let's re-fetch.
  const forwardedRequests = getAllRequests().filter(r => r.status === 'Forwarded');
  const requestsToApprove = forwardedRequests.slice(0, Math.floor(forwardedRequests.length * 0.7)); // Approve 70% of forwarded

  console.log(`Approving/Disapproving ${requestsToApprove.length} forwarded requests...`);
  for (const req of requestsToApprove) {
    const isApproved = Math.random() > 0.2; // 80% approval rate
    reviewRequest({
      id: req.id,
      status: isApproved ? 'Approved' : 'Disapproved',
      supervisorComments: isApproved ? 'Approved, proceed.' : 'Disapproved, invalid request.',
      reviewedBy: 'Manager One'
    });
  }

  // C. PD Recommendations (PD Action for Pending)
  // Some pending requests might need PD recommendation.
  const remainingPending = getAllRequests().filter(r => r.status === 'Pending');
  const requestsToRecommend = remainingPending.slice(0, Math.floor(remainingPending.length * 0.2)); // Recommend 20% of remaining pending

  console.log(`Recommending ${requestsToRecommend.length} pending requests...`);
  for (const req of requestsToRecommend) {
    const isRecommended = Math.random() > 0.1;
    reviewRequest({
      id: req.id,
      status: isRecommended ? 'Recommended' : 'Not Recommended',
      pdComments: isRecommended ? 'Highly recommended.' : 'Not recommended at this time.',
      recommendedBy: 'Project Director'
    });
  }

  console.log('Load generation and workflow simulation complete.');
}

main().catch(console.error);
