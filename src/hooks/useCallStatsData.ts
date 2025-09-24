import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ListCallLogs } from '@utils/calls';

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
}

interface UseCallStatsDataProps {
  currentFilters: Record<string, any>;
  filtersReady: boolean;
}

export const useCallStatsData = ({ currentFilters, filtersReady }: UseCallStatsDataProps) => {
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
      const response = await ListCallLogs(
        { page, perPage, search, filters: currentFilters, reportType: 'statsCountry' }, 
        'call-logs/statsByCountry'
      );
      
      if (response?.summary) {
        setSummary(response.summary);
        setDataLoaded(true);
      } else if (response?.data) {
        setDataLoaded(true);
      } else {
        setDataLoaded(true);
      }
      
      setLoading(false);
      return response;
    } catch (error) {
      console.error('Error fetching call logs:', error);
      setLoading(false);
      setDataLoaded(true);
      return null;
    }
  }, [currentFilters, filtersReady]);

  // Trigger initial data fetch when filters become ready
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
