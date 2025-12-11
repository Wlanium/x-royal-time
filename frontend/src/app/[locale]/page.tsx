"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const t = useTranslations();
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {t("common.appName")}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Personalverwaltung & Zeiterfassung
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push("/login")}
          >
            {t("auth.login")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => router.push("/register")}
          >
            {t("auth.register")}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
