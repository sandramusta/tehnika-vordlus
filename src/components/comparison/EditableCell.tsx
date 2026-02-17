import { useState, useRef, useEffect, KeyboardEvent, FocusEvent } from "react";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: string;
  cellId: string;
  editingCell: string | null;
  editValue: string;
  onStartEdit: (cellId: string, value: string) => void;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
  inputClassName?: string;
  isLabel?: boolean;
  disabled?: boolean;
}

export function EditableCell({
  value,
  cellId,
  editingCell,
  editValue,
  onStartEdit,
  onValueChange,
  onSave,
  onCancel,
  className,
  inputClassName,
  isLabel = false,
  disabled = false,
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingCell === cellId;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled && !isEditing) {
      onStartEdit(cellId, value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // Small delay to allow click events to fire first
    setTimeout(() => {
      if (editingCell === cellId) {
        onSave();
      }
    }, 100);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => onValueChange(e.target.value.replace(/,/g, "."))}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "w-full min-w-[60px] px-2 py-1 text-sm border border-primary/50 rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary",
          isLabel ? "text-left" : "text-center",
          inputClassName
        )}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        "cursor-pointer hover:bg-primary/10 px-1 py-0.5 rounded transition-colors inline-block min-w-[40px]",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
      title={disabled ? undefined : "Kliki muutmiseks"}
    >
      {value || "—"}
    </span>
  );
}

// Simplified version for displaying formatted values with edit capability
interface EditableValueCellProps {
  displayValue: string;
  rawValue: unknown;
  cellId: string;
  editingCell: string | null;
  editValue: string;
  onStartEdit: (cellId: string, value: string) => void;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function EditableValueCell({
  displayValue,
  rawValue,
  cellId,
  editingCell,
  editValue,
  onStartEdit,
  onValueChange,
  onSave,
  onCancel,
  className,
  children,
  disabled = false,
}: EditableValueCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingCell === cellId;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled && !isEditing) {
      const editableValue = rawValue === null || rawValue === undefined 
        ? "" 
        : String(rawValue);
      onStartEdit(cellId, editableValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (editingCell === cellId) {
        onSave();
      }
    }, 100);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => onValueChange(e.target.value.replace(/,/g, "."))}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full min-w-[60px] px-2 py-1 text-sm text-center border border-primary/50 rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-pointer hover:bg-primary/10 px-1 py-0.5 rounded transition-colors inline-flex flex-col items-center justify-center gap-0.5",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
      title={disabled ? undefined : "Kliki muutmiseks"}
    >
      {children || <span>{displayValue}</span>}
    </div>
  );
}
