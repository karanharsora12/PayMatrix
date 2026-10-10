import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredPermission?: string;
}

export default function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this page. Please contact your system administrator if you believe this is a mistake.",
  requiredPermission,
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center select-none animate-in fade-in-50 duration-200">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-destructive/15 blur-2xl rounded-full" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive shadow-sm">
          <ShieldAlert className="h-10 w-10" strokeWidth={1.75} />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>

        {requiredPermission && (
          <div className="pt-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-muted text-muted-foreground border border-border">
              Required Right: {requiredPermission}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
        <Button
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" /> Dashboard
        </Button>
      </div>
    </div>
  );
}
