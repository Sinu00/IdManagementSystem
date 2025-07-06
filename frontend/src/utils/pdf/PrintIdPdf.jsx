import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import NotoSansArabicRegular from './ArabicFont.js';
import i18n from '../../i18n';

// Helper for text formatting
const formatText = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Helper to detect if text contains Arabic characters
const containsArabic = (text) => {
  if (!text || typeof text !== 'string') return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u1EE00-\u1EEFF]/;
  return arabicRegex.test(text);
};

// Helper to handle Arabic text display
const getDisplayText = (text) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return i18n.t('common.na');
  }
  return text;
};

// Setup Arabic font in jsPDF
const setupArabicFont = (doc) => {
  try {
    if (!NotoSansArabicRegular || NotoSansArabicRegular.length === 0) {
      return false;
    }
    
    doc.addFileToVFS('NotoSansArabic-Regular.ttf', NotoSansArabicRegular);
    doc.addFont('NotoSansArabic-Regular.ttf', 'NotoSansArabic', 'normal');
    
    return true;
  } catch (error) {
    return false;
  }
};

// Helper to set appropriate font based on content
const setFontForUserData = (doc, text, style = 'normal', size = 12) => {
  if (containsArabic(text)) {
    try {
      doc.setFont('NotoSansArabic', style);
    } catch (error) {
      doc.setFont('helvetica', style);
    }
  } else {
    doc.setFont('helvetica', style);
  }
  doc.setFontSize(size);
};

// Helper to set font for interface labels based on current language
const setFontForLabels = (doc, style = 'normal', size = 12) => {
  const currentLang = i18n.language;
  if (currentLang === 'ar') {
    try {
      doc.setFont('NotoSansArabic', style);
    } catch (error) {
      doc.setFont('helvetica', style);
    }
  } else {
    doc.setFont('helvetica', style);
  }
  doc.setFontSize(size);
};

/**
 * Generate a PDF document for individuals data with company information
 * Supports Arabic text display with custom font
 */
