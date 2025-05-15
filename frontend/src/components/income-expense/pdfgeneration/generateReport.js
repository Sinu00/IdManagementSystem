import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const COMPANY_NAME = "NAMORA CONTRACTING";
const PRIMARY_COLOR = [0, 102, 204]; // RGB for #0066CC

const configureDocument = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    margins: { top: 20, right: 20, bottom: 20, left: 20 }
  });
  return doc;
};

const addHeader = (doc, title, metadata) => {
  // Header bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
  
  // Company name
  doc.setFontSize(28);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(COMPANY_NAME, doc.internal.pageSize.width/2, 30, { align: 'center' });
  
  // Divider
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(20, 35, doc.internal.pageSize.width - 20, 35);
  
  // Report title
  doc.setFontSize(22);
  doc.setTextColor(51, 51, 51);
  doc.text(title, doc.internal.pageSize.width/2, 45, { align: 'center' });

  // Metadata
  doc.setFontSize(11);
  doc.setTextColor(102, 102, 102);
  metadata.forEach((text, index) => {
    doc.text(text, doc.internal.pageSize.width/2, 55 + (index * 6), { align: 'center' });
  });
};

const addSummarySection = (doc, data) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(20, 70, doc.internal.pageSize.width - 40, 25, 3, 3, 'F');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(12);
  doc.text('Total: ', 30, 85);
  doc.setFontSize(14);
  doc.text(`SAR ${total.toFixed(2)}`, 65, 85);
  doc.setFontSize(12);
  doc.text(`Number of Entries: ${data.length}`, doc.internal.pageSize.width - 30, 85, { align: 'right' });

  return total;
};

const addNoDataMessage = (doc) => {
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, 70, doc.internal.pageSize.width - 40, 30, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "No data available for the selected period",
    doc.internal.pageSize.width/2,
    88,
    { align: 'center' }
  );
};

const getTableConfig = (type) => {
  const commonColumns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Amount (SR)', dataKey: 'amount' }
  ];

  const incomeColumns = [
    ...commonColumns.slice(0, 2),
    { header: 'Iqama Number', dataKey: 'iqama' },
    { header: 'Referred By', dataKey: 'referredBy' },
    commonColumns[2]
  ];

  return {
    columns: type === 'income' ? incomeColumns : commonColumns,
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [240, 240, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 5
    },
    columnStyles: {
      date: { halign: 'center' },
      amount: { halign: 'right', fontStyle: 'bold' },
      iqama: { halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  };
};

const addPageHeaderAndFooter = (doc) => {
  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(COMPANY_NAME, doc.internal.pageSize.width - 20, 10, { align: 'right' });
  doc.text(`Generated: ${format(new Date(), 'dd MMMM yyyy hh:mm a')}`, 20, 10);
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${doc.internal.getNumberOfPages()}`,
    doc.internal.pageSize.width/2,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );
};

const addFooterWithTotal = (doc, total, finalY) => {
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(20, finalY + 5, doc.internal.pageSize.width - 40, 20, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Total Amount: SAR ${total.toFixed(2)}`,
    doc.internal.pageSize.width - 30,
    finalY + 17,
    { align: 'right' }
  );
};

export const generateReport = async (type, data, options) => {
  const {
    dateFilterType,
    startDate,
    endDate,
    specificDate,
    selectedReferredBy
  } = options;

  const doc = configureDocument();

  // Add header with metadata
  const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  const metadata = [
    `Period: ${dateFilterType === 'range' 
      ? `${format(startDate, 'dd MMMM yyyy')} - ${format(endDate, 'dd MMMM yyyy')}`
      : format(specificDate, 'dd MMMM yyyy')}`,
    type === 'income' && selectedReferredBy !== 'all' ? `Referred By: ${selectedReferredBy}` : null
  ].filter(Boolean);
  
  addHeader(doc, title, metadata);

  if (!data || data.length === 0) {
    addNoDataMessage(doc);
  } else {
    const total = addSummarySection(doc, data);

    const tableRows = data.map(item => ({
      date: format(new Date(item.transactionDate), 'dd MMMM yyyy'),
      name: item.name,
      iqama: item.iqamaNumber || '-',
      referredBy: item.referredBy || '-',
      amount: item.amount.toFixed(2)
    }));

    const tableConfig = getTableConfig(type);

    doc.autoTable({
      ...tableConfig,
      body: tableRows,
      startY: 100,
      showHead: 'everyPage',
      didDrawPage: () => addPageHeaderAndFooter(doc),
      margin: { top: 30, bottom: 30, left: 20, right: 20 }
    });

    addFooterWithTotal(doc, total, doc.autoTable.previous.finalY);
  }

  return doc;
}; 