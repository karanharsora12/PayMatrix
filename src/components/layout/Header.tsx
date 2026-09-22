import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export function Header({
  onToggleSidebar,
  onToggleMobile,
  onOpenCommand,
}: {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  onOpenCommand: () => void;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const loc = useLocation();
  const crumbs = loc.pathname.split("/").filter(Boolean);
  return (
    <header className="h-[56px] border-b bg-background flex items-center gap-3 px-4 sticky top-0 z-20">
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
          className="hidden md:flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 w-[360px] text-muted-foreground hover:bg-accent"
        >
          <Search className="h-4 w-4" /> Search PayMatrix...{" "}
          <span className="ml-auto text-xs border rounded px-1.5 py-0.5">
            Ctrl K
          </span>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onOpenCommand}>
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 ml-2">
              <img
                src="https://i.pravatar.cc/150?img=12"
                className="h-8 w-8 rounded-full"
              />
              <span className="hidden md:block text-sm font-medium">Admin</span>
            </button>
          }
        >
          <DropdownItem>My Profile</DropdownItem>
          <DropdownItem>Preferences</DropdownItem>
          <DropdownItem>Security</DropdownItem>
          <DropdownItem>Logout</DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
