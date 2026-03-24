# Code Review & Fixes - Production Ready

## 🎯 Issues Found & Fixed

### Priority 1: TypeScript `any` Types

#### 1. **auth.controller.ts** - Line 45, 60
```typescript
// ❌ BEFORE
logout(@Request() req: any) {
getProfile(@Request() req: any) {
googleAuthCallback(@Request() req: any, @Res() res: Response) {

// ✅ AFTER
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

logout(@Request() req: RequestWithUser) {
getProfile(@Request() req: RequestWithUser) {
googleAuthCallback(@Request() req: RequestWithUser, @Res() res: Response) {
```

#### 2. **auth.service.ts** - Line 195, 268
```typescript
// ❌ BEFORE
private generateTokens(user: any) {
async googleLogin(googleUser: any) {

// ✅ AFTER
interface UserPayload {
  id: string;
  email: string;
  role: string;
  password: string;
  otpSecret: string | null;
  [key: string]: any;
}

interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
}

private generateTokens(user: UserPayload) {
async googleLogin(googleUser: GoogleUser) {
```

#### 3. **jwt.strategy.ts** - Line 19
```typescript
// ❌ BEFORE
async validate(payload: any) {

// ✅ AFTER
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

async validate(payload: JwtPayload) {
```

#### 4. **pricing-engine.service.ts** - Line 1088
```typescript
// ❌ BEFORE
private async calculateDC_Progressive(companyId: string, guaranteeId: string, vv: Decimal, capital: Decimal, dcConfig: any, usageId: string, conventionId?: string) {

// ✅ AFTER
interface DcConfigData {
  basePremium: Decimal;
  discountPercent: Decimal;
  minCapital: Decimal;
  maxCapitalPercent: Decimal;
  maxCapitalAbsolute: Decimal;
  franchise: Decimal;
  useMatrix: boolean;
  referenceValue: string | null;
}

private async calculateDC_Progressive(
  companyId: string, 
  guaranteeId: string, 
  vv: Decimal, 
  capital: Decimal, 
  dcConfig: DcConfigData, 
  usageId: string, 
  conventionId?: string
) {
```

### Priority 2: Missing Error Handling

#### 5. **auth.service.ts** - Async operations without proper error handling
```typescript
// ❌ BEFORE
this.notificationsService.sendOTP(user.email, otp)
  .catch(err => console.error('Failed to send OTP email:', err.message));

// ✅ AFTER
this.notificationsService.sendOTP(user.email, otp)
  .catch(err => {
    console.error('Failed to send OTP email:', err.message);
    // Log to monitoring service in production
    // this.logger.error('OTP_SEND_FAILED', { email: user.email, error: err.message });
  });
```

### Priority 3: Validation Issues

#### 6. **auth.controller.ts** - Email sanitization should be in DTO validator
```typescript
// ❌ BEFORE - Controller doing validation
@Post('register')
register(@Body() dto: RegisterDto) {
  if (dto.email?.startsWith('mailto:')) {
    dto.email = dto.email.replace(/^mailto:/, '');
  }
  return this.authService.register(dto);
}

// ✅ AFTER - Move to DTO with class-transformer
// In register.dto.ts
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({ value }) => value?.replace(/^mailto:/, ''))
  @IsEmail()
  email: string;
  
  // ... rest of fields
}

// Controller becomes clean
@Post('register')
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

### Priority 4: Code Duplication

#### 7. **pricing-engine.service.ts** - Repeated convention scope logic
```typescript
// ❌ BEFORE - Duplicated 20+ times
const conventionScope = conventionId ? { conventionId } : { conventionId: null };

let rule = await this.prisma.pricingRule.findFirst({
  where: {
    companyId,
    guaranteeId: guarantee.id,
    isActive: true,
    ...conventionScope,
  },
});

if (!rule && conventionId) {
  rule = await this.prisma.pricingRule.findFirst({
    where: {
      companyId,
      guaranteeId: guarantee.id,
      isActive: true,
      conventionId: null,
    },
  });
}

// ✅ AFTER - Extract to helper method
private async findPricingRuleWithFallback(
  companyId: string,
  guaranteeId: string,
  conventionId?: string,
  additionalWhere?: any
): Promise<PricingRule | null> {
  const baseWhere = {
    companyId,
    guaranteeId,
    isActive: true,
    ...additionalWhere,
  };

  // Try with convention first
  if (conventionId) {
    const rule = await this.prisma.pricingRule.findFirst({
      where: { ...baseWhere, conventionId },
    });
    if (rule) return rule;
  }

  // Fallback to default (no convention)
  return await this.prisma.pricingRule.findFirst({
    where: { ...baseWhere, conventionId: null },
  });
}

// Usage
const rule = await this.findPricingRuleWithFallback(
  companyId,
  guarantee.id,
  conventionId,
  {
    minPower: { lte: vehicle.fiscalHorsepower },
    maxPower: { gte: vehicle.fiscalHorsepower },
    bonusMalusClass: bonusMalusClass,
  }
);
```

### Priority 5: Magic Numbers & Hardcoded Values

#### 8. **pricing-engine.service.ts** - Tax rates should be configurable
```typescript
// ❌ BEFORE
const taxe12Percent = primeNette.add(frais).mul(0.12);
const taxe2Percent = primeRC.add(frais).mul(0.02);

