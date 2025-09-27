import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ListCallLogs } from '@utils/calls';
import { toast } from 'react-toastify';

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
}

interface ChartData {
  country: string[];
  answered_calls: number[];
  unanswered_calls: number[];
  total_calls: number[];
  max_ring_time: number[];
  avg_ring_time: number[];
  min_ring_time: number[];
  min_cost: number[];
  avg_cost: number[];
  max_cost: number[];
  min_duration: number[];
  avg_duration: number[];
  max_duration: number[];
}

export const useCallStatsFilters = () => {
  const [filtersReady, setFiltersReady] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    is_incoming_only: 'false'
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleFiltersChange = (filters: any) => {
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(filters);
    const isCompletelyCleared = Object.keys(filters).length === 0 || 
      (Object.keys(filters).length === 1 && filters.hasOwnProperty('is_incoming_only'));
    
    setCurrentFilters(filters);
    
    if (!filtersReady) {
      setFiltersReady(true);
    }
    
    if ((filtersChanged && filtersReady) || isCompletelyCleared) {
      setRefreshKey(prev => prev + 1);
    }
  };

  // Fallback: if filters haven't been marked as ready after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!filtersReady) {
        setFiltersReady(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [filtersReady]);

  return {
    filtersReady,
    currentFilters,
    refreshKey,
    handleFiltersChange
  };
};

export const useCallStatsData = ({ currentFilters, filtersReady }: { currentFilters: any; filtersReady: boolean }) => {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    total_calls: 0,
    answered_calls: 0,
    unanswered_calls: 0,
    total_cost: 0,
    total_duration: 0,
    avg_duration: 0,
    avg_ring_time: 0
  });

  const fetchCallLogs = useCallback(async (page = 1, perPage = 15, search = "") => {
    if (!filtersReady) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await ListCallLogs({ 
        page, 
        perPage, 
        search, 
        filters: currentFilters, 
        reportType: 'statsDepartment' 
      }, 'call-logs/statsByDepartment');
      
      if (response?.summary) {
        setSummary(response.summary);
        setDataLoaded(true);
      } else {
        setDataLoaded(true);
      }
      
      setLoading(false);
      return response;
    } catch (error: unknown) {
      console.error('Error fetching call logs:', error);
      setLoading(false);
      setDataLoaded(true);
      toast.error('Failed to fetch call data');
      return null;
    }
  }, [currentFilters, filtersReady]);

  useEffect(() => {
    if (filtersReady && status === 'authenticated' && session) {
      fetchCallLogs(1, 15, "");
    }
  }, [filtersReady, fetchCallLogs, status, session]);

  return {
    loading,
    dataLoaded,
    summary,
    fetchCallLogs,
    setDataLoaded,
    setSummary
  };
};

export const useCallStatsCharts = ({ currentFilters, filtersReady }: { currentFilters: any; filtersReady: boolean }) => {
  const { data: session, status } = useSession();
  const [chartCalls, setChartCalls] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartRingTime, setChartRingTime] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartCost, setChartCost] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartDuration, setChartDuration] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    const areFiltersReady = filtersReady && currentFilters && Object.keys(currentFilters).length > 0 && status === 'authenticated' && session;
    
    if (areFiltersReady) {
      const fetchCharts = async () => {
        setChartLoading(true);
        try {
          const response = await ListCallLogs({ 
            page: 1, 
            perPage: 15, 
            search: "", 
            filters: currentFilters, 
            reportType: 'chartDepartment' 
          }, 'call-logs/stats/department/chart');
          
          const chartData = response?.chart_data;
          
          if(chartData && Array.isArray(chartData) && chartData.length > 0) {
            const newChartData: ChartData = {
              country: [],
              answered_calls: [],
              unanswered_calls: [],
              total_calls: [],
              max_ring_time: [],
              avg_ring_time: [],
              min_ring_time: [],
              min_cost: [],
              avg_cost: [],
              max_cost: [],
              min_duration: [],
              avg_duration: [],
              max_duration: [],
            };
            
            chartData.forEach((item: any) => {
              if (item && item.label) {
                newChartData.country.push(item.label);
                newChartData.answered_calls.push(Number(item.answered_calls) || 0);
                newChartData.unanswered_calls.push(Number(item.unanswered_calls) || 0);
                newChartData.total_calls.push(Number(item.total_calls) || 0);
                newChartData.max_ring_time.push(Number(item.max_ring_time) || 0);
                newChartData.avg_ring_time.push(Number(item.avg_ring_time) || 0);
                newChartData.min_ring_time.push(Number(item.min_ring_time) || 0);
                newChartData.min_cost.push(Number(item.min_cost) || 0);
                newChartData.avg_cost.push(Number(item.avg_cost) || 0);
                newChartData.max_cost.push(Number(item.max_cost) || 0);
                newChartData.min_duration.push(Number(item.min_duration) || 0);
                newChartData.avg_duration.push(Number(item.avg_duration) || 0);
                newChartData.max_duration.push(Number(item.max_duration) || 0);
              }
            });
            
            const dataLength = newChartData.country.length;
            
            if (dataLength > 0) {
              setChartCalls({
                series: [
                  { name: 'Total', data: newChartData.total_calls },
                  { name: 'Answered', data: newChartData.answered_calls },
                  { name: 'Unanswered', data: newChartData.unanswered_calls }
                ],
                categories: newChartData.country
              });

              setChartRingTime({
                series: [
                  { name: 'Max Ring Time', data: newChartData.max_ring_time },
                  { name: 'Avg Ring Time', data: newChartData.avg_ring_time },
                  { name: 'Min Ring Time', data: newChartData.min_ring_time }
                ],
                categories: newChartData.country
              });

              setChartCost({
                series: [
                  { name: 'Max Cost', data: newChartData.max_cost },
                  { name: 'Avg Cost', data: newChartData.avg_cost },
                  { name: 'Min Cost', data: newChartData.min_cost }
                ],
                categories: newChartData.country
              });

              setChartDuration({
                series: [
                  { name: 'Max Duration', data: newChartData.max_duration },
                  { name: 'Avg Duration', data: newChartData.avg_duration },
                  { name: 'Min Duration', data: newChartData.min_duration }
                ],
                categories: newChartData.country
              });
            }
          }
        } catch (error) {
          console.error('Error fetching chart data:', error);
          setChartCalls(null);
          setChartRingTime(null);
          setChartCost(null);
          setChartDuration(null);
        } finally {
          setChartLoading(false);
        }
      };

      fetchCharts();
    } else {
      setChartCalls(null);
      setChartRingTime(null);
      setChartCost(null);
      setChartDuration(null);
      setChartLoading(false);
    }
  }, [currentFilters, filtersReady, status, session]);

  return {
    chartCalls,
    chartRingTime,
    chartCost,
    chartDuration,
    chartLoading
  };
};
