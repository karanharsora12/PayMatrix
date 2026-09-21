import { BadRequestException } from '@nestjs/common';

export interface Token {
  type: 'NUMBER' | 'OPERATOR' | 'VARIABLE' | 'LPAREN' | 'RPAREN';
  value: string | number;
}

export interface ComponentDependency {
  code: string;
  calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  percentageOf?: string | null;
  formula?: string | null;
}

const FORBIDDEN_KEYWORDS = new Set([
  'eval',
  'function',
  'return',
  'process',
  'window',
  'document',
  'global',
  'globalthis',
  'require',
  'import',
  'constructor',
  'prototype',
  '__proto__',
  'this',
  'settimeout',
  'setinterval',
  'fetch',
  'console',
]);

export class SafeFormulaEvaluator {
  /**
   * Tokenize mathematical formula string safely into numbers, variables, operators, and parentheses.
   */
  static tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const str = expression.trim();

    while (i < str.length) {
      const char = str[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (integers or floating point)
      if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(str[i + 1] || ''))) {
        let numStr = '';
        while (i < str.length && /[0-9.]/.test(str[i])) {
          if (str[i] === '.' && numStr.includes('.')) {
            throw new BadRequestException({
              code: 'INVALID_FORMULA_SYNTAX',
              message: `Invalid number format in formula: multiple decimal points`,
            });
          }
          numStr += str[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // Operators
      if (char === '+' || char === '-' || char === '*' || char === '/') {
        // Check for unary minus/plus
        const prevToken = tokens[tokens.length - 1];
        const isUnary = !prevToken || prevToken.type === 'OPERATOR' || prevToken.type === 'LPAREN';
        if (isUnary && (char === '-' || char === '+')) {
          // Represent unary minus as `0 - next`
          if (char === '-') {
            tokens.push({ type: 'NUMBER', value: 0 });
            tokens.push({ type: 'OPERATOR', value: '-' });
          }
          i++;
          continue;
        }

        tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      // Variables / Component Codes (alphanumeric and underscore)
      if (/[a-zA-Z_]/.test(char)) {
        let varName = '';
        while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
          varName += str[i];
          i++;
        }

        const lower = varName.toLowerCase();
        if (FORBIDDEN_KEYWORDS.has(lower)) {
          throw new BadRequestException({
            code: 'FORBIDDEN_FORMULA_VARIABLE',
            message: `Forbidden token in formula: ${varName}`,
          });
        }

        tokens.push({ type: 'VARIABLE', value: varName.toUpperCase() });
        continue;
      }

      // Any other character is invalid
      throw new BadRequestException({
        code: 'INVALID_FORMULA_CHARACTER',
        message: `Invalid character '${char}' in formula: ${expression}`,
      });
    }

    return tokens;
  }

  /**
   * Extract all variable/component dependencies from a formula string.
   */
  static extractVariables(formula: string): string[] {
    if (!formula || !formula.trim()) return [];
    const tokens = this.tokenize(formula);
    const vars = new Set<string>();
    for (const t of tokens) {
      if (t.type === 'VARIABLE') {
        vars.add(t.value as string);
      }
    }
    return Array.from(vars);
  }

  /**
   * Convert infix tokens to Reverse Polish Notation (RPN) using Shunting-yard algorithm.
   */
  private static toRPN(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const opStack: Token[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    for (const token of tokens) {
      if (token.type === 'NUMBER' || token.type === 'VARIABLE') {
        output.push(token);
      } else if (token.type === 'OPERATOR') {
        const op1 = token.value as string;
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1].type === 'OPERATOR' &&
          precedence[opStack[opStack.length - 1].value as string] >= precedence[op1]
        ) {
          output.push(opStack.pop()!);
        }
        opStack.push(token);
      } else if (token.type === 'LPAREN') {
        opStack.push(token);
      } else if (token.type === 'RPAREN') {
        let foundLparen = false;
        while (opStack.length > 0) {
          const top = opStack.pop()!;
          if (top.type === 'LPAREN') {
            foundLparen = true;
            break;
          }
          output.push(top);
        }
        if (!foundLparen) {
          throw new BadRequestException({
            code: 'MISMATCHED_PARENTHESES',
            message: 'Mismatched parentheses in formula',
          });
        }
      }
    }

    while (opStack.length > 0) {
      const top = opStack.pop()!;
      if (top.type === 'LPAREN' || top.type === 'RPAREN') {
        throw new BadRequestException({
          code: 'MISMATCHED_PARENTHESES',
          message: 'Mismatched parentheses in formula',
        });
      }
      output.push(top);
    }

    return output;
  }

