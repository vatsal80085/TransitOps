import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getVehicles, createVehicle, updateVehicle, retireVehicle } from '@/api/vehicles.api';
import type { Vehicle } from '@/api/vehicles.api';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '@/components/common/DataTable';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

const vehicleFormSchema = z.object({
  registrationNumber: z
    .string()
    .min(2, 'Registration number must be at least 2 characters')
    .toUpperCase(),
  name: z.string().min(1, 'Name is required'),
  model: z.string().min(1, 'Model is required'),
  type: z.string().min(1, 'Type is required'),
  maximumLoadCapacity: z.coerce.number().positive('Capacity must be a positive number'),
  odometer: z.coerce.number().nonnegative('Odometer must be non-negative'),
  acquisitionCost: z.coerce.number().positive('Cost must be positive'),
  region: z.string().min(1, 'Region is required'),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export function VehiclesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isFleetManager = user?.role === 'FLEET_MANAGER';

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Form Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema) as any,
    defaultValues: {
      registrationNumber: '',
      name: '',
      model: '',
      type: '',
      maximumLoadCapacity: 0,
      odometer: 0,
      acquisitionCost: 0,
      region: '',
    },
  });

  // Query Vehicles
  const { data: vehiclesData, isLoading, error } = useQuery({
    queryKey: ['vehicles', { search, status, typeFilter, regionFilter }],
    queryFn: () =>
      getVehicles({
        search: search || undefined,
        status: status !== 'ALL' ? status : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        region: regionFilter !== 'ALL' ? regionFilter : undefined,
        page: 1,
        limit: 100,
      }),
  });

  // Create/Update Mutations
  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsSheetOpen(false);
      form.reset();
      alert('Vehicle registered successfully!');
    },
    onError: (err: any) => {
      alert(`Registration failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsSheetOpen(false);
      setEditingVehicle(null);
      form.reset();
      alert('Vehicle updated successfully!');
    },
    onError: (err: any) => {
      alert(`Update failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const retireMutation = useMutation({
    mutationFn: retireVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      alert('Vehicle retired successfully!');
    },
    onError: (err: any) => {
      alert(`Retirement failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const handleOpenAddSheet = () => {
    setEditingVehicle(null);
    form.reset({
      registrationNumber: '',
      name: '',
      model: '',
      type: '',
      maximumLoadCapacity: 0,
      odometer: 0,
      acquisitionCost: 0,
      region: '',
    });
    setIsSheetOpen(true);
  };

  const handleOpenEditSheet = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.reset({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      model: vehicle.model,
      type: vehicle.type,
      maximumLoadCapacity: vehicle.maximumLoadCapacity,
      odometer: vehicle.odometer,
      acquisitionCost: vehicle.acquisitionCost,
      region: vehicle.region,
    });
    setIsSheetOpen(true);
  };

  const handleFormSubmit = (values: VehicleFormValues) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleRetireClick = (id: string) => {
    if (window.confirm('Are you sure you want to retire this vehicle? This action cannot be undone.')) {
      retireMutation.mutate(id);
    }
  };

  const typeOptions = [
    { label: 'Van', value: 'Van' },
    { label: 'Truck', value: 'Truck' },
    { label: 'Sedan', value: 'Sedan' },
    { label: 'Bus', value: 'Bus' },
  ];

  // Table columns definition
  const columns = [
    { key: 'registrationNumber', header: 'Reg No.', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'model', header: 'Model' },
    { key: 'type', header: 'Type' },
    {
      key: 'maximumLoadCapacity',
      header: 'Capacity',
      render: (v: Vehicle) => `${v.maximumLoadCapacity} kg`,
    },
    { key: 'odometer', header: 'Odometer', render: (v: Vehicle) => `${v.odometer} km` },
    {
      key: 'totalOperationalCost',
      header: 'Op. Cost',
      render: (v: Vehicle) => `$${(v.totalOperationalCost || 0).toLocaleString()}`,
    },
    { key: 'region', header: 'Region' },
    {
      key: 'status',
      header: 'Status',
      render: (v: Vehicle) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (v.status === 'AVAILABLE') variant = 'success';
        else if (v.status === 'ON_TRIP') variant = 'info';
        else if (v.status === 'IN_SHOP') variant = 'warning';
        else if (v.status === 'RETIRED') variant = 'danger';

        return <Badge variant={variant}>{v.status}</Badge>;
      },
    },
  ];

  const actions = (row: Vehicle) => {
    if (!isFleetManager) return null;
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleOpenEditSheet(row)}>
          Edit
        </Button>
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          size="sm"
          disabled={row.status === 'RETIRED' || row.status === 'ON_TRIP'}
          onClick={() => handleRetireClick(row._id)}
        >
          Retire
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage and track fleet assets, operational status, and region deployment.</p>
        </div>
        {isFleetManager && (
          <Button onClick={handleOpenAddSheet}>Register Vehicle</Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Search</Label>
          <Input
            placeholder="Search reg no, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
              <SelectItem value="ON_TRIP">ON_TRIP</SelectItem>
              <SelectItem value="IN_SHOP">IN_SHOP</SelectItem>
              <SelectItem value="RETIRED">RETIRED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Sedan">Sedan</SelectItem>
              <SelectItem value="Bus">Bus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Region</Label>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Regions</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Failed to fetch vehicles list from server.
        </div>
      ) : (
        <DataTable
          columns={columns as any}
          data={(vehiclesData?.data?.vehicles as any) || []}
          isLoading={isLoading}
          pageSize={10}
          actions={actions as any}
        />
      )}

      {/* Form Drawer (Sheet) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">{editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}</h3>
            <p className="text-sm text-muted-foreground">
              {editingVehicle
                ? 'Update fields below to modify existing vehicle records.'
                : 'Fill in fields to add a new physical asset to the fleet inventory.'}
            </p>
          </div>
          <form className="space-y-4 py-4" onSubmit={form.handleSubmit(handleFormSubmit as any)}>
            <FormField
              control={form.control as any}
              name="registrationNumber"
              label="Registration Number"
              placeholder="e.g. MH-12-AB-1234"
              required
            />
            <FormField
              control={form.control as any}
              name="name"
              label="Vehicle Name / Code"
              placeholder="e.g. Van-05"
              required
            />
            <FormField
              control={form.control as any}
              name="model"
              label="Manufacturer / Model"
              placeholder="e.g. Tata Super Ace"
              required
            />
            <FormField
              control={form.control as any}
              name="type"
              label="Vehicle Body Type"
              type="select"
              options={typeOptions}
              placeholder="Select body type"
              required
            />
            <FormField
              control={form.control as any}
              name="maximumLoadCapacity"
              label="Max Cargo Load Capacity (KG)"
              type="number"
              placeholder="e.g. 500"
              required
            />
            <FormField
              control={form.control as any}
              name="odometer"
              label="Current Odometer Reading (KM)"
              type="number"
              placeholder="e.g. 12000"
              required
            />
            <FormField
              control={form.control as any}
              name="acquisitionCost"
              label="Acquisition Purchase Cost ($)"
              type="number"
              placeholder="e.g. 8000"
              required
            />
            <FormField
              control={form.control as any}
              name="region"
              label="Assigned Region"
              placeholder="e.g. North"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Save Vehicle
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
