"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2 } from "lucide-react";

interface Employee {
  id: number;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  department: string | null;
  position: string | null;
  vacation_days_per_year: number;
  is_active: boolean;
}

export default function EmployeesPage() {
  const t = useTranslations("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/employees/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch employees");
        }

        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("addEmployee")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground">Noch keine Mitarbeiter angelegt.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("employeeNumber")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("department")}</TableHead>
                  <TableHead>{t("position")}</TableHead>
                  <TableHead className="text-right">{t("vacationDays")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono">
                      {emp.employee_number || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {emp.first_name} {emp.last_name}
                    </TableCell>
                    <TableCell>{emp.department || "-"}</TableCell>
                    <TableCell>{emp.position || "-"}</TableCell>
                    <TableCell className="text-right">
                      {emp.vacation_days_per_year}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
