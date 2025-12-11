"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Upload, FileSpreadsheet, Loader2, Check, X } from "lucide-react";

interface Project {
  id: number;
  project_number: string | null;
  name: string;
  description: string | null;
  client_name: string | null;
  client_reference: string | null;
  budget_hours: string | null;
  hourly_rate: string | null;
  is_billable: boolean;
  is_active: boolean;
  employee_ids: number[];
}

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    project_number: "",
    name: "",
    description: "",
    client_name: "",
    client_reference: "",
    budget_hours: "",
    hourly_rate: "",
    is_billable: true,
  });

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/projects/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openModal = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        project_number: project.project_number || "",
        name: project.name,
        description: project.description || "",
        client_name: project.client_name || "",
        client_reference: project.client_reference || "",
        budget_hours: project.budget_hours || "",
        hourly_rate: project.hourly_rate || "",
        is_billable: project.is_billable,
      });
    } else {
      setSelectedProject(null);
      setFormData({
        project_number: "",
        name: "",
        description: "",
        client_name: "",
        client_reference: "",
        budget_hours: "",
        hourly_rate: "",
        is_billable: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = selectedProject
        ? `${apiUrl}/api/v1/projects/${selectedProject.id}`
        : `${apiUrl}/api/v1/projects/`;
      const method = selectedProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          project_number: formData.project_number || null,
          description: formData.description || null,
          client_name: formData.client_name || null,
          client_reference: formData.client_reference || null,
          budget_hours: formData.budget_hours ? parseFloat(formData.budget_hours) : null,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save project");
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/projects/import/csv`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Import failed");
      }

      const data = await res.json();
      setImportResult(data);
      fetchProjects();
    } catch (err) {
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: ["Import fehlgeschlagen / Import failed"],
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCSV}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t("importCsv")}
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addProject")}
          </Button>
        </div>
      </div>

      {importResult && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {t("importSuccess")}: {importResult.imported}{" "}
                  {t("importedCount", { count: importResult.imported })
                    .split(" ")
                    .slice(1)
                    .join(" ")}
                </p>
                {importResult.skipped > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {importResult.skipped} übersprungen / skipped
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <ul className="text-sm text-red-500 mt-2">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {t("csvFormat")}
          </CardTitle>
        </CardHeader>
      </Card>

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
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground">
              Noch keine Projekte angelegt. / No projects yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("projectNumber")}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("clientName")}</TableHead>
                  <TableHead className="text-right">{t("budgetHours")}</TableHead>
                  <TableHead className="text-right">{t("hourlyRate")}</TableHead>
                  <TableHead className="text-center">{t("isBillable")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((proj) => (
                  <TableRow
                    key={proj.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => openModal(proj)}
                  >
                    <TableCell className="font-mono">
                      {proj.project_number || "-"}
                    </TableCell>
                    <TableCell className="font-medium">{proj.name}</TableCell>
                    <TableCell>{proj.client_name || "-"}</TableCell>
                    <TableCell className="text-right">
                      {proj.budget_hours ? `${proj.budget_hours}h` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {proj.hourly_rate ? `€${proj.hourly_rate}` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {proj.is_billable ? (
                        <Check className="h-4 w-4 mx-auto text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? `${tCommon("edit")} Projekt` : t("addProject")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_number">{t("projectNumber")}</Label>
                <Input
                  id="project_number"
                  value={formData.project_number}
                  onChange={(e) => setFormData({ ...formData, project_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">{t("clientName")}</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_reference">{t("clientReference")}</Label>
                <Input
                  id="client_reference"
                  value={formData.client_reference}
                  onChange={(e) => setFormData({ ...formData, client_reference: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_hours">{t("budgetHours")}</Label>
                <Input
                  id="budget_hours"
                  type="number"
                  step="0.5"
                  value={formData.budget_hours}
                  onChange={(e) => setFormData({ ...formData, budget_hours: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">{t("hourlyRate")} (€)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_billable"
                checked={formData.is_billable}
                onCheckedChange={(checked) => setFormData({ ...formData, is_billable: checked })}
              />
              <Label htmlFor="is_billable">{t("isBillable")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
