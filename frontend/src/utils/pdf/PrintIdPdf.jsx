import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Helper for text formatting
const formatText = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Generate a PDF document for individuals data with company information
 * Supports Arabic text for company name and other fields
 */
export const generateIndividualsPDF = (company, individuals, settings = {}) => {
  // Initialize PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Import standard font for Arabic support
  // We'll use standard font - this works better than external fonts
  
  // Document settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const primaryColor = [0, 123, 255]; // RGB for primary blue
  const secondaryColor = [108, 117, 125]; // RGB for secondary gray
  
  // Draw header with company info
  const addHeader = (pageNum) => {
    // Reset Y position for new page
    let yPos = margin;
    
    // Draw colored header background
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Add logo/title
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.text('ID Management System', margin, yPos + 10);
    
    // Add company info
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(12);
    
    // Use english company name with note about Arabic
    doc.text(`Company: ${company.name || 'N/A'}${company.arabicName ? ' (Arabic name in system)' : ''}`, margin, yPos + 18);
    
    // Add CR and other company identifiers
    doc.setFontSize(10);
    doc.text(`CR: ${company.crNumber || 'N/A'} | GOSI: ${company.gosiNumber || 'N/A'} | MOL: ${company.molNumber || company.makthabNumber || 'N/A'} | Sponsor: ${company.sponserId || 'N/A'}`, margin, yPos + 25);
    
    // Add date
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, margin, yPos + 32);
    
    return 45; // Return new Y position after header
  };
  
  // Prepare data for tables - removed passport number
  const prepareTableData = (individual) => {
    const getStatusText = (expiryDate) => {
      const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        return `Expired (${Math.abs(daysUntilExpiry)} days ago)`;
      } else if (daysUntilExpiry <= 20) {
        return `Warning (${daysUntilExpiry} days left)`;
      } else {
        return `Active (${daysUntilExpiry} days left)`;
      }
    };
    
    // Create a nested table inside a cell - passport number removed
    return [
      [{ content: 'Personal Information', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ['Full Name', formatText(individual.name) || 'N/A'],
      ['Nationality', formatText(individual.nationality) || 'N/A'],
      ['Iqama Number', individual.iqamaNumber || 'N/A'],
      ['Phone Number', individual.phoneNumber || 'N/A'],
      ['Referred By', individual.referredBy || 'N/A'],
      [{ content: 'Status Information', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ['Expiry Date', individual.expiryDate ? format(new Date(individual.expiryDate), 'dd MMM yyyy') : 'N/A'],
      ['Status', getStatusText(individual.expiryDate)],
      ['Profession', formatText(individual.profession) || 'N/A'],
      [{ content: 'Financial Information', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ['Iqama Price', `${individual.iqamaPrice || 0} SAR`],
      ['Total Paid', `${individual.totalPaidAmount || 0} SAR`],
      ['Pending Amount', `${individual.pendingAmount || 0} SAR`],
      ['Payment Status', individual.isFullyPaid ? 'Fully Paid' : 'Pending Payment']
    ];
  };
  
  // Add individuals one by one, each on a new page
  individuals.forEach((individual, index) => {
    // Only add a new page if this is not the first individual
    if (index > 0) {
      doc.addPage();
    }
    
    // Add header to every page
    let yPos = addHeader(index + 1);
    
    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Individual ID Records', margin, yPos);
    yPos += 10;
    
    // Add individual name as subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${formatText(individual.name)}`, margin, yPos);
    yPos += 8;
    
    // Add table with individual details
    doc.autoTable({
      startY: yPos,
      head: [],
      body: prepareTableData(individual),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: contentWidth - 40 }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
    });
    
    // Add footer on each page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${index + 1} of ${individuals.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  });
  
  return doc;
};

/**
 * Print ID PDF for individuals
 * @param {Object} company - Company details
 * @param {Array} individuals - List of individuals
 * @param {Object} options - PDF generation options
 */
const printIdPdf = (company, individuals, options = {}) => {
  try {
    const { filename = 'individuals-report.pdf' } = options;
    
    // Generate PDF document
    const doc = generateIndividualsPDF(company, individuals, options);
    
    // Save the PDF
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export default printIdPdf; 