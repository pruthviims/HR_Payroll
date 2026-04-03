
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmployeeSalaryData, FieldConfig } from '../../types';

export const drawProfessionalPayslip = (doc: jsPDF, employee: EmployeeSalaryData, logo?: string, companyName?: string, fieldConfigs: FieldConfig[] = []) => {
  const darkColor = [33, 37, 41];
  const borderColor = [222, 226, 230];

  // Header Border
  doc.setDrawColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setLineWidth(1);
  doc.line(10, 10, 200, 10);

  // Logo & Company Info
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 10, 15, 20, 15);
    } catch (e) {
      console.error("Logo error", e);
    }
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(companyName || 'HR PAYROLL SYSTEM', 35, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Payroll Management Services', 35, 25);
  doc.text(`Principal Employer: ${employee.principalEmployer}`, 35, 30);

  // Payslip Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SALARY STATEMENT', 200, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${employee.month} ${employee.year}`, 200, 25, { align: 'right' });
  doc.text(`Date: ${employee.displayDate}`, 200, 30, { align: 'right' });

  // Divider
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.2);
  doc.line(10, 35, 200, 35);

  // Employee Details Grid
  const details = [
    ['Employee Name', employee.name, 'Employee ID', employee.id],
    ['Designation', employee.designation || 'N/A', 'Department', employee.department || 'N/A'],
    ['ESI No', employee.esiNo, 'UAN No', employee.uanNo],
    ['Bank Name', employee.bankName || 'N/A', 'Account No', employee.accountNo || 'N/A'],
    ['Worked Days', employee.workedDays.toString(), 'OT Hours', employee.otHours.toString()]
  ];

  autoTable(doc, {
    startY: 40,
    body: details,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 35 },
      3: { cellWidth: 60 }
    }
  });

  // Earnings & Deductions
  const earningsRows = fieldConfigs.filter(f => f.type === 'earning').map(f => [f.label, ((employee as any)[f.key] || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })]);
  const deductionsRows = fieldConfigs.filter(f => f.type === 'deduction').map(f => [f.label, ((employee as any)[f.key] || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })]);

  if (employee.extraEarnings) {
    employee.extraEarnings.forEach(e => {
      earningsRows.push([e.label, e.value.toLocaleString(undefined, { minimumFractionDigits: 1 })]);
    });
  }
  if (employee.extraDeductions) {
    employee.extraDeductions.forEach(d => {
      deductionsRows.push([d.label, d.value.toLocaleString(undefined, { minimumFractionDigits: 1 })]);
    });
  }

  const maxRows = Math.max(earningsRows.length, deductionsRows.length);
  const tableBody = [];
  for (let i = 0; i < maxRows; i++) {
    tableBody.push([
      earningsRows[i]?.[0] || '',
      earningsRows[i]?.[1] || '',
      deductionsRows[i]?.[0] || '',
      deductionsRows[i]?.[1] || ''
    ]);
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [245, 245, 245], textColor: darkColor, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      1: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // Totals
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Earnings:', 10, finalY + 5);
  doc.text(`INR ${employee.grossEarnings.toLocaleString()}`, 60, finalY + 5, { align: 'right' });
  
  doc.text('Total Deductions:', 110, finalY + 5);
  doc.text(`INR ${employee.totalDeductions.toLocaleString()}`, 200, finalY + 5, { align: 'right' });

  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(10, finalY + 10, 190, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('NET SALARY PAYABLE', 15, finalY + 16.5);
  doc.text(`INR ${employee.netSalary.toLocaleString()}`, 195, finalY + 16.5, { align: 'right' });

  // Footer
  doc.setTextColor(100, 116, 139); // Muted slate color
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a digitally generated document and does not require a physical signature.', 105, finalY + 30, { align: 'center' });
};
