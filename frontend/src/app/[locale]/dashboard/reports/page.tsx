"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const t = useTranslations("nav");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("reports")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Berichte werden hier angezeigt.</p>
        </CardContent>
      </Card>
    </div>
  );
}
