import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crosshair, Hand } from "lucide-react";

export type ComparisonMode = "auto" | "manual";

interface ComparisonModeSelectorProps {
  mode: ComparisonMode;
  onModeChange: (mode: ComparisonMode) => void;
}

export function ComparisonModeSelector({
  mode,
  onModeChange,
}: ComparisonModeSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {t("comparison.mode")}
      </label>
      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as ComparisonMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="auto" className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 shrink-0" />
            <span>{t("comparison.modeAuto")}</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Hand className="h-4 w-4 shrink-0" />
            <span>{t("comparison.modeManual")}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
