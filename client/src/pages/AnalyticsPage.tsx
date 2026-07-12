import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, AlertTriangle, Download, Printer } from 'lucide-react';
import { getVehicles } from '@/api/vehicles.api';
import { getFleetUtilization, getFuelEfficiency, getOperationalCost, getVehicleROI } from '@/api/analytics.api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function AnalyticsPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Dropdown list query
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-analytics-list'],
    queryFn: () => getVehicles({ limit: 100 }),
  });

  // Analytics queries
  const {
    data: utilization,
    isLoading: isUtilLoading,
    isError: isUtilError,
    refetch: refetchUtil,
  } = useQuery({
    queryKey: ['analytics-utilization'],
    queryFn: getFleetUtilization,
  });

  const {
    data: fuelEfficiency,
    isLoading: isFuelLoading,
    isError: isFuelError,
    refetch: refetchFuel,
  } = useQuery({
    queryKey: ['analytics-efficiency', selectedVehicleId],
    queryFn: () => getFuelEfficiency({ vehicleId: selectedVehicleId || undefined }),
  });

  const {
    data: opCost,
    isLoading: isCostLoading,
    isError: isCostError,
    refetch: refetchCost,
  } = useQuery({
    queryKey: ['analytics-cost', selectedVehicleId],
    queryFn: () => getOperationalCost({ vehicleId: selectedVehicleId || undefined }),
  });

  const {
    data: roi,
    isLoading: isRoiLoading,
    isError: isRoiError,
    refetch: refetchRoi,
  } = useQuery({
    queryKey: ['analytics-roi', selectedVehicleId],
    queryFn: () => getVehicleROI({ vehicleId: selectedVehicleId }),
    enabled: !!selectedVehicleId,
  });

  const handleRetryAll = () => {
    refetchUtil();
    refetchFuel();
    refetchCost();
    if (selectedVehicleId) refetchRoi();
  };

  const vehicles = vehiclesData?.data?.vehicles || [];

  const costBreakdownData = opCost?.data
    ? [
        { name: 'Fuel', value: opCost.data.fuelCost },
        { name: 'Maintenance', value: opCost.data.maintenanceCost },
        { name: 'Other', value: opCost.data.otherCost },
      ]
    : [];

  const showLoading = !!(isUtilLoading || isFuelLoading || isCostLoading || (selectedVehicleId && isRoiLoading));
  const showError = !!(isUtilError || isFuelError || isCostError || (selectedVehicleId && isRoiError));

  const handleExportCSV = () => {
    if (!vehicles.length) return;

    const headers = [
      'Registration Number',
      'Name',
      'Model',
      'Type',
      'Region',
      'Status',
      'Capacity (kg)',
      'Odometer (km)',
      'Acquisition Cost ($)',
      'Fuel Cost ($)',
      'Maintenance Cost ($)',
      'Total Operational Cost ($)'
    ];

    const rows = vehicles.map(v => [
      v.registrationNumber,
      v.name,
      v.model,
      v.type,
      v.region,
      v.status,
      v.maximumLoadCapacity,
      v.odometer,
      v.acquisitionCost,
      v.totalFuelCost || 0,
      v.totalMaintenanceCost || 0,
      v.totalOperationalCost || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transitops_fleet_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Performance & ROI Metrics</h2>
          <p className="text-muted-foreground">Aggregated cost metrics, utilization, and vehicle efficiency calculations.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Vehicles (ROI disabled)</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.registrationNumber} - {v.name}
              </option>
            ))}
          </select>
          <Button variant="outline" className="font-bold gap-1 text-xs h-9" onClick={handleExportCSV} disabled={!vehicles.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="font-bold gap-1 text-xs h-9" onClick={handlePrintPDF}>
            <Printer className="h-4 w-4" />
            PDF/Print
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRetryAll} disabled={showLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showLoading && (
        <Card>
          <CardContent className="flex h-64 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Recomputing performance metrics from database...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {showError && !showLoading && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center text-destructive">
            <AlertTriangle className="h-10 w-10" />
            <div>
              <p className="font-semibold">Failed to load system analytics</p>
              <p className="text-sm opacity-90">An error occurred while compiling the aggregation pipelines.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetryAll}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!showLoading && !showError && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {utilization?.data ? `${utilization.data.utilizationRate.toFixed(1)}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">
                {utilization?.data ? `${utilization.data.onTrip} of ${utilization.data.totalActive} active vehicles` : '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fuelEfficiency?.data ? `${fuelEfficiency.data.efficiency.toFixed(2)} km/L` : '0 km/L'}
              </div>
              <p className="text-xs text-muted-foreground">
                {fuelEfficiency?.data ? `${fuelEfficiency.data.totalDistance} km traveled / ${fuelEfficiency.data.totalFuel} L` : '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Operational Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {opCost?.data ? `$${opCost.data.totalOperationalCost.toLocaleString()}` : '$0'}
              </div>
              <p className="text-xs text-muted-foreground">Combined fuel, shop maintenance and non-duplicate outlays</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicle ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roi?.data ? `${(roi.data.roi * 100).toFixed(2)}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedVehicleId && roi?.data
                  ? `$${roi.data.revenue.toLocaleString()} revenue / $${roi.data.costs.toLocaleString()} cost`
                  : 'Select target vehicle to compute ROI'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!showLoading && !showError && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cost breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Cost Allocation</CardTitle>
              <CardDescription>Visual breakdown of cost events excluding duplicate entries</CardDescription>
            </CardHeader>
            <CardContent className="flex h-80 items-center justify-center">
              {costBreakdownData.every(c => c.value === 0) ? (
                <p className="text-sm text-muted-foreground">No cost logs registered for this query selection</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${Number(value || 0).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Performance Comparison / Efficiencies */}
          <Card>
            <CardHeader>
              <CardTitle>Distance vs Fuel Consumed</CardTitle>
              <CardDescription>Aggregation of distance traveled and fuel consumed</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {!fuelEfficiency?.data || fuelEfficiency.data.totalDistance === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No trip logs registered for this query selection</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Distance (KM)', value: fuelEfficiency.data.totalDistance },
                      { name: 'Fuel Consumed (L)', value: fuelEfficiency.data.totalFuel },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
export default AnalyticsPage;
