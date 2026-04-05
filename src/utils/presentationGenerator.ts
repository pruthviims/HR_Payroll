
import { jsPDF } from 'jspdf';

export const generateProductPresentation = (companyName: string = 'Maruthi Enterprise') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  const addTitle = (text: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Indigo/Blue
    doc.text(text, margin, y);
  };

  const addHeadline = (text: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text(text, margin, y);
  };

  const addBody = (text: string, y: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
    doc.text(splitText, margin, y);
    return y + (splitText.length * 6);
  };

  const addBullet = (text: string, y: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('•', margin, y);
    const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2) - 10);
    doc.text(splitText, margin + 5, y);
    return y + (splitText.length * 6);
  };

  const addMockupBox = (text: string, y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineDash([2, 2], 0);
    doc.rect(margin, y, pageWidth - (margin * 2), 30);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`[Visual Suggestion: ${text}]`, margin + 5, y + 15);
    doc.setLineDash([], 0);
    return y + 40;
  };

  // --- SLIDE 1: TITLE ---
  addTitle(`${companyName} HR & Payroll Portal`, 60);
  addHeadline('Streamlining Workforce Management & Statutory Compliance', 75);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Product Presentation & Demo Guide', margin, 90);
  doc.line(margin, 95, pageWidth - margin, 95);
  
  // --- SLIDE 2: THE VISION ---
  doc.addPage();
  addTitle('Slide 1: The Vision', 30);
  addHeadline('Modernizing Payroll for Principal Employers', 45);
  let y = addBody('A centralized, cloud-native platform designed to bridge the gap between complex statutory requirements and daily HR operations.', 55);
  y = addMockupBox('Screenshot of Login Screen or Main Dashboard with Company Logo', y + 10);

  // --- SLIDE 3: THE PROBLEM ---
  doc.addPage();
  addTitle('Slide 2: The Problem We Solve', 30);
  addHeadline('Beyond Simple Calculations', 45);
  y = 55;
  y = addBullet('Fragmented Data: Managing multiple clients (Principal Employers) in separate spreadsheets.', y);
  y = addBullet('Compliance Risk: Manual errors in PF, ESI, and Professional Tax (PT) calculations.', y + 2);
  y = addBullet('Administrative Burden: Hours spent generating individual payslips and distributing them.', y + 2);
  y = addBullet('Lack of Visibility: No real-time insights into workforce retention or overtime costs.', y + 2);

  // --- SLIDE 4: THE SOLUTION ---
  doc.addPage();
  addTitle('Slide 3: Our Solution', 30);
  addHeadline('An End-to-End Payroll Ecosystem', 45);
  y = addBody('A secure, multi-tenant portal that automates the entire lifecycle—from client onboarding to final payslip distribution.', 55);
  y = addMockupBox('Screenshot of Sidebar Navigation showing logical flow', y + 10);

  // --- SLIDE 5: CLIENT MGMT ---
  doc.addPage();
  addTitle('Slide 4: Multi-Client Management', 30);
  addHeadline('Scale Your Operations Effortlessly', 45);
  y = 55;
  y = addBullet('Manage multiple "Principal Employers" under one roof.', y);
  y = addBullet('Suspend/Activate clients instantly to control operational access.', y + 2);
  y = addBullet('Isolated data environments for each client to ensure privacy and accuracy.', y + 2);
  y = addMockupBox('Screenshot of Client Management Tab showing active/suspended list', y + 10);

  // --- SLIDE 6: IMPORT WIZARD ---
  doc.addPage();
  addTitle('Slide 5: Intelligent Import Wizard', 30);
  addHeadline('From CSV to Payroll in Seconds', 45);
  y = 55;
  y = addBullet('Smart Mapping: Automatically recognizes CSV columns using AI-driven aliases.', y);
  y = addBullet('Validation: Real-time checks for Employee IDs, UAN, and ESI numbers.', y + 2);
  y = addBullet('Core Data Support: Includes Designation, Department, and Bank Details in the flow.', y + 2);
  y = addMockupBox('Screenshot of CSV Mapping Modal showing linked fields', y + 10);

  // --- SLIDE 7: PAYSLIPS ---
  doc.addPage();
  addTitle('Slide 6: Professional Payslips', 30);
  addHeadline('Branding That Inspires Confidence', 45);
  y = 55;
  y = addBullet('Multiple Templates: Choose from Classic, Modern, or Professional styles.', y);
  y = addBullet('Bulk Processing: Generate 100s of payslips in a single PDF or ZIP archive.', y + 2);
  y = addBullet('Automated Naming: Files formatted as Payslip_Name_Month_Year.pdf.', y + 2);
  y = addMockupBox('Screenshot of Payslips Tab grid and a Modern-style preview', y + 10);

  // --- SLIDE 8: COMPLIANCE ---
  doc.addPage();
  addTitle('Slide 7: Statutory Compliance & Insights', 30);
  addHeadline('Data-Driven HR Decisions', 45);
  y = 55;
  y = addBullet('Auto-Compliance: Built-in logic for PF (12%) and ESI (0.75%) deductions.', y);
  y = addBullet('Productivity Tracking: Visual trends for Worked Days and Overtime (OT).', y + 2);
  y = addBullet('Workforce Metrics: Track New Hires vs. Leavers and Retention Rates.', y + 2);
  y = addMockupBox('Screenshot of Payroll Insights Tab charts', y + 10);

  // --- SLIDE 9: CUSTOMIZATION ---
  doc.addPage();
  addTitle('Slide 8: Tailored to Your Business', 30);
  addHeadline('Customization & Scalability', 45);
  y = 55;
  y = addBullet('White-Label Branding: Update portal with your logo, name, and favicon.', y);
  y = addBullet('Flexible Field Configuration: Add custom Earnings/Deductions in minutes.', y + 2);
  y = addBullet('Custom Templates: Request bespoke designs matching corporate stationery.', y + 2);
  y = addBullet('Scalable Architecture: Handles teams from 10 to 10,000+ employees.', y + 2);
  y = addMockupBox('Screenshot of Setup Tab and Import Wizard side-by-side', y + 10);

  // --- SLIDE 10: MARKET FIT ---
  doc.addPage();
  addTitle('Slide 9: Market Fit & Advantage', 30);
  addHeadline('Why We Win', 45);
  y = 55;
  y = addBullet('Speed: Reduces payroll processing time by up to 80%.', y);
  y = addBullet('Accuracy: Eliminates human error in statutory math.', y + 2);
  y = addBullet('Flexibility: Built specifically for the Indian market (PF/ESI/PT ready).', y + 2);

  // --- SLIDE 11: CONCLUSION ---
  doc.addPage();
  addTitle('Conclusion & Demo', 30);
  addHeadline('Ready for the Future of HR?', 45);
  y = addBody('Let\'s walk through a live import and see the system in action.', 55);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You!', margin, 80);

  doc.save('Product_Presentation_Details.pdf');
};
