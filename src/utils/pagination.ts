export interface PaginatedData<T> {
      data: T[];
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
  }
  
  
  export interface PaginationParams {
      page?: number;
      limit?: number;
      search?: string;
      order?: {
          column: string;
          dir: 'asc' | 'desc';
      };
  }
  
  export const defaultPaginationParams: PaginationParams = {
      page: 1,
      limit: 10,
      order: {
          column: 'created_at',
          dir: 'desc'
      }
  }; 