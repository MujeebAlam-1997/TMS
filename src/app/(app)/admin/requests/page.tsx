'use client';

import PageHeader from '@/components/shared/PageHeader';
import RequestsTable from '@/components/shared/RequestsTable';
import { useAuth } from '@/context/AuthContext';
import { getAllRequestsAction } from '@/lib/actions';
import type { TransportRequest } from '@/lib/types';
import { useEffect, useState, useMemo, useCallback } from 'react';

export default function AdminRequestsPage() {
  const { user, userRole } = useAuth();
  const [allRequests, setAllRequests] = useState<TransportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
        const requests = await getAllRequestsAction();
        setAllRequests(requests);
    } catch (error) {
        console.error("Failed to fetch requests", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const requests = useMemo(() => {
    if (userRole === 'Manager') {
        return allRequests.filter(req => ['Pending', 'Recommended', 'Forwarded'].includes(req.status));
    }
    if (userRole === 'Supervisor') {
      return allRequests.filter(req => ['Pending', 'Recommended'].includes(req.status));
    }
    if (userRole === 'PD' && user) {
        return allRequests.filter(req => req.status === 'Pending' && req.pdId === user.id);
    }
    return [];
  }, [userRole, allRequests, user]);

  const getTitle = () => {
    switch(userRole) {
      case 'Manager': return 'Incoming Requests';
      case 'Supervisor': return 'Incoming Requests';
      case 'PD': return 'Pending Requests';
      default: return 'Requests';
    }
  }

  const getDescription = () => {
    switch(userRole) {
        case 'Manager': return "Review and approve or disapprove transport requests.";
        case 'Supervisor': return "Review and forward new transport requests.";
        case 'PD': return 'Review and recommend or not recommend transport requests.';
        default: return '';
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={getTitle()}
        description={getDescription()}
      />
      <RequestsTable requests={requests as TransportRequest[]} onDataChange={fetchRequests} />
    </div>
  );
}
