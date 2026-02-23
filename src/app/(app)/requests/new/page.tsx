

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, PlusCircle, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, setHours, setMinutes, setSeconds, addMinutes } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { addRequestAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const officialSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    employeeNumber: z.string().min(1, 'Employee number is required'),
});

const formSchema = z.object({
    employeeNumber: z.string().min(1, 'Employee number is required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    requisitionType: z.enum(['Official', 'Private'], {
        required_error: 'You need to select a requisition type.',
    }),
    requestReason: z.enum(['For Meeting', 'For Purchase', 'Other'], {
        required_error: 'You need to select a reason for the request.',
    }),
    departingLocation: z.string().min(1, 'Departing location is required'),
    destination: z.string().min(1, 'Destination is required'),
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
    fromTime: z.string({ required_error: 'A start time is required.' }),
    toTime: z.string({ required_error: 'An end time is required.' }),
    officials: z.array(officialSchema).min(1, 'Please add at least one official.'),

    // Meeting fields
    letterId: z.string().optional(),
    meetingAgenda: z.string().optional(),
    venue: z.string().optional(),

    // Purchase fields
    purchaseDetails: z.string().optional(),
    purchaseItems: z.string().optional(),
    purchaseCaseNumber: z.string().optional(),
    subject: z.string().optional(),

    // Other field
    otherPurpose: z.string().optional(),
}).refine(data => {
    if (!data.from || !data.fromTime) return true;
    const [hours, minutes] = data.fromTime.split(':').map(Number);
    const fromDateTime = setSeconds(setMinutes(setHours(data.from, hours), minutes), 0);
    const now = new Date();
    now.setSeconds(0, 0);
    return fromDateTime >= now;
}, {
    message: "Start date and time must be in the future.",
    path: ["from"],
}).refine(data => {
    if (!data.from || !data.to || !data.fromTime || !data.toTime) return true;
    const [fromHours, fromMinutes] = data.fromTime.split(':').map(Number);
    const fromDateTime = setSeconds(setMinutes(setHours(data.from, fromHours), fromMinutes), 0);
    const [toHours, toMinutes] = data.toTime.split(':').map(Number);
    const toDateTime = setSeconds(setMinutes(setHours(data.to, toHours), toMinutes), 0);
    return toDateTime > fromDateTime;
}, {
    message: "End date and time must be after the start date and time.",
    path: ["to"],
}).refine(data => {
    if (data.requestReason === 'For Meeting') {
        return !!data.letterId && !!data.meetingAgenda && !!data.venue;
    }
    return true;
}, {
    message: 'Letter ID, Meeting Agenda, and Venue are required for meetings.',
    path: ['venue'], // Show error on last field of the group
}).refine(data => {
    if (data.requestReason === 'For Purchase') {
        return !!data.purchaseDetails && !!data.purchaseItems && !!data.purchaseCaseNumber && !!data.subject;
    }
    return true;
}, {
    message: 'All purchase fields are required.',
    path: ['subject'], // Show error on last field of the group
}).refine(data => {
    if (data.requestReason === 'Other') {
        return !!data.otherPurpose;
    }
    return true;
}, {
    message: 'Purpose with detail is required for other requests.',
    path: ['otherPurpose'],
});

