'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import type { Driver, TransportRequest, Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { reviewRequestAction, getAllDriversAction, getAllVehiclesAction } from '@/lib/actions';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ReviewRequestDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    request: TransportRequest;
    action: 'Approve' | 'Disapprove';
    onReviewed: () => void;
}

const formSchema = z.object({
    driverId: z.string().optional(),
    vehicleId: z.string().optional(),
    supervisorComments: z.string().optional(),
});

export default function ReviewRequestDialog({ isOpen, setIsOpen, request, action, onReviewed }: ReviewRequestDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            driverId: request.driverId || '',
            vehicleId: request.vehicleId || '',
            supervisorComments: '',
        }
    });

    useEffect(() => {
        if (isOpen && action === 'Approve') {
            async function fetchFleet() {
                const [driverData, vehicleData] = await Promise.all([
                    getAllDriversAction(),
                    getAllVehiclesAction(),
                ]);
                setDrivers(driverData);
                setVehicles(vehicleData);
            }
            fetchFleet();

            // Re-set default values if request changes
            form.reset({
                driverId: request.driverId || '',
                vehicleId: request.vehicleId || '',
                supervisorComments: '',
            });
        } else if (isOpen) {
            form.reset({
                driverId: '',
                vehicleId: '',
                supervisorComments: '',
            });
        }
    }, [isOpen, action, request, form]);

    const { formState: { isSubmitting } } = form;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        try {
            await reviewRequestAction({
                id: request.id,
                status: action === 'Approve' ? 'Approved' : 'Disapproved',
                supervisorComments: values.supervisorComments, // Manager's comments
                reviewedBy: user.name,
                driverId: action === 'Approve' ? values.driverId : undefined,
                vehicleId: action === 'Approve' ? values.vehicleId : undefined,
            });
            toast({
                title: `Request ${action}d`,
                description: `Request ${request.id} has been successfully ${action.toLowerCase()}d.`,
            });
            onReviewed();
            setIsOpen(false);
            form.reset();
        } catch (error) {
            toast({
                title: 'Review Failed',
                description: 'There was an error processing the request.',
                variant: 'destructive'
            })
        }
    }

    const isApprove = action === 'Approve';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{action} Request: {request.id}</DialogTitle>
                    <DialogDescription>
                        You are about to {action.toLowerCase()} this request. Add any final comments below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        {isApprove && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="driverId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Driver</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a driver" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {drivers.map(driver => (
                                                        <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vehicleId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vehicle</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a vehicle" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {vehicles.map(vehicle => (
                                                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.vehicleId}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <FormField
                            control={form.control}
                            name="supervisorComments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manager Comments</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Approved, please ensure timely arrival." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting} className={cn(!isApprove && 'bg-destructive hover:bg-destructive/90')}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {action}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