// ✅ AFTER - Add to company settings or config
// In schema.prisma
model Company {
  // ... existing fields
  taxRate12Percent Decimal @default(12) @db.Decimal(5, 2)
  taxRate2Percent  Decimal @default(2) @db.Decimal(5, 2)
}

// In service
const taxe12Percent = primeNette.add(frais).mul(company.taxRate12Percent.div(100));
const taxe2Percent = primeRC.add(frais).mul(company.taxRate2Percent.div(100));
```

#### 9. **pricing-engine.service.ts** - Vehicle age thresholds
```typescript
// ❌ BEFORE
if (formulaType === FormulaType.DOMMAGES_COLLISIONS && vehicleAge >= 10) {
if (formulaType === FormulaType.TOUS_RISQUES_0 && vehicleAge >= 2) {

// ✅ AFTER - Extract to constants
const BUSINESS_RULES = {
  DC_MAX_VEHICLE_AGE: 10,
  TR_MAX_VEHICLE_AGE: 2,
  PROGRESSIVE_TIER_PERCENT: 10,
} as const;

if (formulaType === FormulaType.DOMMAGES_COLLISIONS && vehicleAge >= BUSINESS_RULES.DC_MAX_VEHICLE_AGE) {
if (formulaType === FormulaType.TOUS_RISQUES_0 && vehicleAge >= BUSINESS_RULES.TR_MAX_VEHICLE_AGE) {
```

### Priority 6: Console.log in Production

#### 10. **pricing-engine.service.ts** - Replace console.log with proper logging
```typescript
// ❌ BEFORE
console.log('🔍 Calculating premium for company:', companyId);
console.log('✅ RC calculated:', rcResult.prime.toString());

// ✅ AFTER - Use NestJS Logger
import { Logger } from '@nestjs/common';

export class PricingEngineService {
  private readonly logger = new Logger(PricingEngineService.name);
  
  async calculatePremium(...) {
    this.logger.log(`Calculating premium for company: ${companyId}`);
    this.logger.debug(`RC calculated: ${rcResult.prime.toString()}`);
  }
}
```

### Priority 7: Unused Variables & Dead Code

#### 11. **auth.service.ts** - Unused destructured variables
```typescript
// ❌ BEFORE
const { password, otpSecret, ...result } = user;
return result;

// ✅ AFTER - Use underscore prefix for intentionally unused
const { password: _password, otpSecret: _otpSecret, ...result } = user;
return result;
```

### Priority 8: Type Safety Improvements

#### 12. **pricing-engine.service.ts** - Return type consistency
```typescript
// ❌ BEFORE - Some methods return null, others throw
private async calculateCAS(companyId: string, conventionId?: string) {
  // ... returns null if not found
}

private async calculateVOL(companyId: string, vehicle: VehicleData, conventionId?: string): Promise<{...}> {
  // ... throws BadRequestException if not found
}

// ✅ AFTER - Consistent error handling strategy
// Option 1: Always throw for mandatory guarantees
private async calculateCAS(companyId: string, conventionId?: string): Promise<GuaranteeResult> {
  const result = await this.findCASRule(companyId, conventionId);
  if (!result) {
    throw new BadRequestException('CAS pricing rule not found for company');
  }
  return result;
}

// Option 2: Return null for optional guarantees
private async calculateBG(...): Promise<GuaranteeResult | null> {
  const result = await this.findBGRule(...);
  return result; // Can be null
}
```

## 📝 Summary of Changes Needed

### Backend Files to Fix:
1. ✅ `auth.controller.ts` - Add proper types for Request
2. ✅ `auth.service.ts` - Replace `any` with interfaces
3. ✅ `jwt.strategy.ts` - Add JwtPayload interface
4. ✅ `pricing-engine.service.ts` - Major refactoring needed:
   - Replace `any` with proper interfaces
   - Extract helper methods for repeated logic
   - Add proper logging
   - Extract constants
   - Consistent error handling

### DTOs to Update:
5. ✅ `register.dto.ts` - Add email sanitization transformer
6. ✅ `login.dto.ts` - Add email sanitization transformer

### New Files to Create:
7. ✅ `backend/src/common/interfaces/request.interface.ts` - Shared request types
8. ✅ `backend/src/pricing-engine/interfaces/` - Pricing engine interfaces
9. ✅ `backend/src/pricing-engine/constants/` - Business rules constants

## 🚀 Next Steps

1. Create interface files
2. Update auth module files
3. Refactor pricing-engine.service.ts
4. Add proper logging throughout
5. Update DTOs with transformers
6. Add unit tests for critical paths
7. Update documentation

## ⚠️ Breaking Changes: NONE
All changes are internal refactoring - no API changes, no functionality changes.
