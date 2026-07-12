import axiosInstance from '@/lib/axios';

export type Vehicle = {
  _id: string;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maximumLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
  createdAt: string;
  updatedAt: string;
  totalFuelCost?: number;
  totalMaintenanceCost?: number;
  totalOperationalCost?: number;
};

export type QueryParams = {
  status?: string;
  type?: string;
  region?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type VehiclesResponse = {
  success: boolean;
  data: {
    vehicles: Vehicle[];
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export const getVehicles = async (params: QueryParams): Promise<VehiclesResponse> => {
  const response = await axiosInstance.get<VehiclesResponse>('/vehicles', { params });
  return response.data;
};

export const getVehicleById = async (id: string): Promise<Vehicle> => {
  const response = await axiosInstance.get<{ success: boolean; data: { vehicle: Vehicle } }>(
    `/vehicles/${id}`
  );
  return response.data.data.vehicle;
};

export const createVehicle = async (
  data: Omit<Vehicle, '_id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<Vehicle> => {
  const response = await axiosInstance.post<{ success: boolean; data: { vehicle: Vehicle } }>(
    '/vehicles',
    data
  );
  return response.data.data.vehicle;
};

export const updateVehicle = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Vehicle>;
}): Promise<Vehicle> => {
  const response = await axiosInstance.patch<{ success: boolean; data: { vehicle: Vehicle } }>(
    `/vehicles/${id}`,
    data
  );
  return response.data.data.vehicle;
};

export const retireVehicle = async (id: string): Promise<Vehicle> => {
  const response = await axiosInstance.post<{ success: boolean; data: { vehicle: Vehicle } }>(
    `/vehicles/${id}/retire`
  );
  return response.data.data.vehicle;
};
