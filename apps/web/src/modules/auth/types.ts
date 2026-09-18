export type UserRole =
  | 'mother'
  | 'doctor'
  | 'midwife'
  | 'nutritionist'
  | 'moderator'
  | 'admin';

export type Permission =
  | 'chat:read'
  | 'chat:write'
  | 'chat:moderate'
  | 'consult:respond'
  | 'plan:prescribe'
  | 'admin:all';

export interface AuthUser {
  id: string;
  /** Canonical `+989XXXXXXXXX`. */
  mobile: string;
  fullName?: string;
  role: UserRole;
  roleLabel: string;
  mobileVerified: boolean;
  permissions: Permission[];
}

export interface AuthSession {
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterInput {
  mobile: string;
  password: string;
  fullName?: string;
}

export interface LoginInput {
  mobile: string;
  password: string;
}

export type AuthMode = 'login' | 'register' | 'forgot';
