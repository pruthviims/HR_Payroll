
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmployeeSalaryData, FieldConfig } from '../../types';

export const drawMinimalPayslip = (doc: jsPDF, employee: EmployeeSalaryData, logo?: string, companyName?: string, fieldConfigs: FieldConfig[] = []) => {
  const textColor = [0, 0, 0];
  const mutedColor = [120, 120, 120];

  // Simple Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName || 'HR PAYROLL SYSTEM', 10, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Payslip for ${employee.month} ${employee.year}`, 10, 20);

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 180, 10, 15, 10);
    } catch (err) {
      console.error("Logo error", err);
    }
  }

  doc.setDrawColor(240, 240, 240);
  doc.line(10, 25, 200, 25);

  // Employee Info
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(employee.name, 10, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`ID: ${employee.id} | Dept: ${employee.department || 'N/A'}`, 10, 40);

  // Summary Grid
  const summary = [
    ['Worked Days', employee.workedDays.toString()],
    ['Gross Salary', `INR ${employee.fixedGross.toLocaleString()}`],
    ['Net Payable', `INR ${employee.netSalary.toLocaleString()}`]
  ];

  autoTable(doc, {
    startY: 45,
    body: summary,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { textColor: mutedColor, cellWidth: 30 },
      1: { fontStyle: 'bold', cellWidth: 50 }
    }
  });

  // Earnings & Deductions
  const earnings = fieldConfigs.filter(f => f.type === 'earning').map(f => [f.label, ((employee as any)[f.key] || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })]);
  const deductions = fieldConfigs.filter(f => f.type === 'deduction').map(f => [f.label, ((employee as any)[f.key] || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })]);

  if (employee.extraEarnings) {
    employee.extraEarnings.forEach(e => {
      earnings.push([e.label, e.value.toLocaleString(undefined, { minimumFractionDigits: 1 })]);
    });
  }
  if (employee.extraDeductions) {
    employee.extraDeductions.forEach(d => {
      deductions.push([d.label, d.value.toLocaleString(undefined, { minimumFractionDigits: 1 })]);
    });
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['EARNINGS', 'AMOUNT']],
    body: earnings,
    theme: 'plain',
    headStyles: { textColor: textColor, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, textColor: textColor },
    columnStyles: { 1: { halign: 'right' } },
    margin: { right: 110 }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY - (earnings.length * 7) - 7,
    head: [['DEDUCTIONS', 'AMOUNT']],
    body: deductions,
    theme: 'plain',
    headStyles: { textColor: textColor, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, textColor: textColor },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 110 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.line(10, finalY, 200, finalY);

  doc.setFont('helvetica', 'bold');
  doc.text('NET SALARY:', 140, finalY + 10);
  doc.text(`INR ${employee.netSalary.toLocaleString()}`, 200, finalY + 10, { align: 'right' });
};
