

export type UserRole = 'User' | 'Supervisor' | 'Manager' | 'PD';

export interface User {
  id: string;
  employeeNumber: string;
  name: string;
  username: string;
  role: UserRole;
  password?: string;
  pdId?: string;
}

export type RequestStatus = 'Pending' | 'Forwarded' | 'Approved' | 'Disapproved' | 'Rejected' | 'Recommended' | 'Not Recommended';

export interface Official {
  employeeNumber: string;
  name: string;
}

export type TransportRequest = {
  id: number;
  employeeNumber: string;
  name: string;
  requisitionType: 'Official' | 'Private';
  requestReason: 'For Meeting' | 'For Purchase' | 'Other';
  departingLocation: string;
  destination: string;
  from: Date;
  to: Date;
  status: RequestStatus;
  requestGeneratedDate: Date;
  driverId?: string;
  driverName?: string;
  driverContact?: string;
  vehicleId?: string;
  vehicleType?: string;
  managerComments?: string; // Comments from Supervisor
  supervisorComments?: string; // Comments from Manager
  pdComments?: string;
  forwardedBy?: string; // Supervisor's name/ID
  reviewedBy?: string; // Manager's name/ID
  recommendedBy?: string; // PD's name/ID
  officials?: Official[];
  pdId?: string;

  // Meeting fields
  letterId?: string;
  meetingAgenda?: string;
  venue?: string;

  // Purchase fields
  purchaseDetails?: string;
  purchaseItems?: string;
  purchaseCaseNumber?: string;
  subject?: string;

  // Other field
  otherPurpose?: string;
};

export type Vehicle = {
  id: string;
  vehicleId: string;
  type: string;
};

export type Driver = {
  id: string;
  name: string;
  contact: string;
}
