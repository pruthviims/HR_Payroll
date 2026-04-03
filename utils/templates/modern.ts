
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmployeeSalaryData, FieldConfig } from '../../types';

export const drawModernPayslip = (doc: jsPDF, employee: EmployeeSalaryData, logo?: string, companyName?: string, fieldConfigs: FieldConfig[] = []) => {
  const primaryColor = [91, 80, 230]; // Indigo
  const secondaryColor = [241, 245, 249]; // Light gray
  const textColor = [30, 41, 59]; // Slate 800
  const mutedTextColor = [100, 116, 139]; // Slate 500

  // Background Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Logo
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 15, 10, 25, 18, undefined, 'FAST');
    } catch (e) {
      console.error("Logo error", e);
    }
  }

  // Company Name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(companyName || 'HR PAYROLL SYSTEM', 45, 18);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('SECURE PAYROLL PORTAL • ENTERPRISE SOLUTIONS', 45, 24);

  // Payslip Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYSLIP', 195, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`${employee.month.toUpperCase()} ${employee.year}`, 195, 24, { align: 'right' });

  // Employee Info Section
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.roundedRect(10, 45, 190, 35, 3, 3, 'F');

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(employee.name.toUpperCase(), 15, 55);
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Employee ID: ${employee.id}`, 15, 60);
  doc.text(`Designation: ${employee.designation || 'Staff'}`, 15, 65);
  doc.text(`Department: ${employee.department || 'Operations'}`, 15, 70);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('PAYMENT DETAILS', 110, 55);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Bank: ${employee.bankName || 'N/A'}`, 110, 60);
  doc.text(`A/C No: ${employee.accountNo || 'N/A'}`, 110, 65);
  doc.text(`UAN: ${employee.uanNo}`, 110, 70);

  // Stats Grid
  const stats = [
    { label: 'WORKED DAYS', value: employee.workedDays.toFixed(1) },
    { label: 'OT HOURS', value: employee.otHours.toFixed(1) },
    { label: 'ESI NO', value: employee.esiNo || 'N/A' },
    { label: 'GROSS SALARY', value: `${employee.fixedGross.toLocaleString()}` }
  ];

  stats.forEach((stat, i) => {
    const x = 15 + (i * 47);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);
    doc.text(stat.value, x, 85);
    doc.setFontSize(7);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(stat.label, x, 89);
  });

  // Earnings & Deductions Table
  const earningsRows: [string, string][] = [];
  const deductionsRows: [string, string][] = [];

  fieldConfigs.forEach(config => {
    const val = (employee as any)[config.key] || 0;
    const formattedVal = val !== 0 ? `${val.toLocaleString(undefined, { minimumFractionDigits: 1 })}` : '-';
    if (config.type === 'earning') earningsRows.push([config.label, formattedVal]);
    else if (config.type === 'deduction') deductionsRows.push([config.label, formattedVal]);
  });

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
    startY: 95,
    margin: { left: 10, right: 10 },
    head: [['EARNINGS', 'AMOUNT (INR)', 'DEDUCTIONS', 'AMOUNT (INR)']],
    body: tableBody,
    theme: 'plain',
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 8,
      cellPadding: 3
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 2, 
      textColor: textColor,
      lineColor: [241, 245, 249],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
      2: { cellWidth: 55 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 40 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Summary Section
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(110, finalY, 90, 30, 'F');

  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Total Earnings', 115, finalY + 8);
  doc.text('Total Deductions', 115, finalY + 14);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`${employee.grossEarnings.toLocaleString()}`, 195, finalY + 8, { align: 'right' });
  doc.text(`${employee.totalDeductions.toLocaleString()}`, 195, finalY + 14, { align: 'right' });

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(115, finalY + 18, 195, finalY + 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('NET PAYABLE', 115, finalY + 25);
  doc.text(`${employee.netSalary.toLocaleString()}`, 195, finalY + 25, { align: 'right' });

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('This is a digitally generated document and does not require a physical signature.', 105, finalY + 40, { align: 'center' });
};
