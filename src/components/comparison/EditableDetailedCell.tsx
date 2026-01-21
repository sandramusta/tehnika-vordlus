import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EditableDetailedCellProps {
  value: unknown;
  equipmentId: string;
  categoryKey: string;
  fieldKey: string;
  currentSpecs: Record<string, Record<string, unknown>> | null;
  onSave: (
    equipmentId: string,
    categoryKey: string,
    fieldKey: string,
    newValue: string | number | boolean | null
  ) => Promise<void>;
  isSelectedModel?: boolean;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Jah" : "Ei";
  if (typeof value === "number") {
    return new Intl.NumberFormat("et-EE").format(value);
  }
  return String(value);
}

function parseValue(str: string, originalValue: unknown): string | number | boolean | null {
  if (!str || str.trim() === "" || str === "—") return null;
  
  const trimmed = str.trim();
  
  // Handle boolean strings
  if (trimmed.toLowerCase() === "jah" || trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "ei" || trimmed.toLowerCase() === "false") return false;
  
  // Try to parse as number if original was a number
  if (typeof originalValue === "number" || /^[\d\s,.-]+$/.test(trimmed)) {
    const cleaned = trimmed.replace(/\s/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  
  // Return as string
  return trimmed;
}

export function EditableDetailedCell({
  value,
  equipmentId,
  categoryKey,
  fieldKey,
  currentSpecs,
  onSave,
  isSelectedModel = false,
}: EditableDetailedCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMissing = value === null || value === undefined;
  const displayValue = formatValue(value);

  // Start editing
  const handleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(isMissing ? "" : (typeof value === "boolean" ? (value ? "Jah" : "Ei") : String(value)));
  }, [value, isMissing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Save changes
  const handleSave = async () => {
    const newValue = parseValue(editValue, value);
    
    // Only save if value actually changed
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(equipmentId, categoryKey, fieldKey, newValue);
      } catch (error) {
        console.error("Failed to save detailed spec:", error);
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
      <td
        className={cn(
          "text-center text-sm px-3 py-2",
          isSelectedModel && "bg-primary/5"
        )}
      >
        <div className="flex items-center justify-center">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={cn(
              "w-full max-w-[120px] bg-transparent px-2 py-1 text-center text-sm",
              "border-none outline-none focus:outline-none focus:ring-0",
              "transition-all duration-150"
            )}
            disabled={isSaving}
          />
        </div>
      </td>
    );
  }

  return (
    <td
      onClick={handleClick}
      className={cn(
        "text-center text-sm px-3 py-2 cursor-pointer transition-colors duration-150",
        "hover:bg-muted/30",
        isSelectedModel && "bg-primary/5",
        isMissing && "text-muted-foreground/40"
      )}
    >
      {isSaving ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : (
        <span>{displayValue}</span>
      )}
    </td>
  );
}
