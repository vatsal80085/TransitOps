import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '@/api/drivers.api';
import type { Driver } from '@/api/drivers.api';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '@/components/common/DataTable';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

const driverFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  license_number: z.string().min(2, 'License number is required').toUpperCase(),
  license_category: z.string().min(1, 'License category is required'),
  license_expiry_date: z.string().min(1, 'License expiry date is required'),
  contact_number: z.string().min(5, 'Contact number is required'),
  safety_score: z.coerce.number().min(0).max(100).default(100),
  region: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

export function DriversPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAuthorized = user?.role === 'SAFETY_OFFICER' || user?.role === 'DISPATCHER';

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema) as any,
    defaultValues: {
      name: '',
      license_number: '',
      license_category: '',
      license_expiry_date: '',
      contact_number: '',
      safety_score: 100,
      region: '',
    },
  });

  // Query Drivers
  const { data: driversData, isLoading, error } = useQuery({
    queryKey: ['drivers', { statusFilter, regionFilter }],
    queryFn: () =>
      getDrivers({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        region: regionFilter !== 'ALL' ? regionFilter : undefined,
      }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsSheetOpen(false);
      form.reset();
      alert('Driver registered successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message;
      if (err.response?.status === 409) {
        form.setError('license_number', { type: 'manual', message: msg });
      } else {
        alert(`Registration failed: ${msg}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsSheetOpen(false);
      setEditingDriver(null);
      form.reset();
      alert('Driver records updated successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message;
      if (err.response?.status === 409) {
        form.setError('license_number', { type: 'manual', message: msg });
      } else {
        alert(`Update failed: ${msg}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      alert('Driver soft-deleted (status set to Off Duty) successfully!');
    },
    onError: (err: any) => {
      alert(`Operation failed: ${err.response?.data?.error?.message || err.message}`);
    },
  });

  const handleOpenAddSheet = () => {
    setEditingDriver(null);
    form.reset({
      name: '',
      license_number: '',
      license_category: '',
      license_expiry_date: '',
      contact_number: '',
      safety_score: 100,
      region: '',
    });
    setIsSheetOpen(true);
  };

  const handleOpenEditSheet = (driver: Driver) => {
    setEditingDriver(driver);
    const expDate = driver.license_expiry_date
      ? new Date(driver.license_expiry_date).toISOString().split('T')[0]
      : '';

    form.reset({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_expiry_date: expDate,
      contact_number: driver.contact_number,
      safety_score: driver.safety_score,
      region: driver.region || '',
    });
    setIsSheetOpen(true);
  };

  const handleFormSubmit = (values: DriverFormValues) => {
    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to deactivate (soft-delete) this driver?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'license_number', header: 'License No.' },
    { key: 'license_category', header: 'Category' },
    {
      key: 'license_expiry_date',
      header: 'License Expiry',
      render: (d: Driver) => {
        const expDate = new Date(d.license_expiry_date);
        const isExpired = expDate <= new Date();
        return (
          <span className={isExpired ? 'font-semibold text-danger animate-pulse' : 'text-foreground'}>
            {expDate.toLocaleDateString()} {isExpired ? '(EXPIRED)' : ''}
          </span>
        );
      },
    },
    { key: 'contact_number', header: 'Contact' },
    {
      key: 'safety_score',
      header: 'Safety Score',
      render: (d: Driver) => {
        let color = 'text-green-600';
        if (d.safety_score < 60) color = 'text-red-500 font-semibold';
        else if (d.safety_score < 80) color = 'text-yellow-600';
        return <span className={color}>{d.safety_score}/100</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (d: Driver) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        if (d.status === 'Available') variant = 'success';
        else if (d.status === 'On Trip') variant = 'info';
        else if (d.status === 'Off Duty') variant = 'neutral';
        else if (d.status === 'Suspended') variant = 'danger';

        return <Badge variant={variant}>{d.status}</Badge>;
      },
    },
  ];

  const actions = (row: Driver) => {
    if (!isAuthorized) return null;
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleOpenEditSheet(row)}>
          Edit
        </Button>
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          size="sm"
          disabled={row.status === 'Off Duty' || row.status === 'On Trip'}
          onClick={() => handleDeleteClick(row._id)}
        >
          Deactivate
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Drivers</h2>
          <p className="text-muted-foreground">Monitor driver listings, safety score performance, and current license status checkups.</p>
        </div>
        {isAuthorized && (
          <Button onClick={handleOpenAddSheet}>Register Driver</Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="Off Duty">Off Duty</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
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
          Failed to fetch driver logs from database.
        </div>
      ) : (
        <DataTable
          columns={columns as any}
          data={driversData?.data || []}
          isLoading={isLoading}
          pageSize={10}
          actions={actions as any}
        />
      )}

      {/* Sheet Form */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold">{editingDriver ? 'Edit Driver Details' : 'Register Driver Personnel'}</h3>
            <p className="text-sm text-muted-foreground">
              {editingDriver
                ? 'Update fields below to modify existing driver credentials.'
                : 'Fill in details below to register a new operator for dispatch assignment.'}
            </p>
          </div>
          <form className="space-y-4 py-4" onSubmit={form.handleSubmit(handleFormSubmit as any)}>
            <FormField control={form.control as any} name="name" label="Driver Name" placeholder="e.g. Alex Henderson" required />
            <FormField control={form.control as any} name="license_number" label="License Number" placeholder="e.g. DL-12345678" required />
            <FormField control={form.control as any} name="license_category" label="License Class / Category" placeholder="e.g. Heavy Commercial Truck" required />
            <FormField control={form.control as any} name="license_expiry_date" label="License Expiration Date" type="date" required />
            <FormField control={form.control as any} name="contact_number" label="Contact Mobile Number" placeholder="e.g. +15550100" required />
            <FormField control={form.control as any} name="safety_score" label="Safety Performance Score (0-100)" type="number" required />
            <FormField control={form.control as any} name="region" label="Assigned Hub / Region" placeholder="e.g. West" />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Save Driver
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
