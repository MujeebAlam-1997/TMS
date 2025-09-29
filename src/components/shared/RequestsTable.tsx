

'use client';

import { useState, useCallback } from 'react';
import type { TransportRequest } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Eye, Send, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import RequestDetailsDialog from './RequestDetailsDialog';
import ForwardRequestDialog from '../manager/ForwardRequestDialog';
import ReviewRequestDialog from '../supervisor/ReviewRequestDialog';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import PDReviewRequestDialog from './PDReviewRequestDialog';

interface RequestsTableProps {
  requests: TransportRequest[];
  onDataChange: () => void;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Pending: 'secondary',
  Forwarded: 'outline',
  Approved: 'default',
  Disapproved: 'destructive',
  Rejected: 'destructive',
  Recommended: 'default',
  'Not Recommended': 'destructive'
};

const statusColor: { [key: string]: string } = {
    Pending: 'bg-yellow-400 text-black hover:bg-yellow-400/80',
    Approved: 'bg-green-500 hover:bg-green-500/80',
    Disapproved: 'bg-red-500 hover:bg-red-500/80',
    Recommended: 'bg-blue-500 hover:bg-blue-500/80',
    'Not Recommended': 'bg-orange-500 hover:bg-orange-500/80'
}

export default function RequestsTable({ requests, onDataChange }: RequestsTableProps) {
  const { userRole } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [isForwardOpen, setForwardOpen] = useState(false);
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [isPDReviewOpen, setPDReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'Approve' | 'Disapprove' | 'Recommend' | 'Not Recommend'>('Approve');

  const handleDataChange = useCallback(() => {
    onDataChange();
  }, [onDataChange])

  const handleViewDetails = (request: TransportRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleForward = (request: TransportRequest) => {
    setSelectedRequest(request);
    setForwardOpen(true);
  };
  
  const handleReview = (request: TransportRequest, action: 'Approve' | 'Disapprove') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewOpen(true);
  };

  const handlePDReview = (request: TransportRequest, action: 'Recommend' | 'Not Recommend') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setPDReviewOpen(true);
  };

  const ActionsCell = ({ request }: { request: TransportRequest }) => (
    <TooltipProvider>
      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(request)}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View Details</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Details</TooltipContent>
        </Tooltip>

        {userRole === 'Supervisor' && request.status === 'Recommended' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleForward(request)}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        )}

        {userRole === 'Manager' && (
          <>
            {request.status === 'Forwarded' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReview(request, 'Approve')}>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="sr-only">Approve</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Approve</TooltipContent>
              </Tooltip>
            )}
            {['Pending', 'Recommended', 'Forwarded'].includes(request.status) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReview(request, 'Disapprove')}>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="sr-only">Disapprove</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disapprove</TooltipContent>
              </Tooltip>
            )}
          </>
        )}

        {userRole === 'PD' && request.status === 'Pending' && (
            <>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePDReview(request, 'Recommend')}>
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span className="sr-only">Recommend</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Recommend</TooltipContent>
                </Tooltip>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePDReview(request, 'Not Recommend')}>
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    <span className="sr-only">Not Recommend</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Not Recommend</TooltipContent>
                </Tooltip>
            </>
        )}
      </div>
    </TooltipProvider>
  );

  if (requests.length === 0) {
    return (
      <Card className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">No requests found.</p>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Req. ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>
                <span>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.id}</TableCell>
                <TableCell>{request.name}</TableCell>
                <TableCell>{request.destination}</TableCell>
                <TableCell>{format(request.from, 'PP')}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[request.status] || 'default'} className={cn(statusColor[request.status])}>{request.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ActionsCell request={request} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {selectedRequest && (
        <>
          <RequestDetailsDialog 
            isOpen={isDetailsOpen} 
            setIsOpen={setDetailsOpen} 
            request={selectedRequest}
          />
          <ForwardRequestDialog isOpen={isForwardOpen} setIsOpen={setForwardOpen} request={selectedRequest} onForwarded={handleDataChange} />
          <ReviewRequestDialog isOpen={isReviewOpen} setIsOpen={setReviewOpen} request={selectedRequest} action={reviewAction as 'Approve' | 'Disapprove'} onReviewed={handleDataChange}/>
          <PDReviewRequestDialog isOpen={isPDReviewOpen} setIsOpen={setPDReviewOpen} request={selectedRequest} action={reviewAction as 'Recommend' | 'Not Recommend'} onReviewed={handleDataChange}/>
        </>
      )}
    </>
  );
}
