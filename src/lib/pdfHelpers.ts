import jsPDF from "jspdf";
import type { Equipment, EquipmentType } from "@/types/equipment";
import type { StaffUser } from "@/hooks/useStaffUsers";

// Wihuri Agri logo as base64 (compact version for PDF)
// This is a simplified version of the logo suitable for PDF embedding
export const WIHURI_LOGO_BASE64 = `data:image/png;base64,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`;

export interface PDFHeaderOptions {
  title: string;
  selectedModels?: Equipment[];
  equipmentType?: EquipmentType | null;
  generatorName?: string;
  generatorEmail?: string;
}

/**
 * Add a professional header to PDF documents with Wihuri Agri branding
 * and optional generator information
 */
export function addPDFHeader(
  doc: jsPDF,
  pageWidth: number,
  options: PDFHeaderOptions
): number {
  const { title, selectedModels, equipmentType, generatorName, generatorEmail } = options;
  
  // Add logo
  try {
    doc.addImage(WIHURI_LOGO_BASE64, "PNG", 14, 8, 22, 22);
  } catch (e) {
    // If logo fails to load, continue without it
    console.warn("Failed to add logo to PDF:", e);
  }

  // Company name
  doc.setFontSize(14);
  doc.setTextColor(34, 87, 46); // Wihuri green
  doc.text("WIHURI AGRI", 40, 16);

  // Document title
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(title, 40, 23);

  // Date
  const date = new Date().toLocaleDateString("et-EE");
  doc.text(`Kuupäev: ${date}`, 14, 38);

  // Category and models if provided
  let yPos = 38;
  if (equipmentType) {
    doc.text(`Kategooria: ${equipmentType.name_et}`, 14, 44);
    yPos = 44;
  }

  if (selectedModels && selectedModels.length > 0) {
    const modelNames = selectedModels
      .map((m) => `${m.brand?.name} ${m.model_name}`)
      .join(", ");
    doc.text(`Mudelid: ${modelNames}`, 14, yPos + 6, { maxWidth: pageWidth - 90 });
    yPos += 6;
  }

  // Generator info (right aligned)
  if (generatorName || generatorEmail) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    
    if (generatorName) {
      doc.text(`Koostaja: ${generatorName}`, pageWidth - 14, 38, { align: "right" });
    }
    if (generatorEmail) {
      doc.text(`E-post: ${generatorEmail}`, pageWidth - 14, 44, { align: "right" });
    }
  }

  // Return Y position for content to start
  return Math.max(yPos + 12, 55);
}

/**
 * Add footer with page numbers to PDF
 */
export function addPDFFooter(
  doc: jsPDF,
  pageWidth: number,
  pageNum: number,
  totalPages: number
): void {
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Wihuri Agri - Tehnika võrdlus", 14, pageHeight - 10);
  doc.text(`Leht ${pageNum} / ${totalPages}`, pageWidth - 14, pageHeight - 10, {
    align: "right",
  });
}

/**
 * Get staff user info for PDF generation
 */
export function getStaffUserInfo(user: StaffUser | null): { name: string; email: string } {
  if (!user) {
    return { name: "", email: "" };
  }
  return {
    name: user.full_name,
    email: user.email,
  };
}
