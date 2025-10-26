const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Try to load a font that supports Arabic glyphs. We'll check a few common locations
// and register the first one we find. This keeps deployments flexible.
const findArabicFontPath = () => {
   const candidates = [
      // Project-bundled fonts (recommended)
      path.join(__dirname, '../assets/fonts/NotoSansArabic-Regular.ttf'),
      path.join(process.cwd(), 'assets/fonts/NotoSansArabic-Regular.ttf'),
      // Windows common fonts with Arabic support
      'C:/Windows/Fonts/Tahoma.ttf',
      'C:/Windows/Fonts/Arial.ttf',
      'C:/Windows/Fonts/arial.ttf'
   ];
   for (const p of candidates) {
      try {
         if (fs.existsSync(p)) return p;
      } catch (_) {
         // ignore
      }
   }
   return null;
};

// Simple check for Arabic characters
const hasArabic = (text = '') => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(String(text));

/**
 * Generate Points Adjustment PDF Report
 * @param {Object} data - Report data
 * @param {Object} data.member - Member details
 * @param {Object} data.adjustment - Adjustment details
 * @param {Object} data.hotel - Hotel details
 * @returns {PDFDocument} PDF document stream
 */
const generatePointsAdjustmentPDF = (data) => {
  const { member, adjustment, hotel } = data;

   // Create a new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: 'Loyalty Points Adjustment Report',
      Author: hotel?.name || 'Hotel Management System',
      Subject: 'Points Adjustment',
      Keywords: 'loyalty, points, adjustment'
    }
  });

      // Consistent vertical spacing between sections (slightly larger to breathe)
      const sectionGap = 26; // px

   // Attempt to register an Arabic-capable font if available
      const arabicFontPath = findArabicFontPath();
   if (arabicFontPath) {
      try { doc.registerFont('Arabic', arabicFontPath); } catch (_) { /* noop */ }
   }

   // Helper to render text with automatic Arabic fallback and RTL alignment
   const writeText = (str, x, y, opts = {}) => {
      const s = str == null ? '' : String(str);
      if (hasArabic(s) && arabicFontPath) {
         const o = { ...opts };
         // If width provided, right-align Arabic inside the box for readability
         if (o.width && !o.align) o.align = 'right';
         doc.font('Arabic');
         return doc.text(s, x, y, o);
      }
         // Keep current font (do not override bold etc.) for non-Arabic text
         return doc.text(s, x, y, opts);
   };

      // Layout helpers available throughout the document
      const leftMargin = doc.page.margins.left;
      const rightMargin = doc.page.margins.right;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - leftMargin - rightMargin;

     // Header with hotel name
  doc.fontSize(18)
        .font('Helvetica-Bold');
     writeText(hotel?.name || 'Hotel Management System', leftMargin, undefined, { align: 'center', width: contentWidth });
   doc
     .fontSize(12)
     .font('Helvetica')
         .text('Loyalty Points Adjustment Report', leftMargin, undefined, { align: 'center', width: contentWidth })
     .moveDown(0.3);

  // Add a horizontal line
  doc.moveTo(50, doc.y)
     .lineTo(550, doc.y)
     .stroke()
     .moveDown(0.5);

  // Report Details
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .text('Report Date: ', { continued: true })
     .font('Helvetica')
     .text(new Date().toLocaleString('en-US', {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     }))
     .moveDown(0.3);

  doc.font('Helvetica-Bold')
     .text('Adjustment Type: ', { continued: true })
     .font('Helvetica')
     .fillColor('#000000')
     .text(adjustment.type === 'add' ? 'POINTS ADDED' : 'POINTS DEDUCTED')
     .fillColor('#000000')
     .moveDown(1.2);

  // Guest Information Section
  doc.fontSize(12)
     .font('Helvetica-Bold');
  writeText('Guest Information', leftMargin, undefined, { align: 'center', width: contentWidth });
  doc.moveDown(0.4);

   // Draw a centered box for guest info - remove colors
     const guestBoxWidth = Math.min(420, contentWidth);
     const guestBoxX = leftMargin + (contentWidth - guestBoxWidth) / 2;
     const guestBoxY = doc.y;

     const guestBoxHeight = 110;
     doc.rect(guestBoxX, guestBoxY, guestBoxWidth, guestBoxHeight)
        .stroke('#000000');
     const textX = guestBoxX + 12;
     doc.fillColor('#000000')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Name:', textX, guestBoxY + 12, { continued: true })
        .font('Helvetica')
        .text(`  ${member.guestName}`, { width: guestBoxWidth - 24 });

     doc.font('Helvetica-Bold')
        .text('Email:', textX, guestBoxY + 30, { continued: true })
        .font('Helvetica')
        .text(`  ${member.email}`, { width: guestBoxWidth - 24 });

     doc.font('Helvetica-Bold')
        .text('Phone:', textX, guestBoxY + 48, { continued: true })
        .font('Helvetica')
        .text(`  ${member.phone || 'N/A'}`, { width: guestBoxWidth - 24 });

     doc.font('Helvetica-Bold')
        .text('Member Since:', textX, guestBoxY + 66, { continued: true })
        .font('Helvetica')
        .text(`  ${member.joinDate ? new Date(member.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}`, { width: guestBoxWidth - 24 });

     // Current tier - make text always black
     doc.font('Helvetica-Bold')
        .text('Current Tier:', textX, guestBoxY + 84, { continued: true })
        .font('Helvetica')
        .fillColor('#000000')
        .text(`  ${String(member.currentTier || '').toUpperCase() || 'N/A'}`, { width: guestBoxWidth - 24 })
        .fillColor('#000000');

   // Place the cursor just below the guest box with a tidy gap
   doc.y = guestBoxY + guestBoxHeight + sectionGap;

   // Membership Statistics (centered header)
   doc.fontSize(14)
       .font('Helvetica-Bold')
      .text('Membership Statistics', leftMargin, undefined, { align: 'center', width: contentWidth })
      .moveDown(0.6);

   const statsBoxY = doc.y;
  const statsGap = 20;
   const statsBoxWidth = Math.floor((contentWidth - statsGap) / 2);
  const leftBoxX = leftMargin;
  const rightBoxX = leftMargin + statsBoxWidth + statsGap;

  // Draw boxes (no fill, only border)
   const statsBoxHeight = 65;
   doc.rect(leftBoxX, statsBoxY, statsBoxWidth, statsBoxHeight).stroke('#000000');
   doc.rect(rightBoxX, statsBoxY, statsBoxWidth, statsBoxHeight).stroke('#000000');

  // Left box content
  doc.fillColor('#000000')
     .fontSize(9)
     .font('Helvetica-Bold')
     .text('Total Nights Stayed', leftBoxX + 10, statsBoxY + 12, { width: statsBoxWidth - 20, align: 'center' })
     .fontSize(20)
     .text(member.totalNights?.toString() || '0', leftBoxX + 10, statsBoxY + 30, { width: statsBoxWidth - 20, align: 'center' });

  // Right box content
  doc.fontSize(9)
     .text('Lifetime Spending', rightBoxX + 10, statsBoxY + 12, { width: statsBoxWidth - 20, align: 'center' })
     .fontSize(20)
     .text(`$${(member.lifetimeSpend || 0).toFixed(2)}`, rightBoxX + 10, statsBoxY + 30, { width: statsBoxWidth - 20, align: 'center' });

   // Move to just below the stats boxes with consistent spacing
   doc.y = statsBoxY + statsBoxHeight + sectionGap;

  // Points Adjustment Details Section - centered header
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Points Adjustment Details', leftMargin, undefined, { align: 'center', width: contentWidth })
     .moveDown(0.6);

   const adjustBoxWidth = Math.min(420, contentWidth);
  const adjustBoxX = leftMargin + (contentWidth - adjustBoxWidth) / 2;
  const adjustBoxY = doc.y;

  // Remove colors - use simple border
   const adjustBoxHeight = 130;
   doc.rect(adjustBoxX, adjustBoxY, adjustBoxWidth, adjustBoxHeight)
     .stroke('#000000');

  const adjustTextX = adjustBoxX + 12;
  doc.fillColor('#000000')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('Previous Points Balance:', adjustTextX, adjustBoxY + 10, { continued: true })
     .font('Helvetica')
     .fontSize(11)
     .text(`  ${adjustment.previousPoints.toLocaleString()} points`, { width: adjustBoxWidth - 24 });

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Points Adjusted:', adjustTextX, adjustBoxY + 32, { continued: true })
     .font('Helvetica')
     .fontSize(11)
     .text(`  ${adjustment.type === 'add' ? '+' : '-'}${adjustment.amount.toLocaleString()} points`, { width: adjustBoxWidth - 24 });

  doc.fillColor('#000000')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('New Points Balance:', adjustTextX, adjustBoxY + 54, { continued: true })
     .font('Helvetica-Bold')
     .fontSize(12)
     .text(`  ${adjustment.newPoints.toLocaleString()} points`, { width: adjustBoxWidth - 24 });

  doc.fillColor('#000000')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('Reason for Adjustment:', adjustTextX, adjustBoxY + 78, { width: adjustBoxWidth - 24 });

   doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#000000');
   writeText(adjustment.reason || 'No reason provided', adjustTextX, adjustBoxY + 94, {
      width: adjustBoxWidth - 24,
      align: 'left'
   });

   // Calculate dynamic footer/signature position with extra space for signing
   // Add moderate spacing below the details box
   const currentY = adjustBoxY + adjustBoxHeight + sectionGap + 12;

   // Signature lines - anchor near bottom while respecting content above
   const sigY = Math.max(currentY, doc.page.height - doc.page.margins.bottom - 120);
   const sigWidth = Math.min(220, Math.floor((contentWidth - 60) / 2));
   const sigLeftX = leftMargin + 10;
   const sigRightX = pageWidth - rightMargin - sigWidth - 10;

  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Supervisor Signature', sigLeftX, sigY, { width: sigWidth, align: 'left' });

  doc.moveTo(sigLeftX, sigY + 20)
     .lineTo(sigLeftX + sigWidth, sigY + 20)
     .stroke();

   doc.text('Cashier Signature', sigRightX, sigY, { width: sigWidth, align: 'left' });

  doc.moveTo(sigRightX, sigY + 20)
     .lineTo(sigRightX + sigWidth, sigY + 20)
     .stroke();

   const footerY = Math.min(sigY + 70, doc.page.height - doc.page.margins.bottom - 10);

  // Footer
  doc.fontSize(7)
     .font('Helvetica')
     .fillColor('#6b7280')
     .text('This is an automated report generated by the Hotel Loyalty Management System.', 50, footerY, {
       align: 'center',
       width: 495
     })
     .text('For questions or concerns, please contact your hotel administrator.', {
       align: 'center',
       width: 495
     });

  // Add page number
  doc.text(`Page 1 of 1`, 50, footerY + 25, {
    align: 'right',
    width: 495
  });

  return doc;
};

/**
 * Get color based on tier
 */
const getTierColor = (tier) => {
  const colors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2'
  };
  return colors[tier.toLowerCase()] || '#000000';
};

module.exports = {
  generatePointsAdjustmentPDF
};
