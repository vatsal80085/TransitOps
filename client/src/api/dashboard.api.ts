/**
 * Expected dashboard response shape:
 * {
 *   summary: {
 *     activeVehicles: number
 *     pendingDispatches: number
 *     maintenanceDue: number
 *     totalExpenses: number
 *   },
 *   dispatchTrend: Array<{ day: string; dispatches: number }>,
 *   vehicleStatusBreakdown: Array<{ status: string; count: number }>,
 *   recentActivity: Array<{
 *     date: string
 *     type: string
 *     description: string
 *     status: string
 *   }>
 * }
 */

import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'

const shouldUseMocks = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false'

export type DashboardFilters = {
  vehicleType?: string
  status?: string
  region?: string
}

export type DashboardSummaryResponse = {
  summary: {
    activeVehicles: number
    availableVehicles: number
    pendingDispatches: number
    activeTrips: number
    maintenanceDue: number
    totalExpenses: number
    driversOnDuty: number
    fleetUtilization: number
  }
  dispatchTrend: Array<{ day: string; dispatches: number }>
  vehicleStatusBreakdown: Array<{ status: string; count: number }>
  recentActivity: Array<{
    date: string
    type: string
    description: string
    status: string
  }>
}

const mockDashboardSummary: DashboardSummaryResponse = {
  summary: {
    activeVehicles: 102,
    availableVehicles: 16,
    pendingDispatches: 18,
    activeTrips: 12,
    maintenanceDue: 6,
    totalExpenses: 28400,
    driversOnDuty: 45,
    fleetUtilization: 86.4,
  },
  dispatchTrend: [
    { day: 'Mon', dispatches: 12 },
    { day: 'Tue', dispatches: 18 },
    { day: 'Wed', dispatches: 15 },
    { day: 'Thu', dispatches: 22 },
    { day: 'Fri', dispatches: 21 },
    { day: 'Sat', dispatches: 16 },
    { day: 'Sun', dispatches: 19 },
  ],
  vehicleStatusBreakdown: [
    { status: 'active', count: 102 },
    { status: 'maintenance', count: 24 },
    { status: 'idle', count: 16 },
  ],
  recentActivity: [
    { date: '2026-07-12', type: 'Dispatch', description: 'Route 18 morning departure confirmed', status: 'Scheduled' },
    { date: '2026-07-12', type: 'Maintenance', description: 'Engine diagnostics queued for bus 114', status: 'Pending' },
    { date: '2026-07-11', type: 'Expense', description: 'Fuel reimbursement submitted for depot 2', status: 'Review' },
    { date: '2026-07-11', type: 'Dispatch', description: 'Airport shuttle reassigned during weather delay', status: 'Active' },
    { date: '2026-07-10', type: 'Vehicle', description: 'Bus 221 returned to service after inspection', status: 'Ready' },
  ],
}

export const getDashboardSummary = async (filters?: DashboardFilters): Promise<DashboardSummaryResponse> => {
  if (shouldUseMocks) {
    return mockDashboardSummary
  }

  const response = await axiosInstance.get<DashboardSummaryResponse>('/dashboard/summary', { params: filters })
  return response.data
}

export function useDashboardSummary(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard-summary', filters],
    queryFn: () => getDashboardSummary(filters),
  })
}
