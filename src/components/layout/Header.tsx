import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { getImageUrl } from "@/config/env";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { Check, Laptop, Menu, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryColorPicker } from "./PrimaryColorPicker";

export function Header({
  onToggleSidebar,
  onToggleMobile,
  onOpenCommand,
}: {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  onOpenCommand: () => void;
}) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [imgError, setImgError] = useState(false);

  const userPhoto = user?.employee?.profilePhotoUrl || user?.profilePhotoUrl;
  const displayName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.name || user?.email?.split("@")[0] || "User";

  const initials = (
    user?.employee
      ? `${user.employee.firstName?.[0] || ""}${user.employee.lastName?.[0] || ""}`
      : user?.email?.slice(0, 2) || "U"
  ).toUpperCase();

  return (
    <header className="h-[56px] border-b border-border bg-background/95 backdrop-blur-sm text-foreground flex items-center gap-3 px-4 sticky top-0 z-20 transition-colors">
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleSidebar}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleMobile}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <div className="flex-1 flex justify-center">
        <button
          onClick={onOpenCommand}
          className="hidden md:flex items-center gap-2 text-sm border border-input rounded-md px-3 py-1.5 w-[360px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Search className="h-4 w-4" /> Search PayMatrix...{" "}
          <span className="ml-auto text-xs border border-border rounded px-1.5 py-0.5 bg-muted/50">
            Ctrl K
          </span>
        </button>
      </div>
      <div className="flex items-center gap-1">
        {/* Primary Color Palette Picker */}
        <PrimaryColorPicker />

        <Dropdown
          trigger={
            <Button
              variant="ghost"
              size="icon"
              title={`Theme: ${theme} (active: ${resolvedTheme})`}
              className="relative"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          }
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
            Appearance
          </div>
          <DropdownItem
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center justify-between gap-2",
              theme === "light" && "bg-accent/80 text-primary font-medium",
            )}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Light</span>
            </div>
            {theme === "light" && <Check className="h-3.5 w-3.5" />}
          </DropdownItem>
          <DropdownItem
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center justify-between gap-2",
              theme === "dark" && "bg-accent/80 text-primary font-medium",
            )}
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-400" />
              <span>Dark</span>
            </div>
            {theme === "dark" && <Check className="h-3.5 w-3.5" />}
          </DropdownItem>
          <DropdownItem
            onClick={() => setTheme("system")}
            className={cn(
              "flex items-center justify-between gap-2",
              theme === "system" && "bg-accent/80 text-primary font-medium",
            )}
          >
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-muted-foreground" />
              <span>System</span>
            </div>
            {theme === "system" && <Check className="h-3.5 w-3.5" />}
          </DropdownItem>
        </Dropdown>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 ml-2">
              {userPhoto && !imgError ? (
                <img
                  src={getImageUrl(userPhoto)}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover border border-border shadow-sm"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shadow-sm">
                  {initials}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium">
                {displayName}
              </span>
            </button>
          }
        >
          <DropdownItem onClick={() => nav(`/employees/${user?.employeeId}`)}>
            My Profile
          </DropdownItem>
          <DropdownItem onClick={() => logout()}>Logout</DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
