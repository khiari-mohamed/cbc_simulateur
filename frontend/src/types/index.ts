export const Role = {
  CLIENT_ADHERENT: 'CLIENT_ADHERENT',
  ADMINISTRATEUR_ARS: 'ADMINISTRATEUR_ARS',
  GESTIONNAIRE_VALIDATION_ARS: 'GESTIONNAIRE_VALIDATION_ARS',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const QuoteStatus = {
  GENERATED: 'GENERATED',
  SUBMITTED: 'SUBMITTED',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
  TRANSFORMED_TO_CONTRACT: 'TRANSFORMED_TO_CONTRACT',
} as const;

export type QuoteStatus = typeof QuoteStatus[keyof typeof QuoteStatus];

export const SimulationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type SimulationStatus = typeof SimulationStatus[keyof typeof SimulationStatus];

export const FormulaType = {
  STANDARD: 'STANDARD',
  DOMMAGES_COLLISIONS: 'DOMMAGES_COLLISIONS',
  TOUS_RISQUES_0: 'TOUS_RISQUES_0',
} as const;

export type FormulaType = typeof FormulaType[keyof typeof FormulaType];

export const UsageType = {
  PRIVATE_BUSINESS: 'PRIVATE_BUSINESS',
  COMMERCIAL: 'COMMERCIAL',
  TAXI: 'TAXI',
  RENTAL: 'RENTAL',
} as const;

export type UsageType = typeof UsageType[keyof typeof UsageType];

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type Vehicle = {
  id: string;
  registration?: string;
  fiscalHorsepower: number;
  numberOfSeats: number;
  newValue: number;
  marketValue: number;
  firstCirculationDate: string;
};

export type Simulation = {
  id: string;
  userId: string;
  vehicleId: string;
  vehicle: Vehicle;
  bonusMalus: number;
  usage: UsageType;
  formulaType: FormulaType;
  status: SimulationStatus;
  createdAt: string;
  updatedAt: string;
};

export type Quote = {
  id: string;
  quoteNumber: string;
  displayNumber?: number;
  simulationId: string;
  userId: string;
  companyId: string;
  company: Company;
  status: QuoteStatus;
  primeNette: number;
  frais: number;
  taxes: number;
  fpac: number;
  fssr: number;
  fg: number;
  totalAPayer: number;
  items?: QuoteItem[];
  pdfPath?: string;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  contractFees?: number;
  fpac?: number;
  fssr?: number;
  fg?: number;
  conventions?: { id: string; name: string }[];
  _count?: { quotes: number; pricingRules: number };
  createdAt?: string;
  updatedAt?: string;
};

export type Convention = {
  id: string;
  name: string;
  companyId: string;
  company: { id: string; name: string; code: string; isActive: boolean };
  reductionTousRisques?: number;
  reductionDommagesCollision?: number;
  reductionVol?: number;
  reductionIncendie?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  isActive: boolean;
  guarantees?: { guarantee: Guarantee }[];
  _count?: { users: number; simulations: number; pricingRules: number; guarantees: number };
  createdAt?: string;
  updatedAt?: string;
};

export type Guarantee = {
  id: string;
  code: string;
  nameFr: string;
  nameAr?: string;
  nameEn?: string;
  isOptional: boolean;
  isActive: boolean;
  _count?: { pricingRules: number; simulationGuarantees: number; quoteItems: number };
};

export type SimulationGuarantee = {
  id: string;
  simulationId: string;
  guaranteeId: string;
  guarantee: Guarantee;
  isSelected: boolean;
  customValue?: number;
};

export type QuoteItem = {
  id: string;
  quoteId: string;
  guaranteeId: string;
  guarantee: Guarantee;
  capital: number;
  prime: number;
};

export const ContractStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type ContractStatus = typeof ContractStatus[keyof typeof ContractStatus];

export type Contract = {
  id: string;
  contractNumber: string;
  quoteId: string;
  quote: Quote;
  userId: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  pdfPath?: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  contractId: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  reference?: string;
  paidAt?: string;
  createdAt: string;
};

export type Document = {
  id: string;
  quoteId: string;
  type: string;
  fileName: string;
  filePath: string;
  isValidated: boolean;
  uploadedAt: string;
};

export type PricingRule = {
  id: string;
  companyId: string;
  guaranteeId: string;
  conventionId?: string;
  formulaType?: FormulaType;
  minPower?: number;
  maxPower?: number;
  minAge?: number;
  maxAge?: number;
  baseRate?: number;
  fixedPremium?: number;
  multiplier?: number;
  reductionRate?: number;
  usageType?: UsageType;
  isActive: boolean;
};
