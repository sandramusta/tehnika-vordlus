import jsPDF from "jspdf";
import type { Equipment, EquipmentType } from "@/types/equipment";
import type { StaffUser } from "@/hooks/useStaffUsers";

// Logo path for PDF (public folder)
const LOGO_PATH = "/images/wihuri-agri-logo-horizontal.png";

// Company contact info for footer
const COMPANY_INFO = {
  name: "WIHURI OÜ",
  address: "Tehnika 9, Türi vald, Järvamaa\n72213",
  regNr: "Reg. Nr: 14866275",
  vatNr: "KMKR Nr: EE102238673",
  bank: "SEB Pank: EE1010220283192220",
};

export interface PDFHeaderOptions {
  title: string;
  selectedModels?: Equipment[];
  equipmentType?: EquipmentType | null;
  generatorName?: string;
  generatorEmail?: string;
}

// Cache for loaded logo with dimensions
let cachedLogo: { base64: string; width: number; height: number } | null = null;

/**
 * Load image as base64 for PDF embedding with original dimensions
 */
async function loadImageWithDimensions(url: string): Promise<{ base64: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({
          base64: canvas.toDataURL("image/png"),
          width: img.width,
          height: img.height,
        });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Preload logo for PDF generation
 */
export async function preloadPDFLogo(): Promise<void> {
  if (!cachedLogo) {
    cachedLogo = await loadImageWithDimensions(LOGO_PATH);
  }
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
 * Add a professional header to PDF documents with Wihuri Agri branding
 * Header includes: logo (left), date (right), separator line
 * Author info is added separately only on first page
 */
export function addPDFHeader(
  doc: jsPDF,
  pageWidth: number,
  options: PDFHeaderOptions,
  isFirstPage: boolean = true
): number {
  const { generatorName, generatorEmail } = options;
  const margin = 14;
  let headerBottomY = 22;

  // Add logo (left side) - maintain aspect ratio
  if (cachedLogo) {
    try {
      // Calculate dimensions maintaining aspect ratio
      // Target height of 12mm for better visibility, calculate width proportionally
      const targetHeight = 12;
      const aspectRatio = cachedLogo.width / cachedLogo.height;
      const logoWidth = targetHeight * aspectRatio;
      const logoHeight = targetHeight;
      
      doc.addImage(cachedLogo.base64, "PNG", margin, 10, logoWidth, logoHeight);
      headerBottomY = 10 + logoHeight + 4;
    } catch (e) {
      console.warn("Failed to add logo to PDF:", e);
    }
  }

  // Add date (right side)
  const dateStr = formatDateEstonian(new Date());
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(dateStr, pageWidth - margin, 14, { align: "right" });

  // Draw separator line under header
  doc.setDrawColor(34, 87, 46); // Wihuri green
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

  // Return Y position for content to start (with some padding)
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

  // Footer content - two columns
  doc.setFontSize(8);
  doc.setTextColor(120);

  // Left column - Company name and address
  doc.text(COMPANY_INFO.name, margin, footerY);
  doc.text("Tehnika 9, Türi vald, Järvamaa", margin, footerY + 4);
  doc.text("72213", margin, footerY + 8);

  // Right column - Registration info
  const rightCol = pageWidth / 2;
  doc.text(COMPANY_INFO.regNr, rightCol, footerY);
  doc.text(COMPANY_INFO.vatNr, rightCol, footerY + 4);
  doc.text(COMPANY_INFO.bank, rightCol, footerY + 8);

  // Page number (right edge, under bank info)
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, footerY + 12, { align: "right" });
}

/**
 * Initialize PDF with logo preloading
 * Call this before generating PDF
 */
export async function initializePDFGeneration(): Promise<void> {
  await preloadPDFLogo();
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
