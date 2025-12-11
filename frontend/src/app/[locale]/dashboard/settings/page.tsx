"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Einstellungen werden hier konfiguriert.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
