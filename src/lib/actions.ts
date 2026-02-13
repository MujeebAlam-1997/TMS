

'use server';

import {
    findUserByCredentials,
    getAllRequests,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    addRequest,
    forwardRequest,
    reviewRequest,
    resetPassword,
    changePassword,
    getAllDrivers,
    addDriver,
    updateDriver,
    deleteDriver,
    getAllVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle
} from './db';
import type { TransportRequest, User, Driver, Vehicle } from './types';
import { revalidatePath } from 'next/cache';

export async function loginAction(
    username: string,
    password?: string
): Promise<User | null> {
    return findUserByCredentials(username, password);
}

export async function getAllUsersAction(): Promise<User[]> {
    return getAllUsers();
}

export async function getAllRequestsAction(): Promise<TransportRequest[]> {
    return getAllRequests();
}

export async function addUserAction(user: Omit<User, 'id'>): Promise<void> {
    addUser(user);
    revalidatePath('/admin/users');
}

export async function updateUserAction(user: User): Promise<void> {
    updateUser(user);
    revalidatePath('/admin/users');
}

export async function deleteUserAction(userId: string): Promise<void> {
    deleteUser(userId);
    revalidatePath('/admin/users');
}

export async function resetPasswordAction(userId: string): Promise<void> {
    resetPassword(userId);
    revalidatePath('/admin/users');
}

export async function changePasswordAction(data: { userId: string, oldPassword: string, newPassword: string }): Promise<{ success: boolean; error?: string }> {
    return changePassword(data.userId, data.oldPassword, data.newPassword);
}

export async function addRequestAction(request: Omit<TransportRequest, 'id' | 'status'>): Promise<void> {
    addRequest(request);
    revalidatePath('/requests/new');
    revalidatePath('/requests/history');
    revalidatePath('/admin/requests');
}

export async function forwardRequestAction(data: {
    id: number;
    driverId: string;
    vehicleId: string;
    managerComments?: string;
    forwardedBy: string;
}): Promise<void> {
    forwardRequest(data);
    revalidatePath('/admin/requests');
    revalidatePath('/requests/history');
}

export async function reviewRequestAction(data: {
    id: number;
    status: 'Approved' | 'Disapproved' | 'Recommended' | 'Not Recommended';
    supervisorComments?: string; // Manager's comments
    pdComments?: string;
    reviewedBy?: string; // Manager's name/ID
    recommendedBy?: string; // PD's name/ID
}): Promise<void> {
    reviewRequest(data);
    revalidatePath('/admin/requests');
    revalidatePath('/requests/history');
}

// Fleet Actions
export async function getAllDriversAction(): Promise<Driver[]> {
    return getAllDrivers();
}

export async function addDriverAction(driver: Omit<Driver, 'id'>): Promise<void> {
    addDriver(driver);
    revalidatePath('/manager/fleet');
}

export async function updateDriverAction(driver: Driver): Promise<void> {
    updateDriver(driver);
    revalidatePath('/manager/fleet');
}

export async function deleteDriverAction(driverId: string): Promise<void> {
    deleteDriver(driverId);
    revalidatePath('/manager/fleet');
}

export async function getAllVehiclesAction(): Promise<Vehicle[]> {
    return getAllVehicles();
}

export async function addVehicleAction(vehicle: Omit<Vehicle, 'id'>): Promise<void> {
    addVehicle(vehicle);
    revalidatePath('/manager/fleet');
}

export async function updateVehicleAction(vehicle: Vehicle): Promise<void> {
    updateVehicle(vehicle);
    revalidatePath('/manager/fleet');
}

export async function deleteVehicleAction(vehicleId: string): Promise<void> {
    deleteVehicle(vehicleId);
    revalidatePath('/manager/fleet');
}
