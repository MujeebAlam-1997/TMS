'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarIcon, FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { generateReportAction, getAllDriversAction, getAllVehiclesAction } from '@/lib/actions';
import type { Driver, Vehicle, TransportRequest, ReportFilters } from '@/lib/types';
import RequestsTable from '@/components/shared/RequestsTable';
import PageHeader from '@/components/shared/PageHeader';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Simple type for the form, mapping to ReportFilters
type FormValues = {
    from?: Date;
    to?: Date;
    driverId?: string;
    vehicleId?: string;
    status?: string;
    requisitionType?: string;
};

export default function ReportsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<TransportRequest[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const form = useForm<FormValues>();

    useEffect(() => {
        async function fetchOptions() {
            try {
                const [d, v] = await Promise.all([getAllDriversAction(), getAllVehiclesAction()]);
                setDrivers(d);
                setVehicles(v);
            } catch (error) {
                console.error('Failed to fetch filter options', error);
            }
        }
        fetchOptions();
    }, []);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            // Convert empty strings to undefined to match ReportFilters type
            const filters: ReportFilters = {
                from: data.from,
                to: data.to,
                driverId: data.driverId === 'all' ? undefined : data.driverId,
                vehicleId: data.vehicleId === 'all' ? undefined : data.vehicleId,
                status: data.status === 'all' ? undefined : (data.status as any),
                requisitionType: data.requisitionType === 'all' ? undefined : (data.requisitionType as any),
            };

            const results = await generateReportAction(filters);
            setReportData(results);
            toast({
                title: 'Report Generated',
                description: `Found ${results.length} records matching your criteria.`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate report.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        form.reset({
            from: undefined,
            to: undefined,
            driverId: 'all',
            vehicleId: 'all',
            status: 'all',
            requisitionType: 'all'
        });
        setReportData([]);
    };

    const handleExportWord = async () => {
        if (reportData.length === 0) return;

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Req. ID", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Employee", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Destination", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Driver", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Vehicle ID", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                ]
            }),
            ...reportData.map(req => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(req.id.toString())] }),
                    new TableCell({ children: [new Paragraph(req.name)] }),
                    new TableCell({ children: [new Paragraph(req.destination)] }),
                    new TableCell({ children: [new Paragraph(req.driverName || 'N/A')] }),
                    new TableCell({ children: [new Paragraph(req.vehicleNumber || 'N/A')] }),
                    new TableCell({ children: [new Paragraph(format(new Date(req.from), 'PP'))] }),
                    new TableCell({ children: [new Paragraph(req.status)] }),
                ]
            }))
        ];

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "Transport Requests Report",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: `Computer Generated Report on: ${format(new Date(), 'PPpp')}`,
                        spacing: { after: 400 }
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                        rows: tableRows,
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Transport_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.docx`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Reports" description="Generate detailed reports based on filters." />

            <Card>
                <CardHeader>
                    <CardTitle>Filter Criteria</CardTitle>
                    <CardDescription>Select filters to generate a customized report.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Date Range: From */}
                                <FormField
                                    control={form.control}
                                    name="from"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>From Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Date Range: To */}
                                <FormField
                                    control={form.control}
                                    name="to"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>To Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Status */}
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Statuses" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Statuses</SelectItem>
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="Forwarded">Forwarded</SelectItem>
                                                    <SelectItem value="Approved">Approved</SelectItem>
                                                    <SelectItem value="Disapproved">Disapproved</SelectItem>
                                                    <SelectItem value="Recommended">Recommended</SelectItem>
                                                    <SelectItem value="Not Recommended">Not Recommended</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Driver */}
                                <FormField
                                    control={form.control}
                                    name="driverId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Driver</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Drivers" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Drivers</SelectItem>
                                                    {drivers.map(d => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Vehicle */}
                                <FormField
                                    control={form.control}
                                    name="vehicleId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vehicle</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Vehicles" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Vehicles</SelectItem>
                                                    {vehicles.map(v => (
                                                        <SelectItem key={v.id} value={v.id}>{v.vehicleId} ({v.type})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Requisition Type */}
                                <FormField
                                    control={form.control}
                                    name="requisitionType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Types" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Types</SelectItem>
                                                    <SelectItem value="Official">Official</SelectItem>
                                                    <SelectItem value="Private">Private</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={handleClear}>Clear Filters</Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Report
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Results</CardTitle>
                    {reportData.length > 0 && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground shrink-0">
                                {reportData.length} records found
                            </span>
                            <Button variant="outline" size="sm" onClick={handleExportWord} className="shrink-0 flex items-center gap-2">
                                <FileDown className="h-4 w-4" />
                                Export to Word
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <RequestsTable requests={reportData} onDataChange={() => { }} />
                </CardContent>
            </Card>
        </div>
    );
}
