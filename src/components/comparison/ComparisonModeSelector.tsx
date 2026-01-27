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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Võrdlusrežiim
      </label>
      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as ComparisonMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="auto" className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" />
            <span>Automaatne konkureerimine</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Hand className="h-4 w-4" />
            <span>Käsitsi valik</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
