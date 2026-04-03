
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import { EmployeeSalaryData, FieldConfig, PayslipTemplateId } from '../types';

// Helper to draw a professional payslip on a jsPDF instance
const drawPayslipOnDoc = (
  doc: jsPDF,
  emp: EmployeeSalaryData,
  logo?: string,
  companyName?: string,
  _fieldConfigs: FieldConfig[] = [],
  templateId: PayslipTemplateId = PayslipTemplateId.CLASSIC
) => {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  let currentY = 15;

  // --- TEMPLATE CONFIGURATION ---
  const colors = {
    [PayslipTemplateId.CLASSIC]: { primary: [30, 30, 30], secondary: [245, 245, 245], text: [50, 50, 50], accent: [0, 0, 0] },
    [PayslipTemplateId.MODERN]: { primary: [79, 70, 229], secondary: [249, 250, 251], text: [31, 41, 55], accent: [99, 102, 241] },
    [PayslipTemplateId.PROFESSIONAL]: { primary: [30, 58, 138], secondary: [239, 246, 255], text: [30, 41, 59], accent: [37, 99, 235] },
    [PayslipTemplateId.MINIMAL]: { primary: [0, 0, 0], secondary: [255, 255, 255], text: [0, 0, 0], accent: [100, 100, 100] }
  };
  const theme = colors[templateId] || colors[PayslipTemplateId.CLASSIC];

  // --- HEADER SECTION ---
  if (templateId === PayslipTemplateId.MODERN || templateId === PayslipTemplateId.PROFESSIONAL) {
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    currentY = 10;
  } else if (templateId === PayslipTemplateId.MINIMAL) {
    doc.setTextColor(0, 0, 0);
    currentY = 20;
  }

  // Logo
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, currentY - 5, 25, 20);
    } catch (e) {
      console.error("Error adding logo to PDF", e);
    }
  }

  // Company Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(templateId === PayslipTemplateId.MINIMAL ? 18 : 16);
  doc.text(companyName || 'MARUTHI HR SOLUTION', logo ? margin + 30 : margin, currentY + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(templateId === PayslipTemplateId.MINIMAL ? 10 : 9);
  doc.text('Professional Payroll Management Services', logo ? margin + 30 : margin, currentY + 8);
  doc.text(`Principal Employer: ${emp.principalEmployer || 'N/A'}`, logo ? margin + 30 : margin, currentY + 14);

  // Statement Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(templateId === PayslipTemplateId.MINIMAL ? 18 : 12);
  doc.text('SALARY STATEMENT', pageWidth - margin, currentY + 2, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Period: ${emp.month} ${emp.year}`, pageWidth - margin, currentY + 8, { align: 'right' });
  doc.text(`Date: ${emp.displayDate || new Date().toLocaleDateString()}`, pageWidth - margin, currentY + 14, { align: 'right' });

  if (templateId === PayslipTemplateId.MODERN || templateId === PayslipTemplateId.PROFESSIONAL) {
    currentY = 50;
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
  } else if (templateId === PayslipTemplateId.MINIMAL) {
    currentY = 60;
  } else {
    currentY += 25;
    doc.setLineWidth(0.5);
    doc.setDrawColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
  }

  // --- EMPLOYEE DETAILS SECTION ---
  doc.setFontSize(9);
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 5;
  const labelOffset = 35;

  const drawDetail = (label: string, value: string | number, x: number, y: number) => {
    doc.setFont('helvetica', 'normal');
    if (templateId === PayslipTemplateId.MINIMAL) {
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setTextColor(100, 100, 100);
    }
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
    doc.text(templateId === PayslipTemplateId.MINIMAL ? ` ${value || 'N/A'}` : `: ${value || 'N/A'}`, x + labelOffset, y);
  };

  if (templateId === PayslipTemplateId.MODERN) {
    doc.setFillColor(theme.secondary[0], theme.secondary[1], theme.secondary[2]);
    doc.roundedRect(margin, currentY - 5, pageWidth - margin * 2, 45, 3, 3, 'F');
  }

  drawDetail('Employee Name', emp.name, leftColX, currentY);
  drawDetail('Employee ID', emp.id, rightColX, currentY);
  currentY += 7;
  drawDetail('Designation', emp.grade || 'N/A', leftColX, currentY);
  drawDetail('Department', 'N/A', rightColX, currentY);
  currentY += 7;
  drawDetail('ESI No', emp.esiNo, leftColX, currentY);
  drawDetail('UAN No', emp.uanNo, rightColX, currentY);
  currentY += 7;
  drawDetail('Bank Name', 'N/A', leftColX, currentY);
  drawDetail('Account No', 'N/A', rightColX, currentY);
  currentY += 7;
  drawDetail('Worked Days', emp.workedDays, leftColX, currentY);
  drawDetail('OT Hours', emp.otHours, rightColX, currentY);

  currentY += 15;

  const formatCurrency = (val: any) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // --- EARNINGS & DEDUCTIONS TABLE ---
  const tableData = templateId === PayslipTemplateId.MINIMAL ? [
    ['FIXED GROSS', `INR ${formatCurrency(emp.fixedGross)}`, 'ESI @0.75%', `INR ${formatCurrency(emp.esiDeduction)}`],
    ['BASIC & DA', `INR ${formatCurrency(emp.basicDA)}`, 'PF @ 12%', `INR ${formatCurrency(emp.pfDeduction)}`],
    ['BONUS', `INR ${formatCurrency(emp.bonus)}`, 'PT', `INR ${formatCurrency(emp.ptDeduction)}`],
    ['OT AMOUNT', `INR ${formatCurrency(emp.otAmount)}`, 'LWF', `INR ${formatCurrency(emp.lwfDeduction)}`],
    ['', '', 'CANTEEN', `INR ${formatCurrency(emp.canteenDeduction)}`],
    ['', '', 'ADVANCE', `INR ${formatCurrency(emp.advance)}`],
  ] : [
    ['BASIC + DA', formatCurrency(emp.basicDA), 'ESI DEDUCTION', formatCurrency(emp.esiDeduction)],
    ['BONUS', formatCurrency(emp.bonus), 'PF DEDUCTION', formatCurrency(emp.pfDeduction)],
    ['OT AMOUNT', formatCurrency(emp.otAmount), 'PROF. TAX', formatCurrency(emp.ptDeduction)],
    ['ARREARS', formatCurrency(emp.arrears), 'LWF', formatCurrency(emp.lwfDeduction)],
    ['ATTENDANCE BONUS', formatCurrency(emp.attendanceBonus), 'CANTEEN', formatCurrency(emp.canteenDeduction)],
    ['', '', 'ADVANCE', formatCurrency(emp.advance)],
    ['', '', 'OTHER DEDUCTION', formatCurrency(emp.otherDeduction)],
  ];

  const tableTheme = 'grid';
  const headFill = templateId === PayslipTemplateId.MINIMAL ? [255, 255, 255] : theme.secondary;

  (doc as any).autoTable({
    startY: currentY,
    head: [['EARNINGS', 'AMOUNT', 'DEDUCTIONS', 'AMOUNT']],
    body: tableData,
    theme: tableTheme,
    headStyles: { 
      fillColor: headFill, 
      textColor: theme.text, 
      fontStyle: 'bold', 
      halign: 'left',
      lineWidth: templateId === PayslipTemplateId.MINIMAL ? 0.1 : 0
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { halign: 'right', cellWidth: 30 },
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4, 
      textColor: theme.text,
      lineColor: templateId === PayslipTemplateId.MINIMAL ? [200, 200, 200] : [0, 0, 0]
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- TOTALS SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
  
  if (templateId === PayslipTemplateId.MINIMAL) {
    doc.text(`TOTAL EARNINGS:`, margin, currentY);
    doc.text(`INR ${formatCurrency(emp.grossEarnings)}`, margin + 50, currentY);

    doc.text(`TOTAL DEDUCTIONS:`, pageWidth / 2 + 5, currentY);
    doc.text(`INR ${formatCurrency(emp.totalDeductions)}`, pageWidth - margin, currentY, { align: 'right' });
    
    currentY += 15;
    doc.setFontSize(14);
    doc.text('NET SALARY PAYABLE', margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`INR ${formatCurrency(emp.netSalary)}`, margin + 60, currentY);
  } else {
    doc.text(`Total Earnings:`, margin, currentY);
    doc.text(`INR ${formatCurrency(emp.grossEarnings)}`, margin + 40, currentY);

    doc.text(`Total Deductions:`, pageWidth / 2 + 5, currentY);
    doc.text(`INR ${formatCurrency(emp.totalDeductions)}`, pageWidth - margin, currentY, { align: 'right' });

    currentY += 10;

    // --- NET SALARY SECTION ---
    doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.rect(margin, currentY, pageWidth - margin * 2, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('NET SALARY PAYABLE', margin + 5, currentY + 8);
    doc.text(`INR ${formatCurrency(emp.netSalary)}`, pageWidth - margin - 5, currentY + 8, { align: 'right' });
  }

  // --- FOOTER SECTION ---
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const footerText = 'This is a digitally generated document and does not require a physical signature.';
  doc.text(footerText, pageWidth / 2, pageWidth > 250 ? 280 : 285, { align: 'center' });
};

export const generateSinglePayslip = (
  emp: EmployeeSalaryData, 
  logo?: string, 
  companyName?: string, 
  fieldConfigs: FieldConfig[] = [], 
  download: boolean = true,
  templateId: PayslipTemplateId = PayslipTemplateId.CLASSIC
) => {
  const doc = new jsPDF();
  drawPayslipOnDoc(doc, emp, logo, companyName, fieldConfigs, templateId);
  
  if (download) {
    doc.save(`Payslip_${emp.name}_${emp.month}_${emp.year}.pdf`);
  }
  
  return doc;
};

export const generateBulkPayslips = (
  employees: EmployeeSalaryData[], 
  logo?: string, 
  companyName?: string, 
  fieldConfigs: FieldConfig[] = [],
  templateId: PayslipTemplateId = PayslipTemplateId.CLASSIC
) => {
  const doc = new jsPDF();
  
  employees.forEach((emp, index) => {
    if (index > 0) doc.addPage();
    drawPayslipOnDoc(doc, emp, logo, companyName, fieldConfigs, templateId);
  });
  
  doc.save(`Bulk_Payslips_${new Date().getTime()}.pdf`);
};

export const generateIndividualZippedPayslips = async (
  employees: EmployeeSalaryData[], 
  logo?: string, 
  companyName?: string, 
  fieldConfigs: FieldConfig[] = [],
  templateId: PayslipTemplateId = PayslipTemplateId.CLASSIC
) => {
  const zip = new JSZip();
  
  for (const emp of employees) {
    const doc = generateSinglePayslip(emp, logo, companyName, fieldConfigs, false, templateId);
    const pdfBlob = doc.output('blob');
    zip.file(`Payslip_${emp.name}_${emp.id}.pdf`, pdfBlob);
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `Payslips_Archive_${new Date().getTime()}.zip`;
  link.click();
};
