"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { key: "employees", icon: Users, href: "/dashboard/employees" },
  { key: "projects", icon: FolderKanban, href: "/dashboard/projects" },
  { key: "timeTracking", icon: Clock, href: "/dashboard/time-tracking" },
  { key: "reports", icon: FileText, href: "/dashboard/reports" },
  { key: "settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleLanguageChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <h1 className="font-bold text-xl">X-Royal-Time</h1>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-white border-r transform transition-transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          <div className="p-6 border-b hidden lg:block">
            <h1 className="font-bold text-xl">X-Royal-Time</h1>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.includes(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-slate-100"}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white space-y-4">
            <Select value={locale} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">{tSettings("languages.de")}</SelectItem>
                <SelectItem value="en">{tSettings("languages.en")}</SelectItem>
                <SelectItem value="ro">{tSettings("languages.ro")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              {t("logout") || "Logout"}
            </Button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
