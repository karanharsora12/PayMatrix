import { getFileUrl, uploadApi } from "@/api";
import { branchApi } from "@/api/branches";
import { departmentApi } from "@/api/departments";
import { designationApi } from "@/api/designations";
import { employeeGroupApi } from "@/api/employeeGroups";
import { DatePicker } from "@/components/common";
import { FormFooter } from "@/components/common/FormFooter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  useCreateEmployee,
  useEmployee,
  useUpdateEmployee,
} from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useUsersRoles";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Camera,
  CreditCard,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

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
  uanNumber: z.string().optional(),
  esiNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolder: z.string().optional(),
  roleId: z.string().optional(),
  password: z.string().optional(),
  employeeGroupId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">
            {title}
          </p>
          {badge && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
              {badge}
            </Badge>
          )}
        </div>
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
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Info className="h-2.5 w-2.5 shrink-0" /> {hint}
        </p>
      )}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export default function AddEmployee() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("employees.create");
  const canEdit = hasPermission("employees.edit");
  const canSubmit = isEdit ? canEdit : canCreate;

  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee(id || "");
  const { data: empData } = useEmployee(id || "");
  const { data: rolesResp } = useRoles();

  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormValues>({
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
    uanNumber: "",
    esiNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolder: "",
    roleId: "",
    password: "PayMatrix@123",
    employeeGroupId: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof FormValues, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "departmentId") {
        if (newData.designationId) {
          const currentDesig = desigList.find(
            (d: any) => d.id === newData.designationId,
          );
          if (
            currentDesig &&
            currentDesig.departmentId &&
            currentDesig.departmentId !== value &&
            currentDesig.department?.id !== value
          ) {
            newData.designationId = "";
          }
        }
      }
      return newData;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const eData: any = (empData as any)?.data || empData;
  const tiedUser = isEdit ? eData?.user : null;
  const userRole = tiedUser?.roles?.[0]?.id || "";

  const watchedFirstName = formData.firstName;
  const watchedLastName = formData.lastName;

  const initials =
    (
      (watchedFirstName?.[0] || "") + (watchedLastName?.[0] || "")
    ).toUpperCase() || "?";

  useEffect(() => {
    if (isEdit && empData) {
      const e: any = (empData as any)?.data || empData;
      if (e.profilePhotoUrl && !avatarPreview) {
        setAvatarPreview(getFileUrl(e.profilePhotoUrl));
      }

      setFormData({
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
        uanNumber: e.uanNumber || "",
        esiNumber: e.esiNumber || "",
        bankName: e.bankName || "",
        accountNumber: e.accountNumber || "",
        ifscCode: e.ifscCode || "",
        accountHolder: e.accountHolder || "",
        roleId: userRole,
        password: "",
        employeeGroupId: e.employeeGroupId || e.employeeGroup?.id || "",
      });
    }
  }, [isEdit, empData, userRole]);

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
  const { data: employeeGroups } = useQuery({
    queryKey: ["employeeGroups", "list"],
    queryFn: () => employeeGroupApi.list().catch(() => ({ data: [] })),
  });

  const deptList = (depts as any)?.data ?? [];
  const branchList = (branches as any)?.data ?? [];
  const desigList = (desigs as any)?.data ?? [];
  const rolesList: any[] = (rolesResp as any)?.data ?? [];
  const employeeGroupList = (employeeGroups as any)?.data ?? [];

  const watchedDepartmentId = formData.departmentId;
  const watchedDesignationId = formData.designationId;

  // Filter designations according to selected department
  const filteredDesigList = useMemo(() => {
    if (!watchedDepartmentId) {
      return desigList;
    }
    const matching = desigList.filter(
      (d: any) =>
        d.departmentId === watchedDepartmentId ||
        d.department?.id === watchedDepartmentId,
    );
    const general = desigList.filter(
      (d: any) => !d.departmentId && !d.department?.id,
    );
    const combined = [...matching, ...general];

    // If currently selected designation is not in combined (e.g. from existing employee profile), preserve it
    if (
      watchedDesignationId &&
      !combined.some((d: any) => d.id === watchedDesignationId)
    ) {
      const current = desigList.find((d: any) => d.id === watchedDesignationId);
      if (current) combined.push(current);
    }

    return combined;
  }, [desigList, watchedDepartmentId, watchedDesignationId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadApi.uploadImage(file);
        setAvatarPreview(url);
      } catch (err) {
        toast.error("Failed to upload image");
      }
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) {
      toast.error(
        isEdit
          ? "You do not have permission to edit employees"
          : "You do not have permission to create employees",
      );
      return;
    }
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[i.path[0]] = i.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the errors in the form");
      return;
    }
    const values = formData;
    try {
      const payload = {
        employeeCode: values.employeeCode,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        joiningDate: values.joiningDate,
        branchId: values.branchId || undefined,
        departmentId: values.departmentId || undefined,
        designationId: values.designationId || undefined,
        gender: values.gender || undefined,
        bloodGroup: values.bloodGroup || undefined,
        panNumber: values.panNumber || undefined,
        nationalIdNumber: values.nationalIdNumber || undefined,
        pfNumber: values.uanNumber || undefined,
        esiNumber: values.esiNumber || undefined,
        bankName: values.bankName || undefined,
        accountNumber: values.accountNumber || undefined,
        ifscCode: values.ifscCode || undefined,
        accountHolder: values.accountHolder || undefined,
        profilePhotoUrl: avatarPreview || undefined,
        roleId: values.roleId || undefined,
        password: values.password || undefined,
        employeeGroupId: values.employeeGroupId || undefined,
      };

      if (isEdit) {
        await updateMut.mutateAsync(payload);
        toast.success("Employee updated successfully");
      } else {
        await createMut.mutateAsync(payload);
        if (values.email) {
          toast.success(
            `Employee created! Login: ${values.email} · Password: ${values.password?.trim() || "PayMatrix@123"}`,
          );
        } else {
          toast.success("Employee created successfully.");
        }
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
      <div className="flex flex-col min-h-[calc(100vh-64px)] p-4 max-w-screen-xl mx-auto">
        {/* Header */}
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
              Employee
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? "Update employee record details below"
                : "Fill in all sections to create a complete employee profile"}
            </p>
          </div>
        </div>

        <form id="employee-form" onSubmit={onSubmit} className="flex-1 pb-28">
          <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">
            {/* LEFT: Profile + Code + Access */}
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm transition-colors">
                <SectionHeader
                  icon={User}
                  title="Profile"
                  subtitle="Photo and basic ID"
                />

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => fileRef.current?.click()}
                  >
                    <div className="h-20 w-20 rounded-full border-2 border-dashed border-primary/30 group-hover:border-primary overflow-hidden bg-primary/5 flex items-center justify-center transition-colors">
                      {avatarPreview ? (
                        <img
                          src={getFileUrl(avatarPreview)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={() => {
                            setAvatarPreview(null);
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold text-primary/60">
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Camera className="h-3 w-3" />
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {watchedFirstName && watchedLastName
                        ? `${watchedFirstName} ${watchedLastName}`
                        : "Employee Name"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Click to upload photo
                    </p>
                  </div>
                </div>

                {/* Code + Date */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <Field
                    label="Employee Code"
                    required
                    error={errors.employeeCode}
                  >
                    <Input
                      placeholder="EMP-001"
                      className="font-mono"
                      name="employeeCode"
                      value={formData.employeeCode || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field
                    label="Joining Date"
                    required
                    error={errors.joiningDate}
                  >
                    <DatePicker
                      value={formData.joiningDate || ""}
                      onChange={(_, str) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          joiningDate: str,
                        }));
                        if (errors.joiningDate) {
                          setErrors((prev: any) => {
                            const next = { ...prev };
                            delete next.joiningDate;
                            return next;
                          });
                        }
                      }}
                      placeholder="Select joining date"
                    />
                  </Field>
                </div>
              </div>

              {/* System Access */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm transition-colors">
                <SectionHeader
                  icon={Shield}
                  title="System Access"
                  subtitle={isEdit ? "Manage role" : "Role & login credentials"}
                  badge={isEdit ? undefined : "Optional"}
                />
                <div className="space-y-3">
                  <Field
                    label={isEdit ? "Update Role" : "Assign Role"}
                    hint={
                      isEdit
                        ? "Update employee's system role"
                        : "Defaults to Employee if not selected"
                    }
                  >
                    <Select
                      onValueChange={(val) => handleSelectChange("roleId", val)}
                      value={formData.roleId || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesList.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                              {r.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {!isEdit && (
                    <>
                      <Field
                        label="Default Password"
                        hint="Employee uses this to first log in"
                      >
                        <div className="relative">
                          <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="PayMatrix@123"
                            className="pl-8 pr-9 font-mono text-sm"
                            name="password"
                            value={formData.password || ""}
                            onChange={handleInputChange}
                          />
                          <button
                            type="button"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword((v) => !v)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </Field>
                      <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 px-3 py-2.5 flex gap-2">
                        <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                          Login is only created if the employee has an email
                          address. Ask them to change password on first login.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: All Details */}
            <div className="space-y-5">
              {/* Personal Information */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm transition-colors">
                <SectionHeader
                  icon={User}
                  title="Personal Information"
                  subtitle="Basic identity details"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="First Name" required error={errors.firstName}>
                    <Input
                      placeholder="Karan"
                      name="firstName"
                      value={formData.firstName || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Last Name" required error={errors.lastName}>
                    <Input
                      placeholder="Harsora"
                      name="lastName"
                      value={formData.lastName || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Gender">
                    <Select
                      onValueChange={(val) => handleSelectChange("gender", val)}
                      value={formData.gender || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Blood Group">
                    <Input
                      placeholder="B+"
                      name="bloodGroup"
                      value={formData.bloodGroup || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
              </div>

              {/* Employment Details */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm transition-colors">
                <SectionHeader
                  icon={Briefcase}
                  title="Employment Details"
                  subtitle="Organizational assignment"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Employee Group">
                    <Select
                      onValueChange={(val) =>
                        handleSelectChange("employeeGroupId", val)
                      }
                      value={formData.employeeGroupId || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeGroupList.map((g: any) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Department">
                    <Select
                      onValueChange={(val) =>
                        handleSelectChange("departmentId", val)
                      }
                      value={formData.departmentId || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Department..." />
                      </SelectTrigger>
                      <SelectContent>
                        {deptList.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label="Designation"
                    hint={
                      watchedDepartmentId && filteredDesigList.length === 0
                        ? "No designations found for selected department"
                        : undefined
                    }
                  >
                    <Select
                      onValueChange={(val) =>
                        handleSelectChange("designationId", val)
                      }
                      value={formData.designationId || ""}
                      disabled={filteredDesigList.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            filteredDesigList.length === 0
                              ? "No designations available"
                              : "Designation..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDesigList.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Branch">
                    <Select
                      onValueChange={(val) =>
                        handleSelectChange("branchId", val)
                      }
                      value={formData.branchId || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Branch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {branchList.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm transition-colors">
                <SectionHeader
                  icon={Phone}
                  title="Contact Information"
                  subtitle="Email is used as login username"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Email"
                    error={errors.email}
                    hint="Required for system login"
                  >
                    <Input
                      type="email"
                      placeholder="karan@company.com"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Mobile">
                    <Input
                      placeholder="+91 98765 43210"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Address" className="col-span-2">
                    <Input
                      placeholder="Residential address"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
              </div>

              {/* Bank Account */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm transition-colors">
                <SectionHeader
                  icon={Banknote}
                  title="Bank Account"
                  subtitle="For salary disbursement"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Bank Name" className="md:col-span-2">
                    <Input
                      placeholder="e.g. HDFC Bank"
                      name="bankName"
                      value={formData.bankName || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="IFSC Code">
                    <Input
                      placeholder="HDFC0001234"
                      className="font-mono"
                      name="ifscCode"
                      value={formData.ifscCode || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Account Number">
                    <Input
                      placeholder="Account number"
                      className="font-mono"
                      name="accountNumber"
                      value={formData.accountNumber || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Account Holder" className="md:col-span-2">
                    <Input
                      placeholder="As per bank records"
                      name="accountHolder"
                      value={formData.accountHolder || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
              </div>

              {/* Statutory & Compliance */}
              <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm transition-colors">
                <SectionHeader
                  icon={CreditCard}
                  title="Statutory & Compliance"
                  subtitle="Tax and government identifiers"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="PAN Number">
                    <Input
                      placeholder="ABCDE1234F"
                      className="font-mono uppercase"
                      name="panNumber"
                      value={formData.panNumber || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Aadhaar / National ID">
                    <Input
                      placeholder="1234 5678 9012"
                      className="font-mono"
                      name="nationalIdNumber"
                      value={formData.nationalIdNumber || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="UAN Number">
                    <Input
                      placeholder="Universal Account No."
                      className="font-mono"
                      name="uanNumber"
                      value={formData.uanNumber || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="ESI Number">
                    <Input
                      placeholder="ESI / Insurance No."
                      className="font-mono"
                      name="esiNumber"
                      value={formData.esiNumber || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <FormFooter
        formId="employee-form"
        isSaving={createMut.isPending || updateMut.isPending}
        saveLabel={isEdit ? "Update Employee" : "Save & Create Employee"}
        hideSave={!canSubmit}
        onClear={() => {
          setFormData({
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
            uanNumber: "",
            esiNumber: "",
            bankName: "",
            accountNumber: "",
            ifscCode: "",
            accountHolder: "",
            roleId: "",
            password: "PayMatrix@123",
            employeeGroupId: "",
          });
          setErrors({});
          setAvatarPreview(null);
        }}
        onCancel={() => nav("/employees")}
      />
    </div>
  );
}
