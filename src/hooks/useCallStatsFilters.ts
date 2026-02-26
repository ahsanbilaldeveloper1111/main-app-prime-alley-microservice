import { useState, useEffect, useCallback } from 'react';

export const useCallStatsFilters = () => {
  const [filtersReady, setFiltersReady] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    is_incoming_only: 'false'
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleFiltersChange = useCallback((filters: any) => {
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(filters);
    const isCompletelyCleared = Object.keys(filters).length === 0 || 
        (Object.keys(filters).length === 1 && filters.hasOwnProperty('is_incoming_only'));
    
    setCurrentFilters(filters);
    
    // Mark filters as ready when they are first set
    if (!filtersReady) {
      setFiltersReady(true);
    }
    
    // Reset data loaded state when filters actually change or when cleared
    if ((filtersChanged && filtersReady) || isCompletelyCleared) {
      setRefreshKey(prev => prev + 1);
    }
  }, [currentFilters, filtersReady]);

  // Fallback: if filters haven't been marked as ready after 1 second, mark them as ready
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
    handleFiltersChange,
    setFiltersReady
  };
};
