"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Bot,
  FlaskConical,
  BarChart3,
  Settings,
  User,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Test Runs", href: "/test-runs", icon: FlaskConical },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed, toggleSidebar } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`flex flex-col bg-[#0f172a] min-h-screen transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Brand Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
        <div className="overflow-hidden">
          {collapsed ? (
            <span className="text-white font-bold text-xl">BQ</span>
          ) : (
            <span className="text-white font-bold text-xl whitespace-nowrap">
              Bazark QA
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2563eb] rounded-r-full" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={`whitespace-nowrap transition-opacity duration-300 ${
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-slate-700/50" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {session?.user?.name ? getInitials(session.user.name) : "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {session?.user?.name || "User"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {session?.user?.email || ""}
                </div>
              </div>
            )}
            {!collapsed && session?.user?.role && (
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {session.user.role}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className={`absolute bottom-full mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden z-50 ${
                collapsed ? "left-0 w-48" : "left-0 right-0"
              }`}
            >
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
