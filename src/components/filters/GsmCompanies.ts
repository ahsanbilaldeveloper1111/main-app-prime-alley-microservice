import { useEffect, useState } from 'react';
import { getGsmData } from '@utils/GsmManagement';

export const useGsmCompanies = () => {
  const [dataGsm, setDataGsm] = useState<string[]>([]);
  const [dataCompany, setDataCompany] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchHierarchyData = async () => {
      try {
        setLoading(true);
        const hierarchyData = await getGsmData();
        //console.log(hierarchyData);
        if (hierarchyData) {
          setDataGsm(hierarchyData?.gsm);
          setDataCompany(hierarchyData?.company);
        }
      } catch (error) {
        console.error('Error fetching hierarchy data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchyData();
  }, []);

  return {
    dataGsm,
    dataCompany,
    loading,
    error
  };
}; 