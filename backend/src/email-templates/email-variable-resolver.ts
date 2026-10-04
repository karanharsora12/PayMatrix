import {
  EMAIL_VARIABLE_DEFINITIONS,
  EmailVariableDefinition,
} from './email-templates.constants';

export class EmailVariableResolver {
  private static readonly VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

  /**
   * Extracts unique placeholder names from a text or HTML string.
   */
  static extractVariables(text: string): string[] {
    if (!text) return [];
    const vars = new Set<string>();
    let match: RegExpExecArray | null;
    const regex = new RegExp(this.VARIABLE_REGEX);
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        vars.add(match[1]);
      }
    }
    return Array.from(vars);
  }

  /**
   * Returns valid variable definitions allowed for a given template type.
   */
  static getAllowedVariablesForType(templateType: string): EmailVariableDefinition[] {
    return EMAIL_VARIABLE_DEFINITIONS.filter(
      (v) =>
        v.templateTypes.includes(templateType) ||
        v.templateTypes.includes('General'),
    );
  }

  /**
   * Validates whether all placeholders used in subject and body are valid for this templateType.
   */
  static validateTemplateVariables(
    templateType: string,
    subject: string,
    bodyHtml: string,
  ): { isValid: boolean; invalidVariables: string[] } {
    const usedVars = new Set<string>([
      ...this.extractVariables(subject),
      ...this.extractVariables(bodyHtml),
    ]);

    const allowedDefs = this.getAllowedVariablesForType(templateType);
    const allowedNames = new Set(allowedDefs.map((d) => d.variable));

    const invalidVariables: string[] = [];
    for (const v of usedVars) {
      if (!allowedNames.has(v)) {
        invalidVariables.push(v);
      }
    }

    return {
      isValid: invalidVariables.length === 0,
      invalidVariables,
    };
  }

  /**
   * Safely replaces all {{Placeholders}} in the template with values from data object.
   * If a variable is undefined or null, it falls back to an empty string.
   */
  static resolve(
    templateText: string,
    data: Record<string, any> = {},
  ): string {
    if (!templateText) return '';
    return templateText.replace(this.VARIABLE_REGEX, (match, varName) => {
      const val = data[varName];
      if (val === undefined || val === null) {
        return '';
      }
      return String(val);
    });
  }
}
