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

/**
 * Load image as base64 for PDF embedding
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
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
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Cache for loaded logo
let cachedLogo: string | null = null;

/**
 * Preload logo for PDF generation
 */
export async function preloadPDFLogo(): Promise<void> {
  if (!cachedLogo) {
    cachedLogo = await loadImageAsBase64(LOGO_PATH);
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
 * Header includes: logo (left), date (right)
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

  // Add logo (left side)
  if (cachedLogo) {
    try {
      // Logo dimensions - maintain aspect ratio
      const logoWidth = 50;
      const logoHeight = 12;
      doc.addImage(cachedLogo, "PNG", margin, 10, logoWidth, logoHeight);
    } catch (e) {
      console.warn("Failed to add logo to PDF:", e);
    }
  }

  // Add date (right side)
  const dateStr = formatDateEstonian(new Date());
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(dateStr, pageWidth - margin, 18, { align: "right" });

  // Author info (only on first page, left side under header)
  let yPos = 30;
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

  // Return Y position for content to start
  return Math.max(yPos, 32);
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

  // Page number (center bottom)
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`${pageNum} / ${totalPages}`, pageWidth / 2, pageHeight - 8, {
    align: "center",
  });
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
