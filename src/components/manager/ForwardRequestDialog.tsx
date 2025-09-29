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
import { forwardRequestAction, getAllDriversAction, getAllVehiclesAction } from '@/lib/actions';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ForwardRequestDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  request: TransportRequest;
  onForwarded: () => void;
}

const formSchema = z.object({
    driverId: z.string().min(1, 'Driver is required.'),
    vehicleId: z.string().min(1, 'Vehicle is required.'),
    supervisorComments: z.string().optional(),
});

export default function ForwardRequestDialog({ isOpen, setIsOpen, request, onForwarded }: ForwardRequestDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            driverId: '',
            vehicleId: '',
            supervisorComments: '',
        },
    });

    useEffect(() => {
        if(isOpen) {
            async function fetchFleet() {
                const [driverData, vehicleData] = await Promise.all([
                    getAllDriversAction(),
                    getAllVehiclesAction(),
                ]);
                setDrivers(driverData);
                setVehicles(vehicleData);
            }
            fetchFleet();
        }
    }, [isOpen]);

    const {formState: {isSubmitting}} = form;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        try {
            await forwardRequestAction({
                id: request.id,
                driverId: values.driverId,
                vehicleId: values.vehicleId,
                managerComments: values.supervisorComments, // Swapped field
                forwardedBy: user.name,
            });
             toast({
                title: 'Request Forwarded',
                description: `Request ${request.id} has been forwarded to the manager.`,
            });
            onForwarded();
            setIsOpen(false);
            form.reset();
        } catch (error) {
            toast({
                title: 'Forwarding Failed',
                description: 'There was an error forwarding the request.',
                variant: 'destructive'
            })
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Forward Request: {request.id}</DialogTitle>
          <DialogDescription>Assign a driver and vehicle, and add comments before forwarding to a manager.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="driverId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Driver</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField
                    control={form.control}
                    name="supervisorComments"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comments</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Add any relevant comments..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Forward Request
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
