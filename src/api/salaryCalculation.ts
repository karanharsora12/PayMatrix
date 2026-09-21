import { salaryStructuresApi } from './salaryStructures';
import { employeeSalaryApi } from './employeeSalary';

export const salaryCalculationApi = {
  previewStructure: salaryStructuresApi.previewStructure,
  previewEmployeeSalary: employeeSalaryApi.getSalaryPreview,
};
