import axiosInstance from '@/lib/axios';

export type FleetUtilizationResponse = {
  success: boolean;
  data: {
    totalActive: number;
    onTrip: number;
    utilizationRate: number;
  };
};

export type FuelEfficiencyResponse = {
  success: boolean;
  data: {
    totalDistance: number;
    totalFuel: number;
    efficiency: number;
  };
};

export type OperationalCostResponse = {
  success: boolean;
  data: {
    fuelCost: number;
    maintenanceCost: number;
    otherCost: number;
    totalOperationalCost: number;
  };
};

export type VehicleROIResponse = {
  success: boolean;
  data: {
    revenue: number;
    costs: number;
    acquisitionCost: number;
    roi: number;
  };
};

export const getFleetUtilization = async (): Promise<FleetUtilizationResponse> => {
  const response = await axiosInstance.get<FleetUtilizationResponse>('/analytics/fleet-utilization');
  return response.data;
};

export const getFuelEfficiency = async (params?: { vehicleId?: string }): Promise<FuelEfficiencyResponse> => {
  const response = await axiosInstance.get<FuelEfficiencyResponse>('/analytics/fuel-efficiency', { params });
  return response.data;
};

export const getOperationalCost = async (params?: { vehicleId?: string }): Promise<OperationalCostResponse> => {
  const response = await axiosInstance.get<OperationalCostResponse>('/analytics/operational-cost', { params });
  return response.data;
};

export const getVehicleROI = async (params: { vehicleId: string }): Promise<VehicleROIResponse> => {
  const response = await axiosInstance.get<VehicleROIResponse>('/analytics/vehicle-roi', { params });
  return response.data;
};
