import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async runMinimalSeed() {
    try {
      // Check if companies and RC guarantee exist
      const companies = await this.prisma.company.findMany();
      const rcGuarantee = await this.prisma.guarantee.findUnique({ where: { code: 'RC' } });

      if (companies.length === 0) {
        throw new BadRequestException('Aucune compagnie trouvée. Créez d\'abord les compagnies via /admin/companies');
      }

      if (!rcGuarantee) {
        throw new BadRequestException('Garantie RC non trouvée. Créez d\'abord la garantie RC via /admin/guarantees');
      }

      // Delete existing pricing rules
      await this.prisma.pricingRule.deleteMany();

      // Run minimal seed script
      const { stdout, stderr } = await execAsync('npx ts-node prisma/seed-minimal.ts', {
        cwd: process.cwd(),
      });

      return {
        success: true,
        message: 'Seed minimal exécuté avec succès',
        output: stdout,
        companies: companies.length,
        rcRulesCreated: 40 * companies.length,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors de l\'exécution du seed minimal');
    }
  }

  async runFullSeed() {
    try {
      // Run full seed script directly
      const { stdout, stderr } = await execAsync('npx ts-node prisma/seed.ts', {
        cwd: process.cwd(),
      });

      return {
        success: true,
        message: 'Seed complet exécuté avec succès',
        output: stdout,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors de l\'exécution du seed complet');
    }
  }

  async wipeDatabase() {
    try {
      // Run wipe database script
      const { stdout, stderr } = await execAsync('npx ts-node prisma/wipe-database.ts', {
        cwd: process.cwd(),
      });

      return {
        success: true,
        message: 'Base de données nettoyée avec succès',
        output: stdout,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors du nettoyage de la base de données');
    }
  }
}
