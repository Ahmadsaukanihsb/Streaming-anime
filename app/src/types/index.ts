// Shared types across the application

export interface SidebarWidget {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface HomeSection {
  id: 'trending' | 'continue' | 'foryou' | 'ongoing' | 'latest' | 'explore' | 'completed';
  name: string;
  enabled: boolean;
  order: number;
}

// Common API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
