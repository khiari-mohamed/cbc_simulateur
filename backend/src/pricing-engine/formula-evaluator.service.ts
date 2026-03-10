import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FormulaEvaluatorService {
  /**
   * Evaluate a custom formula with given variables
   * Formula example: ((VV * rate) + fixed) * reduction
   * Variables: { VV: 50000, rate: 0.00236, fixed: 30, reduction: 0.9 }
   */
  evaluateFormula(formula: string, variables: Record<string, number>): number {
    try {
      let expression = formula;
      
      // Sort variables by length (longest first) to avoid partial replacements
      const sortedVars = Object.keys(variables).sort((a, b) => b.length - a.length);
      
      for (const varName of sortedVars) {
        const value = variables[varName];
        expression = expression.replace(
          new RegExp(`\\b${varName}\\b`, 'gi'),
          value.toString()
        );
      }

      // Validate expression (only allow numbers, operators, parentheses, and whitespace)
      if (!/^[\d\s+\-*/.()]+$/.test(expression)) {
        throw new Error('Invalid formula expression');
      }

      const result = eval(expression);
      
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Formula evaluation did not return a valid number');
      }

      return Math.max(0, result);
    } catch (error) {
      throw new BadRequestException(`Formula evaluation error: ${error.message}`);
    }
  }

  /**
   * Validate formula syntax
   */
  validateFormula(formula: string, sampleVariables: Record<string, number>): boolean {
    try {
      this.evaluateFormula(formula, sampleVariables);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract variable names from formula
   */
  extractVariables(formula: string): string[] {
    const matches = formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
    return matches ? [...new Set(matches)] : [];
  }
}
