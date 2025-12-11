"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Upload, FileSpreadsheet } from "lucide-react";

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

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
          <Button>
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
                  {t("importSuccess")}: {importResult.imported} {t("importedCount", { count: importResult.imported }).split(" ").slice(1).join(" ")}
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
          <p className="text-muted-foreground">Noch keine Projekte angelegt. / No projects yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
