

'use client';

import { useMemo, useState, useCallback } from 'react';
import type { TransportRequest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { CheckCircle2, Eye, Send, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import RequestDetailsDialog from './RequestDetailsDialog';
import ForwardRequestDialog from '../manager/ForwardRequestDialog';
import ReviewRequestDialog from '../supervisor/ReviewRequestDialog';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import PDReviewRequestDialog from './PDReviewRequestDialog';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';


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
  'Not Recommended': 'destructive',
  Cancelled: 'destructive'
};

const statusColor: { [key: string]: string } = {
  Pending: 'bg-yellow-400 text-black hover:bg-yellow-400/80',
  Approved: 'bg-green-500 hover:bg-green-500/80',
  Disapproved: 'bg-red-500 hover:bg-red-500/80',
  Recommended: 'bg-blue-500 hover:bg-blue-500/80',
  'Not Recommended': 'bg-orange-500 hover:bg-orange-500/80',
  Cancelled: 'bg-red-600 text-white hover:bg-red-600/80'
}

export default function RequestsTable({ requests, onDataChange }: RequestsTableProps) {
  const { userRole } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [isForwardOpen, setForwardOpen] = useState(false);
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [isPDReviewOpen, setPDReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'Approve' | 'Disapprove' | 'Recommend' | 'Not Recommend'>('Approve');

  const [isCancelOpen, setCancelOpen] = useState(false);

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

  const handleCancelRequestClick = (request: TransportRequest) => {
    setSelectedRequest(request);
    setCancelOpen(true);
  };

  const confirmCancelRequest = async () => {
    if (selectedRequest) {
      const { cancelRequestAction } = await import('@/lib/actions');
      await cancelRequestAction(selectedRequest.id);
      setCancelOpen(false);
      handleDataChange();
    }
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

        {userRole === 'User' && request.status !== 'Cancelled' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCancelRequestClick(request)}>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="sr-only">Cancel Request</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancel Request</TooltipContent>
          </Tooltip>
        )}

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

  // Do not early-return based on data length to keep Hooks order consistent

  // PrimeReact DataTable with per-column filters
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: 'contains' },
    id: { value: null, matchMode: 'contains' },
    name: { value: null, matchMode: 'contains' },
    destination: { value: null, matchMode: 'contains' },
    driverName: { value: null, matchMode: 'contains' },
    vehicleNumber: { value: null, matchMode: 'contains' },
    status: { value: null, matchMode: 'equals' },
  });
  const [globalFilter, setGlobalFilter] = useState<string>('');

  const statusBody = (row: TransportRequest) => (
    <Badge variant={statusVariant[row.status] || 'default'} className={cn(statusColor[row.status])}>{row.status}</Badge>
  );
  const dateBody = (row: TransportRequest) => format(row.from, 'PP');
  const actionsBody = (row: TransportRequest) => <ActionsCell request={row} />;

  const header = (
    <div className="flex items-center justify-between">
      <h2 className="text-base  ">Requests</h2>
      <div className="relative">
        <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <InputText
          value={globalFilter}
          onChange={(e: any) => {
            setGlobalFilter(e.target.value);
            setFilters((f: any) => ({
              ...f,
              global: { value: e.target.value, matchMode: 'contains' },
            }));
          }}
          placeholder="Search"
          className="pl-10 font-normal"
        />
      </div>
    </div>
  );


  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <DataTable
            value={requests}
            paginator
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"

            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            removableSort
            sortMode="multiple"
            filters={filters}
            onFilter={(e: any) => setFilters(e.filters)}

            header={header}
            emptyMessage="No requests found."
            scrollable
            scrollHeight="60vh"
            dataKey="id"
            className="text-[14px]"
            style={{ fontFamily: '"Inter var", sans-serif' }}
          >
            <Column field="id" header="Req. ID" headerClassName=" !text-sm " />
            <Column field="name" header="Employee" headerClassName="!text-sm " />
            <Column field="destination" header="Destination" headerClassName="!text-sm " />
            <Column field="driverName" header="Driver" headerClassName="!text-sm " />
            <Column field="vehicleNumber" header="Vehicle ID" headerClassName="!text-sm " />
            <Column field="from" header="Date" body={dateBody} sortable headerClassName="!text-sm " />
            <Column field="status" header="Status" body={statusBody} headerClassName="!text-sm " />
            <Column header="Actions" body={actionsBody} headerClassName="text-right !text-sm " bodyClassName="text-right" style={{ width: '6rem' }} />
          </DataTable>
        </CardContent>
      </Card>

      {selectedRequest && (
        <>
          <RequestDetailsDialog
            isOpen={isDetailsOpen}
            setIsOpen={setDetailsOpen}
            request={selectedRequest}
          />
          <ForwardRequestDialog isOpen={isForwardOpen} setIsOpen={setForwardOpen} request={selectedRequest} onForwarded={handleDataChange} />
          <ReviewRequestDialog isOpen={isReviewOpen} setIsOpen={setReviewOpen} request={selectedRequest} action={reviewAction as 'Approve' | 'Disapprove'} onReviewed={handleDataChange} />
          <PDReviewRequestDialog isOpen={isPDReviewOpen} setIsOpen={setPDReviewOpen} request={selectedRequest} action={reviewAction as 'Recommend' | 'Not Recommend'} onReviewed={handleDataChange} />
        </>
      )}

      <Dialog open={isCancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Back</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmCancelRequest}>Cancel Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
