export type RequestContext = {
  requestId: string;
  schoolId: string | null;
};

export type AuthenticatedActor = {
  id?: string;
  userId?: string;
  sub?: string;
  schoolId?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
  roles?: string[];
  permissions?: string[];
};
