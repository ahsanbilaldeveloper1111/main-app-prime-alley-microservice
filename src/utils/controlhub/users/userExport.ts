import { toast } from 'react-toastify';
import { getAllUsers } from '@utils/users';

export const handleUserExport = async (exportType: string, filters: Record<string, any>) => {
    try {
        await getAllUsers({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
    } catch (error) {
        toast.error('Export failed. Please try again.');
    }
};

