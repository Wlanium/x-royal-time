"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const tCommon = useTranslations("common");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    employee_number: "",
    department: "",
    position: "",
    vacation_days_per_year: 21,
  });

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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = (employee?: Employee) => {
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email || "",
        employee_number: employee.employee_number || "",
        department: employee.department || "",
        position: employee.position || "",
        vacation_days_per_year: employee.vacation_days_per_year,
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        employee_number: "",
        department: "",
        position: "",
        vacation_days_per_year: 21,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = selectedEmployee
        ? `${apiUrl}/api/v1/employees/${selectedEmployee.id}`
        : `${apiUrl}/api/v1/employees/`;
      const method = selectedEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          employee_number: formData.employee_number || null,
          department: formData.department || null,
          position: formData.position || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save employee");
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button onClick={() => openModal()}>
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
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => openModal(emp)}
                  >
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? `${tCommon("edit")} ${t("title").replace("verwaltung", "").replace(" Management", "")}` : t("addEmployee")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t("firstName")}</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">{t("lastName")}</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_number">{t("employeeNumber")}</Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">{t("department")}</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">{t("position")}</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vacation_days">{t("vacationDays")}</Label>
              <Input
                id="vacation_days"
                type="number"
                value={formData.vacation_days_per_year}
                onChange={(e) => setFormData({ ...formData, vacation_days_per_year: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.first_name || !formData.last_name}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