export const generateIndividualsPDF = (company, individuals) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const arabicFontAvailable = setupArabicFont(doc);
  
  // Document settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const primaryColor = [0, 123, 255];
  const secondaryColor = [108, 117, 125];
  
  // Draw header with company info
  const addHeader = () => {
    let yPos = margin;
    
    // Draw colored header background
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Handle Arabic company name - render label and name separately
    const companyName = company.name || i18n.t('common.na');
    const companyLabel = i18n.t('company.name') + ': ';
    
    // Add logo/title
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.text(companyLabel, margin, yPos + 18);
    
    // Add company info
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    // Calculate position for company name after the label
    const labelWidth = doc.getTextWidth(companyLabel);
    
    // Render company name with appropriate font for user data
    const companyDisplayText = getDisplayText(companyName);
    setFontForUserData(doc, companyDisplayText, 'normal', 12);
    doc.text(companyDisplayText, margin + labelWidth, yPos + 18);
    
    // Add CR and other company identifiers
    const crInfo = `${i18n.t('company.cr')}: ${company.crNumber || i18n.t('common.na')} | ${i18n.t('company.gosi')}: ${company.gosiNumber || i18n.t('common.na')}`;
    const molInfo = `${i18n.t('company.mol')}: ${company.molNumber || company.makthabNumber || i18n.t('common.na')} | ${i18n.t('company.sponsor')}: ${company.sponserId || i18n.t('common.na')}`;
    setFontForLabels(doc, 'normal', 10);
    doc.text(crInfo + ' | ' + molInfo, margin, yPos + 25);
    
    // Add date
    const dateText = `${i18n.t('common.generated')}: ${format(new Date(), 'dd MMM yyyy')}`;
    setFontForLabels(doc, 'normal', 10);
    doc.text(dateText, margin, yPos + 37);
    
    return 60;
  };
  
  // Prepare data for tables
  const prepareTableData = (individual) => {
    const getStatusText = (expiryDate) => {
      const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        return `${i18n.t('pdf.expired')} (${Math.abs(daysUntilExpiry)} ${i18n.t('pdf.daysAgo')})`;
      } else if (daysUntilExpiry <= 20) {
        return `${i18n.t('pdf.warning')} (${daysUntilExpiry} ${i18n.t('pdf.daysLeft')})`;
      } else {
        return `${i18n.t('pdf.active')} (${daysUntilExpiry} ${i18n.t('pdf.daysLeft')})`;
      }
    };
    
    return [
      [{ content: i18n.t('pdf.personalInformation'), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      [i18n.t('pdf.fullName'), getDisplayText(individual.name)],
      [i18n.t('pdf.nationality'), getDisplayText(individual.nationality)],
      [i18n.t('pdf.iqamaNumber'), individual.iqamaNumber || i18n.t('common.na')],
      [i18n.t('pdf.phoneNumber'), individual.phoneNumber || i18n.t('common.na')],
      [i18n.t('pdf.referredBy'), getDisplayText(individual.referredBy)],
      [{ content: i18n.t('pdf.statusInformation'), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      [i18n.t('pdf.expiryDate'), individual.expiryDate ? format(new Date(individual.expiryDate), 'dd MMM yyyy') : i18n.t('common.na')],
      [i18n.t('pdf.status'), getStatusText(individual.expiryDate)],
      [i18n.t('pdf.profession'), getDisplayText(individual.profession)],
      [{ content: i18n.t('pdf.financialInformation'), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      [i18n.t('pdf.iqamaPrice'), `${individual.iqamaPrice || 0} ${i18n.t('pdf.currency')}`],
      [i18n.t('pdf.totalPaid'), `${individual.totalPaidAmount || 0} ${i18n.t('pdf.currency')}`],
      [i18n.t('pdf.pendingAmount'), `${individual.pendingAmount || 0} ${i18n.t('pdf.currency')}`],
      [i18n.t('pdf.paymentStatus'), individual.isFullyPaid ? i18n.t('pdf.fullyPaid') : i18n.t('pdf.pendingPayment')]
    ];
  };

  // Helper to set font for table cells
  const setTableCellFont = (doc, cellText, isHeaderRow, isLabelColumn) => {
    if (isHeaderRow || isLabelColumn) {
      // For header cells and label column, use interface language font
      const currentLang = i18n.language;
      if (currentLang === 'ar' && arabicFontAvailable) {
        doc.setFont('NotoSansArabic', 'normal');
      } else {
        doc.setFont('helvetica', 'normal');
      }
    } else {
      // For data column, use font based on content
      if (containsArabic(cellText) && arabicFontAvailable) {
        doc.setFont('NotoSansArabic', 'normal');
      } else {
        doc.setFont('helvetica', 'normal');
      }
    }
  };
  
  // Add individuals one by one, each on a new page
  individuals.forEach((individual, index) => {
    if (index > 0) {
      doc.addPage();
      if (arabicFontAvailable) {
        setupArabicFont(doc);
      }
    }
    
    let yPos = addHeader();
    
    // Document Title
    doc.setTextColor(0, 0, 0);
    const titleText = i18n.t('pdf.individualIdRecords');
    setFontForLabels(doc, 'bold', 14);
    doc.text(titleText, margin, yPos);
    yPos += 10;
    
    // Add individual name as subtitle - render number and name separately
    const individualName = individual.name || i18n.t('common.na');
    
    // Render number with default font
    doc.setTextColor(0, 0, 0);
    const numberLabel = `${index + 1}. `;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(numberLabel, margin, yPos);
    
    // Calculate position for individual name after the number
    const numberWidth = doc.getTextWidth(numberLabel);
    
    // Render individual name with appropriate font for user data
    const individualDisplayText = getDisplayText(individualName);
    setFontForUserData(doc, individualDisplayText, 'bold', 12);
    doc.text(individualDisplayText, margin + numberWidth, yPos);
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
        font: 'helvetica'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: contentWidth - 40 }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      willDrawCell: function(data) {
        const cellText = data.cell.raw ? data.cell.raw.toString() : '';
        const isHeaderRow = data.row.index === 0 || data.cell.styles.fillColor;
        const isLabelColumn = data.column.index === 0;
        
        setTableCellFont(data.doc, cellText, isHeaderRow, isLabelColumn);
      },
      didParseCell: function(data) {
        const cellText = data.cell.raw ? data.cell.raw.toString() : '';
        const isHeaderRow = data.row.index === 0 || data.cell.styles.fillColor;
        const isLabelColumn = data.column.index === 0;
        
        if (isHeaderRow || isLabelColumn) {
          const currentLang = i18n.language;
          if (currentLang === 'ar' && arabicFontAvailable) {
            data.cell.styles.font = 'NotoSansArabic';
          }
        } else {
          if (containsArabic(cellText) && arabicFontAvailable) {
            data.cell.styles.font = 'NotoSansArabic';
          }
        }
      }
    });
    
    // Add footer on each page
    doc.setTextColor(100, 100, 100);
    const footerText = `${i18n.t('pdf.page')} ${index + 1} ${i18n.t('pdf.of')} ${individuals.length}`;
    setFontForLabels(doc, 'normal', 8);
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
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
    if (!company || !individuals || individuals.length === 0) {
      return false;
    }
    
    const { filename = 'individuals-report.pdf' } = options;
    const doc = generateIndividualsPDF(company, individuals);
    
    doc.save(filename);
    return true;
  } catch (error) {
    return false;
  }
};

export default printIdPdf; 