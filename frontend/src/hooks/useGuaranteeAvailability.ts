import { useQuery } from '@tanstack/react-query';
import api from '../lib/api/client';
import { FormulaType } from '../types';

interface AvailabilityResult {
  isAvailable: boolean;
  isFree: boolean;
}

export const useGuaranteeAvailability = (
  companyId: string | undefined,
  guaranteeCodes: string[],
  formulaType: FormulaType | undefined,
  franchiseRate?: number,
) => {
  return useQuery<Record<string, AvailabilityResult>>({
    queryKey: ['guarantee-availability-bulk', companyId, guaranteeCodes, formulaType, franchiseRate],
    queryFn: async () => {
      if (!companyId || !formulaType || guaranteeCodes.length === 0) {
        // Return default: all available, not free
        return guaranteeCodes.reduce((acc, code) => {
          acc[code] = { isAvailable: true, isFree: false };
          return acc;
        }, {} as Record<string, AvailabilityResult>);
      }

      const { data } = await api.post('/guarantee-availability/resolve-bulk', {
        companyId,
        guaranteeCodes,
        formulaType,
        franchiseRate,
      });
      return data;
    },
    enabled: guaranteeCodes.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
