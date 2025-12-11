"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, Users, Settings2, Database, FileJson } from "lucide-react";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "employee";
  is_active: boolean;
}

interface AppSettings {
  display_name_format: "full" | "last" | "nickname";
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ display_name_format: "full" });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const isAdmin = currentUser?.role === "admin" || false;

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Get app settings
      const settingsRes = await fetch(`${apiUrl}/api/v1/settings/app`, { headers });
      if (settingsRes.ok) {
        setAppSettings(await settingsRes.json());
      }

      // Get current user info
      const meRes = await fetch(`${apiUrl}/api/v1/auth/me`, { headers });
      if (meRes.ok) {
        setCurrentUser(await meRes.json());
      }

      // Get users list (admin only - will fail for non-admins)
      const usersRes = await fetch(`${apiUrl}/api/v1/settings/users`, { headers });
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateDisplayFormat = async (format: "full" | "last" | "nickname") => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/settings/app`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ display_name_format: format }),
      });

      if (res.ok) {
        setAppSettings({ ...appSettings, display_name_format: format });
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: number, role: "admin" | "manager" | "employee") => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/settings/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
      }
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  const downloadBackup = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/settings/backup`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `xroyal_backup_${new Date().toISOString().split("T")[0]}.db`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error("Failed to download backup:", err);
    }
  };

  const downloadExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/settings/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `xroyal_export_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error("Failed to download export:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="grid gap-6">
        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {t("display.title")}
            </CardTitle>
            <CardDescription>{t("display.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("display.nameFormat")}</Label>
                <Select
                  value={appSettings.display_name_format}
                  onValueChange={(v) => updateDisplayFormat(v as "full" | "last" | "nickname")}
                  disabled={!isAdmin || saving}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">{t("display.formats.full")}</SelectItem>
                    <SelectItem value="last">{t("display.formats.last")}</SelectItem>
                    <SelectItem value="nickname">{t("display.formats.nickname")}</SelectItem>
                  </SelectContent>
                </Select>
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground">{t("adminOnly")}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management (RBAC) */}
        {isAdmin && users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("users.title")}
              </CardTitle>
              <CardDescription>{t("users.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.name")}</TableHead>
                    <TableHead>{t("users.email")}</TableHead>
                    <TableHead>{t("users.role")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(v) =>
                            updateUserRole(user.id, v as "admin" | "manager" | "employee")
                          }
                          disabled={user.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t("users.roles.admin")}</SelectItem>
                            <SelectItem value="manager">{t("users.roles.manager")}</SelectItem>
                            <SelectItem value="employee">{t("users.roles.employee")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Backup & Export */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t("backup.title")}
              </CardTitle>
              <CardDescription>{t("backup.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline" onClick={downloadBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("backup.downloadDb")}
                </Button>
                <Button variant="outline" onClick={downloadExport}>
                  <FileJson className="h-4 w-4 mr-2" />
                  {t("backup.exportJson")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("account.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("users.name")}:</span>
                <span>{currentUser?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("users.email")}:</span>
                <span>{currentUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("users.role")}:</span>
                <span className="capitalize">{currentUser?.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
