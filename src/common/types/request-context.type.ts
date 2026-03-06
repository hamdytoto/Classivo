export type RequestContext = {
  requestId: string;
  schoolId: string | null;
};

export type AuthenticatedActor = {
  id?: string;
  userId?: string;
  sub?: string;
  schoolId?: string;
};
