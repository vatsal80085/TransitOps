import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '@/api/trips.api';
import type { Trip } from '@/api/trips.api';
import { getVehicles } from '@/api/vehicles.api';
import { getAvailableDrivers } from '@/api/drivers.api';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '@/components/common/DataTable';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

// Zod schema for Trip creation
const tripFormSchema = z.object({
  source: z.string().min(1, 'Source location is required'),
  destination: z.string().min(1, 'Destination location is required'),
  vehicle: z.string().min(1, 'Vehicle is required'),
  driver: z.string().min(1, 'Driver is required'),
  cargo_weight: z.coerce.number().positive('Cargo weight must be greater than 0'),
  planned_distance: z.coerce.number().positive('Planned distance must be greater than 0'),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

// Zod schema for Trip completion
const completeFormSchema = z.object({
  actual_distance: z.coerce.number().positive('Actual distance must be positive'),
  fuel_consumed: z.coerce.number().positive('Fuel consumed must be positive'),
  final_odometer: z.coerce.number().positive('Final odometer reading is required'),
});

type CompleteFormValues = z.infer<typeof completeFormSchema>;

export function DispatchPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDispatcher = user?.role === 'DISPATCHER';

  // State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);

  const createForm = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema) as any,
    defaultValues: {
      source: '',
      destination: '',
      vehicle: '',
      driver: '',
      cargo_weight: 0,
      planned_distance: 0,
    },
  });

  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeFormSchema) as any,
    defaultValues: {
      actual_distance: 0,
      fuel_consumed: 0,
      final_odometer: 0,
    },
  });

  // Queries
  const { data: tripsData, isLoading, error } = useQuery({
    queryKey: ['trips', { statusFilter }],
    queryFn: () => getTrips({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
  });

  // Fetch available vehicles and drivers for the dispatch form
  const { data: availableVehiclesData } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: () => getVehicles({ status: 'AVAILABLE', limit: 100 }),
    enabled: isCreateOpen,
  });

  const { data: availableDriversData } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: getAvailableDrivers,
    enabled: isCreateOpen,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setIsCreateOpen(false);
      createForm.reset();
      alert('Trip draft created successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message;
      const msgLower = msg.toLowerCase();
      if (msgLower.includes('vehicle')) {
        createForm.setError('vehicle', { type: 'manual', message: msg });
      } else if (msgLower.includes('driver')) {
        createForm.setError('driver', { type: 'manual', message: msg });
      } else if (msgLower.includes('cargo')) {
        createForm.setError('cargo_weight', { type: 'manual', message: msg });
      } else if (msgLower.includes('distance')) {
        createForm.setError('planned_distance', { type: 'manual', message: msg });
      } else {
        alert(`Trip creation failed: ${msg}`);
      }
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: dispatchTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      alert('Trip dispatched successfully!');
    },
    onError: (err: any) => {
      alert(`Dispatch failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setCompletingTrip(null);
      completeForm.reset();
      alert('Trip completed successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message;
      if (msg.toLowerCase().includes('odometer')) {
        completeForm.setError('final_odometer', { type: 'manual', message: msg });
      } else {
        alert(`Trip completion failed: ${msg}`);
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      alert('Trip cancelled successfully!');
    },
    onError: (err: any) => {
      alert(`Trip cancellation failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const handleCreateSubmit = (values: TripFormValues) => {
    createMutation.mutate(values);
  };

  const handleCompleteSubmit = (values: CompleteFormValues) => {
    if (completingTrip) {
      completeMutation.mutate({ id: completingTrip._id, data: values });
    }
  };

  const handleOpenComplete = (trip: Trip) => {
    setCompletingTrip(trip);
    completeForm.reset({
      actual_distance: trip.planned_distance,
      fuel_consumed: 0,
      final_odometer: trip.vehicle ? trip.vehicle.odometer + trip.planned_distance : 0,
    });
  };

  const activeVehiclesOptions = (availableVehiclesData?.data?.vehicles || []).map((v) => ({
    label: `${v.registrationNumber} - ${v.name} (${v.maximumLoadCapacity} kg cap)`,
    value: v._id,
  }));

  const activeDriversOptions = (availableDriversData?.data || []).map((d) => ({
    label: `${d.name} (${d.license_category})`,
    value: d._id,
  }));

  const columns = [
    {
      key: 'route',
      header: 'Route / Location',
      render: (t: Trip) => (
        <div>
          <span className="font-medium text-foreground">{t.source}</span>
          <span className="text-muted-foreground mx-1">→</span>
          <span className="font-medium text-foreground">{t.destination}</span>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Assigned Vehicle',
      render: (t: Trip) => (
        <div>
          <p className="font-medium text-foreground">{t.vehicle?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{t.vehicle?.registrationNumber || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Assigned Driver',
      render: (t: Trip) => (
        <div>
          <p className="font-medium text-foreground">{t.driver?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{t.driver?.license_number || 'N/A'}</p>
        </div>
      ),
    },
    { key: 'cargo_weight', header: 'Weight', render: (t: Trip) => `${t.cargo_weight} kg` },
    { key: 'planned_distance', header: 'Est. Dist', render: (t: Trip) => `${t.planned_distance} km` },
    {
      key: 'status',
      header: 'Status',
      render: (t: Trip) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (t.status === 'Draft') variant = 'neutral';
        else if (t.status === 'Dispatched') variant = 'info';
        else if (t.status === 'Completed') variant = 'success';
        else if (t.status === 'Cancelled') variant = 'danger';

        return <Badge variant={variant}>{t.status}</Badge>;
      },
    },
  ];

  const actions = (row: Trip) => {
    if (!isDispatcher) return null;
    return (
      <div className="flex items-center gap-1.5">
        {row.status === 'Draft' && (
          <>
            <Button variant="default" size="sm" onClick={() => dispatchMutation.mutate(row._id)}>
              Dispatch
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              size="sm"
              onClick={() => cancelMutation.mutate(row._id)}
            >
              Cancel
            </Button>
          </>
        )}
        {row.status === 'Dispatched' && (
          <>
            <Button variant="secondary" size="sm" onClick={() => handleOpenComplete(row)}>
              Complete
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              size="sm"
              onClick={() => cancelMutation.mutate(row._id)}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dispatch Control Room</h2>
          <p className="text-muted-foreground">Orchestrate logistics dispatches. Enforces license validity and vehicle capacity constraints.</p>
        </div>
        {isDispatcher && <Button onClick={() => setIsCreateOpen(true)}>Create Trip</Button>}
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-4 rounded-md border border-border bg-card p-4">
        <div className="w-72 space-y-1.5">
          <Label>Filter Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Trips" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Trips</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Dispatched">Dispatched</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Failed to fetch trip logs.
        </div>
      ) : (
        <DataTable
          columns={columns as any}
          data={tripsData?.data || []}
          isLoading={isLoading}
          pageSize={10}
          actions={actions as any}
        />
      )}

      {/* Trip Creation Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">Plan Dispatch Route</h3>
            <p className="text-sm text-muted-foreground">Set up cargo constraints and dispatch assignments. Saves in draft state.</p>
          </div>
          <form className="space-y-4 py-4" onSubmit={createForm.handleSubmit(handleCreateSubmit as any)}>
            <FormField control={createForm.control as any} name="source" label="Source Location" placeholder="e.g. Chicago Depot 3" required />
            <FormField control={createForm.control as any} name="destination" label="Destination Location" placeholder="e.g. Detroit Fulfillment Center" required />
            <FormField
              control={createForm.control as any}
              name="vehicle"
              label="Assigned Vehicle (AVAILABLE)"
              type="select"
              options={activeVehiclesOptions}
              placeholder="Select available vehicle"
              required
            />
            <FormField
              control={createForm.control as any}
              name="driver"
              label="Assigned Driver (Available & Valid)"
              type="select"
              options={activeDriversOptions}
              placeholder="Select eligible driver"
              required
            />
            <FormField control={createForm.control as any} name="cargo_weight" label="Cargo Cargo Weight (KG)" type="number" placeholder="e.g. 450" required />
            <FormField control={createForm.control as any} name="planned_distance" label="Estimated Trip Distance (KM)" type="number" placeholder="e.g. 400" required />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Draft
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Trip Completion Sheet */}
      <Sheet open={!!completingTrip} onOpenChange={(open) => !open && setCompletingTrip(null)}>
        <SheetContent className="sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">Log Trip Completion</h3>
            <p className="text-sm text-muted-foreground">Collect actual delivery metrics (actual distance, fuel cost, final odometer).</p>
          </div>
          <form className="space-y-4 py-4" onSubmit={completeForm.handleSubmit(handleCompleteSubmit as any)}>
            <div className="rounded-md bg-muted p-3 text-xs space-y-1">
              <p>
                <span className="font-semibold">Route: </span>
                {completingTrip?.source} → {completingTrip?.destination}
              </p>
              <p>
                <span className="font-semibold">Assigned Vehicle: </span>
                {completingTrip?.vehicle?.name} ({completingTrip?.vehicle?.registrationNumber})
              </p>
              <p>
                <span className="font-semibold">Current Odometer: </span>
                {completingTrip?.vehicle?.odometer} km
              </p>
            </div>
            <FormField control={completeForm.control as any} name="actual_distance" label="Actual Distance Driven (KM)" type="number" required />
            <FormField control={completeForm.control as any} name="fuel_consumed" label="Total Fuel Consumed (Liters)" type="number" required />
            <FormField control={completeForm.control as any} name="final_odometer" label="Final Vehicle Odometer Reading (KM)" type="number" required />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCompletingTrip(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={completeMutation.isPending}>
                Record Completion
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
