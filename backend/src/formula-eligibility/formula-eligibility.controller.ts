import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FormulaEligibilityService } from './formula-eligibility.service';
import { CreateFormulaEligibilityRuleDto } from './dto/create-formula-eligibility-rule.dto';
import { UpdateFormulaEligibilityRuleDto } from './dto/update-formula-eligibility-rule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role, FormulaType } from '@prisma/client';

@Controller('formula-eligibility')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormulaEligibilityController {
  constructor(private readonly formulaEligibilityService: FormulaEligibilityService) {}

  /**
   * Get all eligibility rules with optional filters
   * GET /formula-eligibility/rules?companyId=xxx&usageId=xxx&formulaType=xxx
   */
  @Get('rules')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('usageId') usageId?: string,
    @Query('formulaType') formulaType?: FormulaType,
  ) {
    return this.formulaEligibilityService.findAll(companyId, usageId, formulaType);
  }

  /**
   * Get a single rule by ID
   * GET /formula-eligibility/rules/:id
   */
  @Get('rules/:id')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async findOne(@Param('id') id: string) {
    return this.formulaEligibilityService.findOne(id);
  }

  /**
   * Create a new eligibility rule
   * POST /formula-eligibility/rules
   */
  @Post('rules')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async create(@Body() dto: CreateFormulaEligibilityRuleDto) {
    return this.formulaEligibilityService.create(dto);
  }

  /**
   * Update an existing rule
   * PATCH /formula-eligibility/rules/:id
   */
  @Patch('rules/:id')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async update(@Param('id') id: string, @Body() dto: UpdateFormulaEligibilityRuleDto) {
    return this.formulaEligibilityService.update(id, dto);
  }

  /**
   * Delete a rule
   * DELETE /formula-eligibility/rules/:id
   */
  @Delete('rules/:id')
  @Roles(Role.ADMINISTRATEUR_ARS)
  async remove(@Param('id') id: string) {
    return this.formulaEligibilityService.remove(id);
  }

  /**
   * Check eligibility for a specific formula
   * GET /formula-eligibility/check?companyId=xxx&usageId=xxx&formulaType=xxx&vehicleAge=5
   */
  @Get('check')
  async checkEligibility(
    @Query('companyId') companyId: string,
    @Query('usageId') usageId: string,
    @Query('formulaType') formulaType: FormulaType,
    @Query('vehicleAge') vehicleAge: string,
  ) {
    // Validate required parameters
    if (!companyId || !usageId || !formulaType || !vehicleAge) {
      return {
        eligible: false,
        reason: 'Missing required parameters',
      };
    }

    // Parse and validate vehicle age
    const vehicleAgeInYears = parseInt(vehicleAge, 10);
    if (isNaN(vehicleAgeInYears) || vehicleAgeInYears < 0) {
      return {
        eligible: false,
        reason: 'Invalid vehicle age',
      };
    }

    return this.formulaEligibilityService.checkEligibility(
      companyId,
      usageId,
      formulaType,
      vehicleAgeInYears,
    );
  }

  /**
   * Get all eligible formulas for given parameters
   * GET /formula-eligibility/eligible-formulas?companyId=xxx&usageId=xxx&vehicleAge=5
   */
  @Get('eligible-formulas')
  async getEligibleFormulas(
    @Query('companyId') companyId: string,
    @Query('usageId') usageId: string,
    @Query('vehicleAge') vehicleAge: string,
  ) {
    // Validate required parameters
    if (!companyId || !usageId || !vehicleAge) {
      return {
        eligibleFormulas: [],
        error: 'Missing required parameters',
      };
    }

    // Parse and validate vehicle age
    const vehicleAgeInYears = parseInt(vehicleAge, 10);
    if (isNaN(vehicleAgeInYears) || vehicleAgeInYears < 0) {
      return {
        eligibleFormulas: [],
        error: 'Invalid vehicle age',
      };
    }

    const eligibleFormulas = await this.formulaEligibilityService.getEligibleFormulas(
      companyId,
      usageId,
      vehicleAgeInYears,
    );
    return { eligibleFormulas };
  }
}
