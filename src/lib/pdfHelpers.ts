import jsPDF from "jspdf";
import type { Equipment, EquipmentType } from "@/types/equipment";
import type { StaffUser } from "@/hooks/useStaffUsers";


export interface PDFHeaderOptions {
  title: string;
  selectedModels?: Equipment[];
  equipmentType?: EquipmentType | null;
  generatorName?: string;
  generatorEmail?: string;
}


/**
 * Format date as DD.MM.YYYY
 */
function formatDateEstonian(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Add a header to PDF documents.
 * Header includes: date (right), separator line, author info on first page.
 */
export function addPDFHeader(
  doc: jsPDF,
  pageWidth: number,
  options: PDFHeaderOptions,
  isFirstPage: boolean = true
): number {
  const { generatorName, generatorEmail } = options;
  const margin = 14;
  const headerBottomY = 18;

  // Add date (right side)
  const dateStr = formatDateEstonian(new Date());
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(dateStr, pageWidth - margin, 14, { align: "right" });

  // Draw separator line under header
  doc.setDrawColor(100);
  doc.setLineWidth(0.5);
  doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY);

  // Author info (only on first page, left side under separator)
  let yPos = headerBottomY + 6;
  if (isFirstPage && (generatorName || generatorEmail)) {
    doc.setFontSize(9);
    doc.setTextColor(80);

    if (generatorName) {
      doc.text(`Koostaja: ${generatorName}`, margin, yPos);
      yPos += 5;
    }
    if (generatorEmail) {
      doc.text(`E-post: ${generatorEmail}`, margin, yPos);
      yPos += 5;
    }
    yPos += 3;
  }

  return Math.max(yPos, headerBottomY + 8);
}

/**
 * Add footer with company information and page numbers to PDF
 * Footer format matches the provided reference image
 */
export function addPDFFooter(
  doc: jsPDF,
  pageWidth: number,
  pageNum: number,
  totalPages: number
): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerY = pageHeight - 20;

  // Draw separator line
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // Page number
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, footerY + 4, { align: "right" });
}

/**
 * Check if there is enough vertical space on the current page for content.
 * If not, adds a new page and returns the new Y position.
 * Use this before every standalone table or text section to prevent splitting.
 * 
 * @param doc - jsPDF document
 * @param currentY - Current Y position on the page
 * @param neededHeight - Estimated height needed for the content (in mm)
 * @param orientation - Page orientation for new page (default: current)
 * @param footerMargin - Bottom margin reserved for footer (default: 30)
 * @returns New Y position (same if fits, or reset Y on new page)
 */
export function ensureSpaceForContent(
  doc: jsPDF,
  currentY: number,
  neededHeight: number,
  orientation?: "portrait" | "landscape",
  footerMargin: number = 30
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableSpace = pageHeight - currentY - footerMargin;
  
  if (availableSpace < neededHeight) {
    if (orientation) {
      doc.addPage(orientation);
    } else {
      doc.addPage();
    }
    return 20; // Standard top margin on new page
  }
  return currentY;
}

/**
 * Initialize PDF generation
 */
export async function initializePDFGeneration(): Promise<void> {
  // no-op
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
