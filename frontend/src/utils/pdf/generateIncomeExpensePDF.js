import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { format, startOfDay, endOfDay } from 'date-fns';

export const generateIncomeExpensePDF = async ({
  data,
  exportType,
  dateFilterType,
  exportStartDate,
  exportEndDate,
  exportSpecificDate,
  selectedReferredBy,
  companyName = "NAMORA CONTRACTING" // Default company name
}) => {
  try {
    // Create PDF document with slightly larger margins
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    });
    
    // Add decorative header bar
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
    
    // Add company logo or name at the top with better spacing
    doc.setFontSize(28);
    doc.setTextColor(0, 102, 204);
    doc.text(companyName, doc.internal.pageSize.width/2, 30, { align: 'center' });
    
    // Add subtle divider
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(20, 35, doc.internal.pageSize.width - 20, 35);
    
    // Add report title with better styling
    doc.setFontSize(22);
    doc.setTextColor(51, 51, 51);
    doc.text(
      `${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report`,
      doc.internal.pageSize.width/2,
      45,
      { align: 'center' }
    );

    // Add report metadata with improved layout
    doc.setFontSize(11);
    doc.setTextColor(102, 102, 102);
    const reportMetadata = [
      `Period: ${dateFilterType === 'range' 
        ? `${format(exportStartDate, 'dd MMMM yyyy')} - ${format(exportEndDate, 'dd MMMM yyyy')}`
        : format(exportSpecificDate, 'dd MMMM yyyy')}`,
      exportType === 'income' && selectedReferredBy !== 'all' ? `Referred By: ${selectedReferredBy}` : null
    ].filter(Boolean);

    reportMetadata.forEach((text, index) => {
      doc.text(text, doc.internal.pageSize.width/2, 55 + (index * 6), { align: 'center' });
    });

    if (!data || data.length === 0) {
      // Styled "No Data Available" message
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
    } else {
      // Add summary section with improved styling
      const total = data.reduce((sum, item) => sum + item.amount, 0);
      doc.setFillColor(240, 245, 255);
      doc.roundedRect(20, 70, doc.internal.pageSize.width - 40, 25, 3, 3, 'F');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(12);
      doc.text(`Total ${exportType}: `, 30, 85);
      doc.setFontSize(14);
      doc.text(`SAR ${total.toFixed(2)}`, 65, 85);
      doc.setFontSize(12);
      doc.text(`Number of Entries: ${data.length}`, doc.internal.pageSize.width - 30, 85, { align: 'right' });

      // Configure and add table with improved styling
      const tableColumns = exportType === 'income' 
        ? [
            { header: 'Date', dataKey: 'date' },
            { header: 'Name', dataKey: 'name' },
            { header: 'Iqama Number', dataKey: 'iqama' },
            { header: 'Referred By', dataKey: 'referredBy' },
            { header: 'Amount (SR)', dataKey: 'amount' }
          ]
        : [
            { header: 'Date', dataKey: 'date' },
            { header: 'Name', dataKey: 'name' },
            { header: 'Amount (SR)', dataKey: 'amount' }
          ];

      const tableRows = data.map(item => ({
        date: format(new Date(item.createdAt), 'dd MMMM yyyy'),
        name: item.name,
        iqama: item.iqamaNumber || '-',
        referredBy: item.referredBy || '-',
        amount: item.amount.toFixed(2)
      }));

      doc.autoTable({
        columns: tableColumns,
        body: tableRows,
        startY: 100,
        styles: {
          fontSize: 10,
          cellPadding: 4,
          lineColor: [240, 240, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [0, 102, 204],
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
        },
        showHead: 'everyPage',
        didDrawPage: function(data) {
          // Header on every page
          doc.setFillColor(0, 102, 204);
          doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
          
          // Company name in header
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text(
            companyName,
            doc.internal.pageSize.width - 20,
            10,
            { align: 'right' }
          );
          
          // Generation date in header
          doc.text(
            `Generated: ${format(new Date(), 'dd MMMM yyyy hh:mm a')}`,
            20,
            10
          );
          
          // Footer with page numbers
          doc.setFontSize(9);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.width/2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        },
        margin: { top: 30, bottom: 30, left: 20, right: 20 }
      });

      // Add footer with total
      const finalY = doc.autoTable.previous.finalY;
      doc.setFillColor(0, 102, 204);
      doc.roundedRect(20, finalY + 5, doc.internal.pageSize.width - 40, 20, 2, 2, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `Total Amount: SAR ${total.toFixed(2)}`,
        doc.internal.pageSize.width - 30,
        finalY + 17,
        { align: 'right' }
      );
    }

    // Save the PDF
    doc.save(`${exportType}_report_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Error generating PDF: ' + (error.message || 'Unknown error'));
  }
}; 