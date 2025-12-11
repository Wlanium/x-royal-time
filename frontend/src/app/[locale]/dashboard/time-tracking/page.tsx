"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Clock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

interface Project {
  id: number;
  name: string;
  project_number: string | null;
}

interface TimeEntry {
  id: number;
  employee_id: number;
  project_id: number | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  entry_type: string;
  notes: string | null;
}

export default function TimeTrackingPage() {
  const t = useTranslations("timeTracking");
  const tCommon = useTranslations("common");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    project_id: "",
    date: "",
    start_time: "",
    end_time: "",
    break_minutes: "0",
    entry_type: "work",
    notes: "",
  });

  const getWeekDates = (offset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + offset * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(weekOffset);
  const weekStart = weekDates[0].toISOString().split("T")[0];
  const weekEnd = weekDates[6].toISOString().split("T")[0];

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [empRes, projRes, entriesRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/employees/`, { headers }),
        fetch(`${apiUrl}/api/v1/projects/`, { headers }),
        fetch(
          `${apiUrl}/api/v1/time-entries/?date_from=${weekStart}&date_to=${weekEnd}${
            selectedEmployee ? `&employee_id=${selectedEmployee}` : ""
          }`,
          { headers }
        ),
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (entriesRes.ok) setTimeEntries(await entriesRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekOffset, selectedEmployee]);

  const openModal = (entry?: TimeEntry, dateStr?: string) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        employee_id: entry.employee_id.toString(),
        project_id: entry.project_id?.toString() || "",
        date: entry.date,
        start_time: entry.start_time || "",
        end_time: entry.end_time || "",
        break_minutes: entry.break_minutes.toString(),
        entry_type: entry.entry_type,
        notes: entry.notes || "",
      });
    } else {
      setEditingEntry(null);
      setFormData({
        employee_id: selectedEmployee || "",
        project_id: "",
        date: dateStr || new Date().toISOString().split("T")[0],
        start_time: "09:00",
        end_time: "17:00",
        break_minutes: "30",
        entry_type: "work",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = editingEntry
        ? `${apiUrl}/api/v1/time-entries/${editingEntry.id}`
        : `${apiUrl}/api/v1/time-entries/`;
      const method = editingEntry ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: parseInt(formData.employee_id),
          project_id: formData.project_id ? parseInt(formData.project_id) : null,
          date: formData.date,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          break_minutes: parseInt(formData.break_minutes) || 0,
          entry_type: formData.entry_type,
          notes: formData.notes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEntry || !confirm("Wirklich löschen? / Really delete?")) return;

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/v1/time-entries/${editingEntry.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error deleting");
    }
  };

  const calculateHours = (entry: TimeEntry): number => {
    if (!entry.start_time || !entry.end_time) return 0;
    const [sh, sm] = entry.start_time.split(":").map(Number);
    const [eh, em] = entry.end_time.split(":").map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm) - entry.break_minutes;
    return Math.max(0, totalMinutes / 60);
  };

  const getEntriesForDate = (dateStr: string) => {
    return timeEntries.filter((e) => e.date === dateStr);
  };

  const getTotalHoursForDate = (dateStr: string): number => {
    return getEntriesForDate(dateStr).reduce((sum, e) => sum + calculateHours(e), 0);
  };

  const weekTotalHours = weekDates.reduce(
    (sum, d) => sum + getTotalHoursForDate(d.toISOString().split("T")[0]),
    0
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  };

  const getEmployeeName = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : "-";
  };

  const getProjectName = (id: number | null) => {
    if (!id) return "-";
    const proj = projects.find((p) => p.id === id);
    return proj ? proj.name : "-";
  };

  const entryTypeColors: Record<string, string> = {
    work: "bg-blue-500",
    break: "bg-gray-400",
    vacation: "bg-green-500",
    sick: "bg-orange-500",
    holiday: "bg-purple-500",
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alle Mitarbeiter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle Mitarbeiter</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.first_name} {emp.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addEntry")}
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </p>
              <p className="text-sm text-muted-foreground">
                Gesamt: <span className="font-bold">{weekTotalHours.toFixed(1)}h</span>
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Week Timeline */}
      <div className="grid gap-4">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().split("T")[0];
          const entries = getEntriesForDate(dateStr);
          const totalHours = getTotalHoursForDate(dateStr);
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <Card
              key={dateStr}
              className={`${isToday ? "ring-2 ring-primary" : ""} ${
                isWeekend ? "bg-muted/30" : ""
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {/* Date Column */}
                  <div className="w-24 flex-shrink-0 text-center">
                    <p className={`font-semibold ${isToday ? "text-primary" : ""}`}>
                      {formatDate(date)}
                    </p>
                    <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1">
                    {/* Hour scale */}
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
                        <span key={h}>{h}</span>
                      ))}
                    </div>
                    {/* Timeline */}
                    <div className="relative h-8 bg-muted rounded overflow-hidden">
                      {entries.map((entry) => {
                        if (!entry.start_time || !entry.end_time) return null;
                        const [sh, sm] = entry.start_time.split(":").map(Number);
                        const [eh, em] = entry.end_time.split(":").map(Number);
                        const startPercent = ((sh * 60 + sm - 360) / (16 * 60)) * 100;
                        const endPercent = ((eh * 60 + em - 360) / (16 * 60)) * 100;
                        const width = endPercent - startPercent;

                        return (
                          <div
                            key={entry.id}
                            className={`absolute h-full ${entryTypeColors[entry.entry_type]} opacity-80 hover:opacity-100 cursor-pointer transition-opacity`}
                            style={{
                              left: `${Math.max(0, startPercent)}%`,
                              width: `${Math.min(100 - startPercent, width)}%`,
                            }}
                            onClick={() => openModal(entry)}
                            title={`${entry.start_time} - ${entry.end_time} (${calculateHours(entry).toFixed(1)}h)`}
                          />
                        );
                      })}
                    </div>

                    {/* Entry list */}
                    {entries.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1"
                            onClick={() => openModal(entry)}
                          >
                            <div className={`w-2 h-2 rounded-full ${entryTypeColors[entry.entry_type]}`} />
                            <span className="font-mono text-xs">
                              {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}
                            </span>
                            <span className="text-muted-foreground">
                              {getEmployeeName(entry.employee_id)}
                            </span>
                            <span className="text-muted-foreground">
                              {getProjectName(entry.project_id)}
                            </span>
                            <span className="ml-auto font-medium">
                              {calculateHours(entry).toFixed(1)}h
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {entries.length === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => openModal(undefined, dateStr)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Eintrag hinzufügen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {editingEntry ? `${tCommon("edit")} Zeiteintrag` : t("addEntry")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("date")}</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("type")}</Label>
                <Select
                  value={formData.entry_type}
                  onValueChange={(v) => setFormData({ ...formData, entry_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">{t("types.work")}</SelectItem>
                    <SelectItem value="break">{t("types.break")}</SelectItem>
                    <SelectItem value="vacation">{t("types.vacation")}</SelectItem>
                    <SelectItem value="sick">{t("types.sick")}</SelectItem>
                    <SelectItem value="holiday">{t("types.holiday")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mitarbeiter *</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(v) => setFormData({ ...formData, employee_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("project")}</Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData({ ...formData, project_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("noProject")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noProject")}</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id.toString()}>
                      {proj.project_number && `[${proj.project_number}] `}
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("startTime")}</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("endTime")}</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("breakMinutes")}</Label>
                <Input
                  type="number"
                  value={formData.break_minutes}
                  onChange={(e) => setFormData({ ...formData, break_minutes: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {editingEntry && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {tCommon("delete")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.employee_id}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon("save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
