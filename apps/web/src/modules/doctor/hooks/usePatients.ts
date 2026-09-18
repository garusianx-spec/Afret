'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchPatients, setPatientFlag } from '../api/doctorApi';
import type { RiskFlag } from '../types';

export function usePatients() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['doctor', 'patients'],
    queryFn: fetchPatients,
    // A patient can message any time; a doctor's list should not go stale
    // for long while she has the tab open.
    refetchInterval: 30_000,
  });

  const updateFlag = async (patientId: string, flag: RiskFlag, note?: string) => {
    await setPatientFlag(patientId, flag, note);
    await queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] });
  };

  return {
    patients: query.data?.patients ?? [],
    isLoading: query.isLoading,
    error: query.error,
    updateFlag,
  };
}
