export interface ParameterDefinition {
  srNo: number;
  name: string;
  description: string;
  defaultValue: boolean | string;
  defaultValueLabel: string;
  type: 'boolean' | 'string';
}

export const PARAMETER_DEFINITIONS: ParameterDefinition[] = [
  {
    srNo: 1,
    name: 'CanManageAttendance',
    description:
      'Controls whether the user can manage attendance for all users or only their own attendance.',
    defaultValue: false,
    defaultValueLabel: 'No',
    type: 'boolean',
  },
];

export const DEFAULT_PARAMETERS: Record<string, boolean | string> =
  PARAMETER_DEFINITIONS.reduce(
    (acc, def) => {
      acc[def.name] = def.defaultValue;
      return acc;
    },
    {} as Record<string, boolean | string>,
  );
