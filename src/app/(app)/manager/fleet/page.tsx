
'use client';

import PageHeader from '@/components/shared/PageHeader';
import AddEditDriverDialog from '@/components/manager/AddEditDriverDialog';
import AddEditVehicleDialog from '@/components/manager/AddEditVehicleDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  deleteDriverAction,
  deleteVehicleAction,
  getAllDriversAction,
  getAllVehiclesAction,
} from '@/lib/actions';
import type { Driver, Vehicle } from '@/lib/types';
import { Edit, MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog';

export default function FleetPage() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDriverDialogOpen, setDriverDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'driver' | 'vehicle', id: string, name: string} | null>(null);


  const fetchFleetData = useCallback(async () => {
    try {
      const [driverData, vehicleData] = await Promise.all([
        getAllDriversAction(),
        getAllVehiclesAction(),
      ]);
      setDrivers(driverData);
      setVehicles(vehicleData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch fleet data.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  const handleAddDriver = () => {
    setSelectedDriver(null);
    setDriverDialogOpen(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverDialogOpen(true);
  };

  const handleDeleteDriver = (driver: Driver) => {
    setItemToDelete({type: 'driver', id: driver.id, name: driver.name});
    setDeleteDialogOpen(true);
  };
  
  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleDialogOpen(true);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setItemToDelete({type: 'vehicle', id: vehicle.id, name: vehicle.vehicleId});
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
        if (itemToDelete.type === 'driver') {
            await deleteDriverAction(itemToDelete.id);
        } else {
            await deleteVehicleAction(itemToDelete.id);
        }
        toast({ title: 'Success', description: `${itemToDelete.type} deleted successfully.` });
        fetchFleetData();
    } catch(err) {
        toast({ title: 'Error', description: `Failed to delete ${itemToDelete.type}.`, variant: 'destructive'});
    } finally {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fleet Management"
        description="Manage your drivers and vehicles."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Drivers</CardTitle>
            <Button size="sm" onClick={handleAddDriver}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>{driver.name}</TableCell>
                      <TableCell>{driver.contact}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditDriver(driver)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDriver(driver)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vehicles</CardTitle>
            <Button size="sm" onClick={handleAddVehicle}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.vehicleId}</TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteVehicle(vehicle)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <AddEditDriverDialog
        isOpen={isDriverDialogOpen}
        setIsOpen={setDriverDialogOpen}
        driver={selectedDriver}
        onSuccess={fetchFleetData}
      />
      <AddEditVehicleDialog
        isOpen={isVehicleDialogOpen}
        setIsOpen={setVehicleDialogOpen}
        vehicle={selectedVehicle}
        onSuccess={fetchFleetData}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type} '{itemToDelete?.name}'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
