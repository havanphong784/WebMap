export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}