export default function NewRequestPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [isClient, setIsClient] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employeeNumber: '',
            name: '',
            requisitionType: 'Official',
            requestReason: 'For Meeting',
            departingLocation: '',
            destination: '',
            fromTime: '09:00',
            toTime: '17:00',
            officials: [{ name: '', employeeNumber: '' }],
            letterId: '',
            meetingAgenda: '',
            venue: '',
            purchaseDetails: '',
            purchaseItems: '',
            purchaseCaseNumber: '',
            subject: '',
            otherPurpose: '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "officials"
    });

    const requestReason = form.watch('requestReason');

    useEffect(() => {
        setIsClient(true);
        if (user) {
            form.setValue('employeeNumber', user.employeeNumber);
            form.setValue('name', user.name);
        }

        const now = new Date();
        const fromTimeDefault = format(now, 'HH:mm');
        const toTimeDefault = format(addMinutes(now, 10), 'HH:mm');

        form.setValue('fromTime', fromTimeDefault);
        form.setValue('toTime', toTimeDefault);
        form.setValue('from', now);
        form.setValue('to', now);

    }, [user, form]);

    const { formState: { isSubmitting } } = form;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return;
        try {
            const [fromHours, fromMinutes] = values.fromTime.split(':').map(Number);
            const fromDateTime = setSeconds(setMinutes(setHours(values.from, fromHours), fromMinutes), 0);

            const [toHours, toMinutes] = values.toTime.split(':').map(Number);
            const toDateTime = setSeconds(setMinutes(setHours(values.to, toHours), toMinutes), 0);

            await addRequestAction({
                ...values,
                from: fromDateTime,
                to: toDateTime,
                requestGeneratedDate: new Date(),
                officials: values.officials || [],
                pdId: user.pdId,
            });
            toast({
                title: "Request Submitted!",
                description: "Your transport request has been successfully submitted.",
            });
            form.reset();
            router.push('/requests/history');
        } catch (error) {
            console.error(error);
            toast({
                title: "Submission Failed",
                description: "There was an error submitting your request. Please try again.",
                variant: 'destructive'
            })
        }
    }

    const onError = (errors: any) => {
        if (errors.officials && !Array.isArray(errors.officials)) {
            toast({
                title: "Validation Error",
                description: errors.officials.message || "Please add at least one official.",
                variant: 'destructive'
            });
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="space-y-8">
            <PageHeader title="Generate New Request" description="Fill out the form below to request transportation." />
            <Card>
                <CardHeader>
                    <CardTitle>Request Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Officials</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', employeeNumber: '' })}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Official
                                    </Button>
                                </div>
                                {form.formState.errors.officials && !Array.isArray(form.formState.errors.officials) && (
                                    <p className="text-sm font-medium text-destructive">{form.formState.errors.officials.message}</p>
                                )}
                                {fields.length === 0 && <p className="text-sm text-muted-foreground">No officials added.</p>}
                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg">
                                            <div className="grid md:grid-cols-2 gap-4 flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`officials.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Name</FormLabel>
                                                            <FormControl><Input placeholder="Official's name" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`officials.${index}.employeeNumber`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Employee Number</FormLabel>
                                                            <FormControl><Input maxLength={6} placeholder="Official's employee number" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="mt-8 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Request Generated By</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <FormField control={form.control} name="employeeNumber" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employee Number</FormLabel>
                                            <FormControl><Input placeholder="e.g., 12345" {...field} disabled /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., John Doe" {...field} disabled /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <Separator />
                            <div className="grid md:grid-cols-2 gap-8">
                                <FormField control={form.control} name="departingLocation" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Departing Location</FormLabel>
                                        <FormControl><Input placeholder="e.g., Main Office" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="destination" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destination</FormLabel>
                                        <FormControl><Input placeholder="e.g., Site B" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="from"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col flex-1">
                                                <FormLabel>From</FormLabel>
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
                                                                    format(field.value, "PP")
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
                                                            disabled={(date) => {
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                return date < today;
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="fromTime" render={({ field }) => (
                                        <FormItem className='flex flex-col'>
                                            <FormLabel>Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="to"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col flex-1">
                                                <FormLabel>To</FormLabel>
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
                                                                    format(field.value, "PP")
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
                                                            disabled={(date) => {
                                                                const fromDate = form.getValues('from');
                                                                if (!fromDate) {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    return date < today;
                                                                }
                                                                const fromDateWithoutTime = new Date(fromDate);
                                                                fromDateWithoutTime.setHours(0, 0, 0, 0);
                                                                return date < fromDateWithoutTime;
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="toTime" render={({ field }) => (
                                        <FormItem className='flex flex-col'>
                                            <FormLabel>Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="requisitionType" render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Requisition Type</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="Official" /></FormControl>
                                                    <FormLabel className="font-normal">Official</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="Private" /></FormControl>
                                                    <FormLabel className="font-normal">Private</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="requestReason" render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Reason for Request</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="For Meeting" /></FormControl>
                                                    <FormLabel className="font-normal">For Meeting</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="For Purchase" /></FormControl>
                                                    <FormLabel className="font-normal">For Purchase</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="Other" /></FormControl>
                                                    <FormLabel className="font-normal">Other</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {requestReason === 'For Meeting' && (
                                <div className="space-y-8 pt-4 border-t">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <FormField control={form.control} name="letterId" render={({ field }) => (
                                            <FormItem><FormLabel>Letter ID with Date</FormLabel><FormControl><Input placeholder="e.g., F-123, 2024-07-26" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="venue" render={({ field }) => (
                                            <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="e.g., Conference Room A" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="meetingAgenda" render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Meeting Agenda</FormLabel><FormControl><Textarea placeholder="Describe the meeting agenda" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {requestReason === 'For Purchase' && (
                                <div className="space-y-8 pt-4 border-t">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <FormField control={form.control} name="purchaseCaseNumber" render={({ field }) => (
                                            <FormItem><FormLabel>Purchase Case Number</FormLabel><FormControl><Input placeholder="e.g., PC-987" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="subject" render={({ field }) => (
                                            <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Office Supplies" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="purchaseDetails" render={({ field }) => (
                                            <FormItem><FormLabel>Details of Purchase</FormLabel><FormControl><Textarea placeholder="Describe the purchase" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="purchaseItems" render={({ field }) => (
                                            <FormItem><FormLabel>Items to be Purchased</FormLabel><FormControl><Textarea placeholder="List items..." {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </div>
                            )}

                            {requestReason === 'Other' && (
                                <div className="space-y-8 pt-4 border-t">
                                    <FormField control={form.control} name="otherPurpose" render={({ field }) => (
                                        <FormItem><FormLabel>Purpose with Detail</FormLabel><FormControl><Textarea placeholder="Please provide a detailed purpose for the request" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                            )}


                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
