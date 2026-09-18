import { config } from '@/lib/config';
import { authHeader } from '@/modules/auth/lib/tokenBridge';

import type { DoctorPatient, RiskFlag } from '../types';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = await authHeader();
  const res = await fetch(`${config.apiUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...auth, ...(init.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'خطا در ارتباط با سرور');
  }
  return res.json() as Promise<T>;
}

export function fetchPatients(): Promise<{ patients: DoctorPatient[] }> {
  return request('/api/doctor/patients');
}

export function setPatientFlag(
  patientId: string,
  flag: RiskFlag,
  note?: string,
): Promise<void> {
  return request(`/api/doctor/patients/${patientId}/flag`, {
    method: 'PATCH',
    body: JSON.stringify({ flag, note }),
  });
}

export function reportJourney(journeyMode: string, journeyWeek?: number): Promise<void> {
  return request('/api/profile/journey', {
    method: 'PATCH',
    body: JSON.stringify({ journeyMode, journeyWeek }),
  });
}

export function startConsult(doctorId: string): Promise<{ id: string }> {
  return request('/api/consult/start', {
    method: 'POST',
    body: JSON.stringify({ doctorId }),
  });
}
