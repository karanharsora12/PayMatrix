import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  useCreateEmployee,
  useUpdateEmployee,
  useEmployee,
} from "@/hooks/useEmployees";
import { departmentApi } from "@/api/departments";
import { branchApi } from "@/api/branches";
import { designationApi } from "@/api/designations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  Briefcase,
  Phone,
  CreditCard,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormFooter } from "@/components/common/FormFooter";

const schema = z.object({
  employeeCode: z.string().min(2, "Employee code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  branchId: z.string().optional(),
  panNumber: z.string().optional(),
  nationalIdNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolder: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export default function AddEmployee() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee(id || "");
  const { data: empData, isLoading: isEmpLoading } = useEmployee(id || "");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeCode: "EMP-",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      joiningDate: new Date().toISOString().slice(0, 10),
      gender: "",
      bloodGroup: "",
      departmentId: "",
      designationId: "",
      branchId: "",
      panNumber: "",
      nationalIdNumber: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolder: "",
    },
  });

  useEffect(() => {
    if (isEdit && empData) {
      const e: any = (empData as any)?.data || empData;
      reset({
        employeeCode: e.employeeCode || e.employeeId || "",
        firstName: e.firstName || "",
        lastName: e.lastName || "",
        email: e.email || "",
        phone: e.phone || "",
        address: e.address || "",
        joiningDate: e.joiningDate
          ? new Date(e.joiningDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        gender: e.gender || "",
        bloodGroup: e.bloodGroup || "",
        departmentId: e.departmentId || e.department?.id || "",
        designationId: e.designationId || e.designation?.id || "",
        branchId: e.branchId || e.branch?.id || "",
        panNumber: e.panNumber || "",
        nationalIdNumber: e.nationalIdNumber || "",
        bankName: e.bankName || "",
        accountNumber: e.accountNumber || "",
        ifscCode: e.ifscCode || "",
        accountHolder: e.accountHolder || "",
      });
    }
  }, [isEdit, empData, reset]);

  const { data: depts } = useQuery({
    queryKey: ["departments", "list"],
    queryFn: () =>
      departmentApi
        .list({ page: 1, pageSize: 100 })
        .catch(() => ({ data: [] })),
  });
  const { data: branches } = useQuery({
    queryKey: ["branches", "list"],
    queryFn: () =>
      branchApi.list({ page: 1, pageSize: 100 }).catch(() => ({ data: [] })),
  });
  const { data: desigs } = useQuery({
    queryKey: ["designations", "list"],
    queryFn: () =>
      designationApi
        .list({ page: 1, pageSize: 100 })
        .catch(() => ({ data: [] })),
  });

  const deptList = (depts as any)?.data ?? [];
  const branchList = (branches as any)?.data ?? [];
  const desigList = (desigs as any)?.data ?? [];

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        employeeCode: values.employeeCode,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        joiningDate: values.joiningDate,
        branchId: values.branchId || undefined,
        departmentId: values.departmentId || undefined,
        designationId: values.designationId || undefined,
        gender: values.gender || undefined,
        panNumber: values.panNumber || undefined,
        nationalIdNumber: values.nationalIdNumber || undefined,
      };

      if (isEdit) {
        await updateMut.mutateAsync(payload);
        toast.success("Employee updated successfully");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Employee created successfully");
      }
      nav("/employees");
    } catch (e: any) {
      toast.error(
        e?.normalizedError?.message ??
          e?.response?.data?.error?.message ??
          e?.message ??
          (isEdit ? "Failed to update employee" : "Failed to create employee"),
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col min-h-[calc(100vh-64px)] p-3 max-w-screen-2xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => nav("/employees")}
            className="flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-none">
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? "Update the employee record details below"
                : "Fill in the details below to create a new employee record"}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form
          id="employee-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 pb-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
              <SectionHeader
                icon={User}
                title="Personal Information"
                subtitle="Basic identity details"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="First Name"
                  required
                  error={errors.firstName?.message}
                >
                  <Input placeholder="e.g. Karan" {...register("firstName")} />
                </Field>
                <Field
                  label="Last Name"
                  required
                  error={errors.lastName?.message}
                >
                  <Input placeholder="e.g. Harsora" {...register("lastName")} />
                </Field>
                <Field label="Gender">
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Blood Group">
                  <Input placeholder="e.g. B+" {...register("bloodGroup")} />
                </Field>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
              <SectionHeader
                icon={Briefcase}
                title="Employment Details"
                subtitle="Role and organizational assignment"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Employee Code"
                  required
                  error={errors.employeeCode?.message}
                >
                  <Input
                    placeholder="e.g. EMP-001"
                    {...register("employeeCode")}
                  />
                </Field>
                <Field
                  label="Joining Date"
                  required
                  error={errors.joiningDate?.message}
                >
                  <Input type="date" {...register("joiningDate")} />
                </Field>
                <Field label="Department">
                  <Controller
                    control={control}
                    name="departmentId"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {deptList.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Designation">
                  <Controller
                    control={control}
                    name="designationId"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {desigList.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Branch" className="col-span-2">
                  <Controller
                    control={control}
                    name="branchId"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branchList.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
              <SectionHeader
                icon={Phone}
                title="Contact Information"
                subtitle="How to reach this employee"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email" error={errors.email?.message}>
                  <Input
                    type="email"
                    placeholder="karan@company.com"
                    {...register("email")}
                  />
                </Field>
                <Field label="Mobile">
                  <Input placeholder="+91 98765 43210" {...register("phone")} />
                </Field>
                <Field label="Address" className="col-span-2">
                  <Input
                    placeholder="Residential address"
                    {...register("address")}
                  />
                </Field>
              </div>
            </div>

            {/* Bank Account */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
              <SectionHeader
                icon={Banknote}
                title="Bank Account"
                subtitle="Salary disbursement account"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Bank Name">
                  <Input
                    placeholder="e.g. HDFC Bank"
                    {...register("bankName")}
                  />
                </Field>
                <Field label="IFSC Code">
                  <Input
                    placeholder="e.g. HDFC0001234"
                    {...register("ifscCode")}
                  />
                </Field>
                <Field label="Account Number">
                  <Input
                    placeholder="Account number"
                    {...register("accountNumber")}
                  />
                </Field>
                <Field label="Account Holder Name">
                  <Input
                    placeholder="As per bank records"
                    {...register("accountHolder")}
                  />
                </Field>
              </div>
            </div>

            {/* Statutory & Compliance */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm lg:col-span-2">
              <SectionHeader
                icon={CreditCard}
                title="Statutory & Compliance"
                subtitle="Tax and government identifiers"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="PAN Number">
                  <Input placeholder="ABCDE1234F" {...register("panNumber")} />
                </Field>
                <Field label="Aadhaar / National ID">
                  <Input
                    placeholder="1234 5678 9012"
                    {...register("nationalIdNumber")}
                  />
                </Field>
                <Field label="UAN Number">
                  <Input placeholder="Universal Account No." />
                </Field>
                <Field label="ESI Number">
                  <Input placeholder="ESI / Insurance No." />
                </Field>
              </div>
            </div>
          </div>
        </form>
      </div>
      <FormFooter
        formId="employee-form"
        isSaving={createMut.isPending || updateMut.isPending}
        saveLabel={isEdit ? "Update Employee" : "Save Employee"}
        onClear={() => reset()}
        onCancel={() => nav("/employees")}
      />
    </div>
  );
}
