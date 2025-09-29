
'use client';

import PageHeader from '@/components/shared/PageHeader';
import RequestsTable from '@/components/shared/RequestsTable';
import { useAuth } from '@/context/AuthContext';
import { getAllRequestsAction } from '@/lib/actions';
import type { TransportRequest } from '@/lib/types';
import { useEffect, useState, useMemo, useCallback } from 'react';

export default function HistoryPage() {
  const { user, userRole } = useAuth();
  const [allRequests, setAllRequests] = useState<TransportRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    const requests = await getAllRequestsAction();
    setAllRequests(requests);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  
  const historyRequests = useMemo(() => {
    if (userRole === 'User') {
      return allRequests.filter(req => req.employeeNumber === user?.employeeNumber);
    }
    if (userRole === 'Supervisor') {
      return allRequests.filter(req => ['Forwarded', 'Approved', 'Disapproved'].includes(req.status) && req.status !== 'Not Recommended');
    }
    if (userRole === 'Manager') {
        // Manager's history should only show completed requests.
        return allRequests.filter(req => req.status === 'Approved' || req.status === 'Disapproved');
    }
    if (userRole === 'PD') {
        return allRequests.filter(req => req.pdId === user?.id && req.status !== 'Pending');
    }
    return [];
  }, [userRole, allRequests, user]);

  const getTitle = () => {
    switch(userRole) {
      case 'User': return 'My Request History';
      case 'Supervisor': return 'Processed Requests History';
      case 'Manager': return 'Reviewed Requests History';
      case 'PD': return 'Processed Requests History';
      default: return 'History';
    }
  }

  const getDescription = () => {
    switch(userRole) {
        case 'User': return "A log of all your past transport requests.";
        case 'Supervisor': return "A log of all requests that have been forwarded or reviewed.";
        case 'Manager': return 'A log of all requests that have been approved or disapproved.';
        case 'PD': return 'A log of all requests that you have processed.';
        default: return '';
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={getTitle()}
        description={getDescription()}
      />
      <RequestsTable requests={historyRequests as TransportRequest[]} onDataChange={fetchRequests} />
    </div>
  );
}
