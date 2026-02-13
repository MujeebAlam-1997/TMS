
import { addUser, addRequest, findUserByCredentials } from '../src/lib/db';
import { User, TransportRequest } from '../src/lib/types';
import { randomUUID } from 'crypto';

const USERS_TO_CREATE = [
  { employeeNumber: 'EMP001', name: 'Employee One', username: 'emp1', password: '123', role: 'User' },
  { employeeNumber: 'EMP002', name: 'Employee Two', username: 'emp2', password: '123', role: 'User' },
  { employeeNumber: 'EMP003', name: 'Employee Three', username: 'emp3', password: '123', role: 'User' },
  { employeeNumber: 'EMP004', name: 'Employee Four', username: 'emp4', password: '123', role: 'User' },
] as const;

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

  for (const userConfig of USERS_TO_CREATE) {
    let user = findUserByCredentials(userConfig.username, userConfig.password);
    if (!user) {
      console.log(`Creating user: ${userConfig.username}`);
      addUser({
        employeeNumber: userConfig.employeeNumber,
        name: userConfig.name,
        username: userConfig.username,
        password: userConfig.password,
        role: userConfig.role,
        pdId: undefined
      });
      // Small delay or re-fetch to ensure it exists if strictly needed, but synchronous DB should be fine.
    } else {
        console.log(`User ${userConfig.username} already exists.`);
    }

    console.log(`Generating 30 requests for ${userConfig.username}...`);
    for (let i = 0; i < 30; i++) {
      const request = generateRandomRequest(userConfig, i);
      addRequest(request);
    }
  }

  console.log('Load generation complete.');
}

main().catch(console.error);
