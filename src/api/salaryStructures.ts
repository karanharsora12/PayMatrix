import { api, unwrap } from "./client";
import type { SalaryComponentItem } from "./salaryComponents";

export interface StructureComponentItem {
  id?: string;
  salaryStructureId?: string;
  salaryComponentId: string;
  calculationType: "FIXED" | "PERCENTAGE" | "FORMULA";
  amount?: number | string | null;
  percentage?: number | string | null;
  percentageOf?: string | null;
  formula?: string | null;
  minimumAmount?: number | string | null;
  maximumAmount?: number | string | null;
  displayOrder?: number;
  salaryComponent?: SalaryComponentItem;
}

export interface SalaryStructureItem {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  components: StructureComponentItem[];
  createdAt: string;
  updatedAt: string;
}

export const salaryStructuresApi = {
  getStructures: async (params?: any) => {
    const res = await api.get("/salary/structures", { params });
    return {
      data: (res.data as any).data as SalaryStructureItem[],
      meta: (res.data as any).meta,
    };
  },
  getStructure: async (id: string) => {
    return unwrap(await api.get(`/salary/structures/${id}`))
      .data as SalaryStructureItem;
  },
  createStructure: async (data: any) => {
    return unwrap(await api.post("/salary/structures", data))
      .data as SalaryStructureItem;
  },
  updateStructure: async (id: string, data: any) => {
    return unwrap(await api.patch(`/salary/structures/${id}`, data))
      .data as SalaryStructureItem;
  },
  deleteStructure: async (id: string) => {
    return unwrap(await api.delete(`/salary/structures/${id}`)).data;
  },
  previewStructure: async (components: StructureComponentItem[]) => {
    const sanitized = (components || []).map((c, idx) => ({
      salaryComponentId: c.salaryComponentId,
      calculationType: c.calculationType,
      amount: c.amount != null ? Number(c.amount) : undefined,
      percentage: c.percentage != null ? Number(c.percentage) : undefined,
      percentageOf: c.percentageOf || undefined,
      formula: c.formula || undefined,
      minimumAmount:
        c.minimumAmount != null ? Number(c.minimumAmount) : undefined,
      maximumAmount:
        c.maximumAmount != null ? Number(c.maximumAmount) : undefined,
      displayOrder: c.displayOrder ?? idx,
    }));
    return unwrap(
      await api.post("/salary/structures/preview", { components: sanitized }),
    ).data;
  },
};
