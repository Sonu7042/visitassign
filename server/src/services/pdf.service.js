const PDFDocument = require('pdfkit');

// Renders a printable visitor badge (with embedded QR code) to a PDF buffer.
const generatePassPdfBuffer = ({ organizationName, visitor, host, appointment, pass, qrBuffer }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [300, 460], margin: 20 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').text(organizationName || 'Visitor Pass System', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#555').text('VISITOR PASS', { align: 'center' });
    doc.fillColor('#000');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text(`Pass No: ${pass.passNumber}`);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Visitor: ${visitor.fullName}`);
    doc.text(`Company: ${visitor.company || '-'}`);
    doc.text(`Host: ${host.name}`);
    doc.text(`Purpose: ${appointment.purpose}`);
    doc.text(`Visit Date: ${new Date(appointment.visitDate).toLocaleDateString()}`);
    doc.text(
      `Valid: ${new Date(appointment.expectedCheckIn).toLocaleTimeString()} - ${new Date(
        appointment.expectedCheckOut
      ).toLocaleTimeString()}`
    );

    doc.moveDown();
    if (qrBuffer) {
      doc.image(qrBuffer, (doc.page.width - 200) / 2, doc.y, { fit: [200, 200] });
      doc.moveDown(14);
    }

    doc.fontSize(8).fillColor('#777').text('Please carry this pass during your visit.', { align: 'center' });

    doc.end();
  });

module.exports = { generatePassPdfBuffer };
