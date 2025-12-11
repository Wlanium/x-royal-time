"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, Palmtree, Calendar, Loader2 } from "lucide-react";

interface DashboardStats {
  employeeCount: number;
  projectCount: number;
  pendingVacations: number;
  nextHoliday: string | null;
}

export default function DashboardPage() {
  const t = useTranslations("nav");
  const tVacations = useTranslations("vacations");
  const [stats, setStats] = useState<DashboardStats>({
    employeeCount: 0,
    projectCount: 0,
    pendingVacations: 0,
    nextHoliday: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      try {
        // Fetch employees
        const empRes = await fetch(`${apiUrl}/api/v1/employees/`, { headers });
        const employees = empRes.ok ? await empRes.json() : [];

        // Fetch projects
        const projRes = await fetch(`${apiUrl}/api/v1/projects/`, { headers });
        const projects = projRes.ok ? await projRes.json() : [];

        // Fetch pending vacations
        const vacRes = await fetch(`${apiUrl}/api/v1/vacations/?status=pending`, { headers });
        const vacations = vacRes.ok ? await vacRes.json() : [];

        // Fetch next holiday (Romania, current year)
        const year = new Date().getFullYear();
        const holRes = await fetch(`${apiUrl}/api/v1/holidays/?year=${year}&country=RO`, { headers });
        const holidays = holRes.ok ? await holRes.json() : [];

        // Find next upcoming holiday
        const today = new Date().toISOString().split("T")[0];
        const upcomingHolidays = holidays.filter((h: { date: string }) => h.date >= today);
        const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0].name : null;

        setStats({
          employeeCount: employees.length,
          projectCount: projects.length,
          pendingVacations: vacations.length,
          nextHoliday,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("dashboard")}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("employees")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employeeCount}</div>
            <p className="text-xs text-muted-foreground">Aktive Mitarbeiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("projects")}
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectCount}</div>
            <p className="text-xs text-muted-foreground">Aktive Projekte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("vacations")}
            </CardTitle>
            <Palmtree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVacations}</div>
            <p className="text-xs text-muted-foreground">{tVacations("statuses.pending")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Feiertage (RO)
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats.nextHoliday || "-"}
            </div>
            <p className="text-xs text-muted-foreground">Nächster Feiertag</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
