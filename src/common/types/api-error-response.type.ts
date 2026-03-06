export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: {
    timestamp: string;
    path: string;
    requestId: string;
  };
};
