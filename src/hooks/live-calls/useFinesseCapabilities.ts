import { useState, useEffect, useCallback } from 'react';
import { getFinesseUserCapabilities } from '@utils/finesse';

const CAMPAIGN_MGMT = 'CAMPAIGN_MGMT';

export interface UseFinesseCapabilitiesResult {
  capabilities: string[];
  loading: boolean;
  hasCampaignMgmt: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches Finesse user capabilities and checks for CAMPAIGN_MGMT (reference: CampaignMgmtGate).
 */
export function useFinesseCapabilities(username: string | null | undefined): UseFinesseCapabilitiesResult {
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = useCallback(async () => {
    if (!username?.trim()) {
      setCapabilities([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getFinesseUserCapabilities(username);
      const list =
        response?.responseData?.capabilities ??
        response?.capabilities ??
        (Array.isArray(response?.responseData) ? response.responseData : []);
      const arr = Array.isArray(list) ? list : [];
      setCapabilities(arr);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; responseData?: { message?: string } } } })?.response?.data
          ?.responseData?.message ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        'Failed to load capabilities';
      setError(message);
      setCapabilities([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  const hasCampaignMgmt = capabilities.includes(CAMPAIGN_MGMT);

  return {
    capabilities,
    loading,
    hasCampaignMgmt,
    error,
    refetch: fetchCapabilities,
  };
}
