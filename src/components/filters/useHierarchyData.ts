import { useEffect, useState } from 'react';
import { GetHierarchyData } from '@utils/users';

export const useHierarchyData = (moduleSlug?: string) => {
  const [hierarchyDataUsers, setHierarchyDataUsers] = useState<string[]>([]);
  const [hierarchyDataDepartments, setHierarchyDataDepartments] = useState<string[]>([]);
  const [hierarchyDataCompanies, setHierarchyDataCompanies] = useState<string[]>([]);
  const [hierarchyDataExtensions, setHierarchyDataExtensions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchHierarchyData = async () => {
      try {
        setLoading(true);
        console.log('useHierarchyData - moduleSlug:', moduleSlug);
        const hierarchyData = await GetHierarchyData(moduleSlug);
        //console.log(hierarchyData);
        if (hierarchyData) {
          setHierarchyDataUsers(hierarchyData?.users);
          setHierarchyDataDepartments(hierarchyData?.departments);
          setHierarchyDataCompanies(hierarchyData?.companies);
          setHierarchyDataExtensions(hierarchyData?.extensions);
        }
      } catch (error) {
        console.error('Error fetching hierarchy data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchyData();
  }, [moduleSlug]);

  return {
    hierarchyDataUsers,
    hierarchyDataDepartments,
    hierarchyDataCompanies,
    hierarchyDataExtensions,
    loading,
    error
  };
}; 