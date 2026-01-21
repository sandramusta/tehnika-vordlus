import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";

interface EditableCellProps {
  value: number | null | undefined;
  onSave: (newValue: number | null) => Promise<void>;
  format?: "number" | "currency" | "decimal";
  isBest?: boolean;
  isJohnDeere?: boolean;
  suffix?: string;
  showJDAdvantage?: boolean;
  isSelectedModel?: boolean;
}

function formatNumber(num: number | null): string {
  if (num === null) return "";
  return new Intl.NumberFormat("et-EE").format(num);
}

function formatCurrency(num: number | null): string {
  if (num === null) return "";
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

function parseNumber(str: string): number | null {
  if (!str || str.trim() === "") return null;
  // Remove thousands separators and replace comma with dot for decimals
  const cleaned = str.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function EditableCell({
  value,
  onSave,
  format = "number",
  isBest = false,
  isJohnDeere = false,
  suffix = "",
  showJDAdvantage = false,
  isSelectedModel = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMissing = value === null || value === undefined;

  // Format value for display
  const displayValue = isMissing
    ? "—"
    : format === "currency"
      ? formatCurrency(value)
      : format === "decimal"
        ? `${value?.toFixed(1)}${suffix}`
        : `${formatNumber(value)}${suffix}`;

  // Start editing
  const handleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value?.toString() ?? "");
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Save changes
  const handleSave = async () => {
    const newValue = parseNumber(editValue);
    
    // Only save if value actually changed
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(newValue);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setIsSaving(false);
      }
    }
    
    setIsEditing(false);
  };

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue("");
    }
  };

  // Handle blur
  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            "w-24 rounded-md border-2 border-primary bg-card px-2 py-1 text-center text-sm font-medium",
            "outline-none ring-2 ring-primary/30",
            "transition-all duration-150"
          )}
          disabled={isSaving}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-md px-2 py-1 transition-all duration-150",
        "hover:bg-primary/10 hover:ring-2 hover:ring-primary/30",
        showSuccess && "bg-success/10 ring-2 ring-success/30",
        isSelectedModel && "bg-primary/5"
      )}
    >
      {isSaving && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
      
      <div className="flex flex-col items-center justify-center gap-0.5">
        <div className="flex items-center gap-1">
          <span
            className={cn(
              isMissing && "text-muted-foreground/40",
              isJohnDeere && !isMissing && "font-semibold"
            )}
          >
            {displayValue}
          </span>
          {isBest && !isMissing && (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
        </div>
        {showJDAdvantage && isJohnDeere && isBest && !isMissing && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            JD eelis
          </span>
        )}
      </div>
      
      {/* Edit hint on hover */}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground/90 px-1.5 py-0.5 text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Kliki muutmiseks
      </span>
    </div>
  );
}
