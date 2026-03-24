// Shared DTOs for FranchiseValue module

export interface CreateFranchiseValueDto {
  value: number;
  label?: string;
  description?: string;
  isStandard?: boolean;
}

export interface UpdateFranchiseValueDto {
  value?: number;
  label?: string;
  description?: string;
  isStandard?: boolean;
  isActive?: boolean;
}
