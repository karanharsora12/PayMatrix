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
  {
    srNo: 2,
    name: 'CanManageLeave',
    description:
      'Controls whether the user can manage leave requests, approvals, and balances for all employees or only their own leaves.',
    defaultValue: false,
    defaultValueLabel: 'No',
    type: 'boolean',
  },
  {
    srNo: 3,
    name: 'CanAssignDocument',
    description:
      'Controls whether the user has permission to assign documents (e.g. Joining Letter, Salary Revision) to employees.',
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
