export type UserRole = 'mother' | 'doctor' | 'midwife' | 'nutritionist' | 'moderator' | 'admin';

/** Coarse capability flags derived from the role and embedded in the JWT. */
export type Permission =
  | 'chat:read'
  | 'chat:write'
  | 'chat:moderate'
  | 'consult:respond'
  | 'plan:prescribe'
  | 'admin:all';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  mother: ['chat:read', 'chat:write'],
  doctor: ['chat:read', 'chat:write', 'consult:respond', 'plan:prescribe'],
  midwife: ['chat:read', 'chat:write', 'consult:respond'],
  nutritionist: ['chat:read', 'chat:write', 'consult:respond', 'plan:prescribe'],
  moderator: ['chat:read', 'chat:write', 'chat:moderate'],
  admin: ['admin:all', 'chat:read', 'chat:write', 'chat:moderate', 'consult:respond', 'plan:prescribe'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  mother: 'مادر',
  doctor: 'پزشک',
  midwife: 'ماما',
  nutritionist: 'کارشناس تغذیه',
  moderator: 'ناظر',
  admin: 'مدیر',
};

export function permissionsFor(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.mother;
}

export function hasPermission(permissions: string[], needed: Permission): boolean {
  return permissions.includes('admin:all') || permissions.includes(needed);
}

/** The persisted account. `passwordHash` never leaves the server. */
export interface UserRecord {
  id: string;
  /** Canonical `+989XXXXXXXXX`. Unique. */
  mobile: string;
  passwordHash: string;
  fullName?: string;
  role: UserRole;
  mobileVerified: boolean;
  createdAt: string;
  updatedAt: string;
  /** Set while the account is locked out after repeated failures. */
  lockedUntil?: string;
  failedAttempts: number;
}

/** What the client is allowed to see. */
export interface PublicUser {
  id: string;
  mobile: string;
  fullName?: string;
  role: UserRole;
  roleLabel: string;
  mobileVerified: boolean;
  permissions: Permission[];
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    mobile: user.mobile,
    fullName: user.fullName,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role],
    mobileVerified: user.mobileVerified,
    permissions: permissionsFor(user.role),
  };
}

export interface RefreshSession {
  /** SHA-256 of the opaque token. */
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
  /** Set when rotated or revoked; a used token must never work twice. */
  revokedAt?: string;
  /** Points at the token this one was rotated into — for reuse detection. */
  replacedBy?: string;
}
