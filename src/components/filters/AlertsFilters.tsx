import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createAlertsFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";
import { getDevices, Device } from '@utils/netops';

interface AlertsFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
  moduleSlug?: string;
}

export default function AlertsFilters({ onFiltersChange, onExport, moduleSlug }: AlertsFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch devices for the device filter
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const devicesData = await getDevices();
        setDevices(devicesData || []);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchDevices();
    }
  }, [status]);

  // Create dynamic filter config with devices data
  const alertsConfig = createAlertsFiltersConfig(devices);
  
  useEffect(() => {
    // if (status === 'authenticated') {
    //   // Only show export if onExport prop is provided and user has permission
    //   if (onExport && session?.user?.permissions?.includes('export-alerts')) {
    //     setShowExport(true);
    //   }
    //   if (session?.user?.permissions?.includes('filters-alerts')) {
    //   }
    // }
    setShowFilters(true);
  }, [status, session, onExport]);

  // Show loading state while devices are being fetched
  if (loading) {
    return <div></div>;
  }

  return (
    <GenericFilter
      tabs={alertsConfig}
      onFiltersChange={onFiltersChange}
      showFilters
      onExport={onExport}
      showExport={showExport}
      exportOptions={[
        { label: 'Excel', value: 'excel' },
        //{ label: 'PDF', value: 'pdf' }
      ]}
    />
  );
}
