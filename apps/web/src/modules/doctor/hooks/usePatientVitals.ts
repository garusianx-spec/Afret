'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchPatientVitals } from '../api/doctorApi';

/** `enabled: false` until the drawer actually opens — never fetched speculatively. */
export function usePatientVitals(patientId: string, open: boolean) {
  const query = useQuery({
    queryKey: ['doctor', 'patient-vitals', patientId],
    queryFn: () => fetchPatientVitals(patientId),
    enabled: open,
  });

  return { vitals: query.data, isLoading: query.isLoading, error: query.error };
}
