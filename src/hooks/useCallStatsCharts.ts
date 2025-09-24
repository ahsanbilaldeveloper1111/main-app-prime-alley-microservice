import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ListCallLogs } from '@utils/calls';

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

interface UseCallStatsChartsProps {
  currentFilters: Record<string, any>;
  filtersReady: boolean;
}

export const useCallStatsCharts = ({ currentFilters, filtersReady }: UseCallStatsChartsProps) => {
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
          const response = await ListCallLogs(
            { page: 1, perPage: 15, search: "", filters: currentFilters, reportType: 'chartCountry' }, 
            'call-logs/stats/country/chart'
          );
          
          const chartData = response?.chart_data;
          
          if (chartData && Array.isArray(chartData) && chartData.length > 0) {
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
            
            if (dataLength > 0 && 
                newChartData.answered_calls.length === dataLength &&
                newChartData.unanswered_calls.length === dataLength &&
                newChartData.total_calls.length === dataLength) {
              
              // Calls Chart
              setChartCalls({
                series: [
                  { name: 'Total', data: newChartData.total_calls },
                  { name: 'Answered', data: newChartData.answered_calls },
                  { name: 'Unanswered', data: newChartData.unanswered_calls }
                ],
                categories: newChartData.country
              });

              // Ring Time Chart
              setChartRingTime({
                series: [
                  { name: 'Max Ring Time', data: newChartData.max_ring_time },
                  { name: 'Avg Ring Time', data: newChartData.avg_ring_time },
                  { name: 'Min Ring Time', data: newChartData.min_ring_time }
                ],
                categories: newChartData.country
              });

              // Cost Chart
              setChartCost({
                series: [
                  { name: 'Max Cost', data: newChartData.max_cost },
                  { name: 'Avg Cost', data: newChartData.avg_cost },
                  { name: 'Min Cost', data: newChartData.min_cost }
                ],
                categories: newChartData.country
              });

              // Duration Chart
              setChartDuration({
                series: [
                  { name: 'Max Duration', data: newChartData.max_duration },
                  { name: 'Avg Duration', data: newChartData.avg_duration },
                  { name: 'Min Duration', data: newChartData.min_duration }
                ],
                categories: newChartData.country
              });
            } else {
              setChartCalls(null);
              setChartRingTime(null);
              setChartCost(null);
              setChartDuration(null);
            }
          } else {
            setChartCalls(null);
            setChartRingTime(null);
            setChartCost(null);
            setChartDuration(null);
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