  /**
   * Evaluates an arithmetic formula with given variable context.
   */
  static evaluate(formula: string, context: Record<string, number>): number {
    if (!formula || !formula.trim()) return 0;
    const tokens = this.tokenize(formula);
    if (tokens.length === 0) return 0;

    const rpn = this.toRPN(tokens);
    const stack: number[] = [];

    for (const token of rpn) {
      if (token.type === 'NUMBER') {
        stack.push(token.value as number);
      } else if (token.type === 'VARIABLE') {
        const varName = token.value as string;
        if (!(varName in context)) {
          throw new BadRequestException({
            code: 'UNDEFINED_FORMULA_VARIABLE',
            message: `Variable '${varName}' is not defined in the calculation context`,
          });
        }
        stack.push(context[varName] ?? 0);
      } else if (token.type === 'OPERATOR') {
        if (stack.length < 2) {
          throw new BadRequestException({
            code: 'INVALID_FORMULA_EXPRESSION',
            message: `Invalid formula syntax for operator '${token.value}' in: ${formula}`,
          });
        }
        const b = stack.pop()!;
        const a = stack.pop()!;
        let res = 0;
        switch (token.value) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '*':
            res = a * b;
            break;
          case '/':
            if (Math.abs(b) < 0.0000001) {
              res = 0; // Guard against division by zero
            } else {
              res = a / b;
            }
            break;
          default:
            throw new BadRequestException({
              code: 'UNSUPPORTED_OPERATOR',
              message: `Unsupported operator: ${token.value}`,
            });
        }
        stack.push(res);
      }
    }

    if (stack.length !== 1) {
      throw new BadRequestException({
        code: 'INVALID_FORMULA_EXPRESSION',
        message: `Invalid formula evaluation result for: ${formula}`,
      });
    }

    const finalVal = stack[0];
    return isNaN(finalVal) ? 0 : Math.round(finalVal * 100) / 100;
  }

  /**
   * Build dependency graph and return components sorted in topological order.
   * Throws BadRequestException if a cycle is detected.
   */
  static getEvaluationOrder<T extends ComponentDependency>(components: T[]): T[] {
    const compMap = new Map<string, T>();
    const adj = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    for (const c of components) {
      const code = c.code.toUpperCase();
      compMap.set(code, c);
      adj.set(code, new Set<string>());
      inDegree.set(code, 0);
    }

    // Determine dependencies: if A depends on B, then B -> A (B must be computed before A)
    for (const c of components) {
      const targetCode = c.code.toUpperCase();
      const deps = new Set<string>();

      if (c.calculationType === 'PERCENTAGE' && c.percentageOf) {
        deps.add(c.percentageOf.toUpperCase());
      } else if (c.calculationType === 'FORMULA' && c.formula) {
        const vars = this.extractVariables(c.formula);
        for (const v of vars) {
          deps.add(v.toUpperCase());
        }
      }

      for (const dep of deps) {
        // If dependent on another component in this structure
        if (compMap.has(dep) && dep !== targetCode) {
          adj.get(dep)!.add(targetCode);
        }
      }
    }

    // Compute in-degrees
    for (const [_, targets] of adj.entries()) {
      for (const target of targets) {
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      }
    }

    // Queue nodes with in-degree 0
    const queue: string[] = [];
    for (const [code, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(code);
      }
    }

    const result: T[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      result.push(compMap.get(u)!);

      for (const v of adj.get(u) || []) {
        const newDeg = inDegree.get(v)! - 1;
        inDegree.set(v, newDeg);
        if (newDeg === 0) {
          queue.push(v);
        }
      }
    }

    if (result.length !== components.length) {
      // Find remaining components involved in cycle
      const cyclicNodes = Array.from(inDegree.entries())
        .filter(([_, deg]) => deg > 0)
        .map(([code]) => code);

      throw new BadRequestException({
        code: 'CIRCULAR_SALARY_DEPENDENCY',
        message: `Circular salary component dependency detected among: ${cyclicNodes.join(', ')}`,
      });
    }

    return result;
  }
}
