import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EditableLabelCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
}

export function EditableLabelCell({
  value,
  onSave,
  className,
}: EditableLabelCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start editing
  const handleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value);
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
    const trimmedValue = editValue.trim();
    
    // Only save if value actually changed
    if (trimmedValue && trimmedValue !== value) {
      setIsSaving(true);
      try {
        await onSave(trimmedValue);
      } catch (error) {
        console.error("Failed to save label:", error);
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
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "w-full bg-transparent px-0 py-0 text-sm text-muted-foreground",
          "border-none outline-none focus:outline-none focus:ring-0",
          "transition-all duration-150",
          className
        )}
        disabled={isSaving}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer transition-colors duration-150",
        "hover:text-foreground",
        className
      )}
    >
      {isSaving && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        </div>
      )}
      <span className={cn(isSaving && "opacity-0")}>{value}</span>
    </div>
  );
}
