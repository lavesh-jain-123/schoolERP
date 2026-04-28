export const printIDCard = (student) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ID Card - ${student.firstName} ${student.lastName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          /* FORCE COLORS TO PRINT - CRITICAL */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          background: #f5f5f5;
          padding: 20px;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
        }
        
        .card-side {
          width: 350px;
          height: 520px;
          margin: 0 auto 30px;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          background: linear-gradient(135deg, #1C2C56 0%, #2a3f73 100%);
          position: relative;
          page-break-after: always;
          page-break-inside: avoid;
          /* FORCE GRADIENT TO PRINT */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .card-side:last-child {
          page-break-after: auto;
          margin-bottom: 0;
        }
        
        @media print {
          .card-side {
            margin: 0 auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            /* ENSURE BACKGROUND PRINTS */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .card-side:first-child {
            margin-bottom: 0;
          }
        }
        
        /* Header Styles */
        .card-header {
          background: #8fc750 !important;
          padding: 12px;
          text-align: center;
          /* FORCE GREEN HEADER TO PRINT */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .card-header h1 {
          font-size: 18px;
          font-weight: 700;
          color: #1C2C56 !important;
          margin: 0 0 4px 0;
        }
        
        .card-header p {
          font-size: 11px;
          font-weight: 600;
          color: #1C2C56 !important;
          margin: 0;
        }
        
        /* Photo Section */
        .photo-section {
          text-align: center;
          padding: 12px 0;
        }
        
        .photo-frame {
          width: 110px;
          height: 110px;
          border-radius: 10px;
          border: 4px solid #8fc750;
          background: #fff !important;
          margin: 0 auto;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          /* FORCE BORDER COLOR TO PRINT */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .photo-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .photo-placeholder {
          font-size: 40px;
          font-weight: 700;
          color: #1C2C56 !important;
        }
        
        /* Details Section */
        .details-section {
          padding: 0 20px 12px;
        }
        
        .detail-box {
          background: #fff !important;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
          /* FORCE WHITE BACKGROUNDS TO PRINT */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .detail-label {
          font-size: 10px;
          color: #666 !important;
          margin-bottom: 4px;
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .detail-value {
          font-size: 14px;
          font-weight: 700;
          color: #1C2C56 !important;
        }
        
        .detail-value-small {
          font-size: 13px;
          font-weight: 700;
          color: #1C2C56 !important;
        }
        
        .detail-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .detail-row .detail-box {
          flex: 1;
          margin-bottom: 0;
        }
        
        /* Footer */
        .card-footer {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: #8fc750 !important;
          padding: 6px;
          text-align: center;
          /* FORCE FOOTER COLOR TO PRINT */
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .card-footer p {
          font-size: 11px;
          font-weight: 600;
          color: #1C2C56 !important;
          margin: 0;
        }
        
        /* Back Side Specific */
        .contact-info {
          padding: 20px;
        }
        
        .address-text {
          font-size: 12px;
          font-weight: 600;
          color: #1C2C56 !important;
          line-height: 1.4;
          word-break: break-word;
          max-height: 54px;
          overflow: hidden;
        }
        
        .school-contact {
          font-size: 12px;
          font-weight: 600;
          color: #1C2C56 !important;
          line-height: 1.6;
        }
        
        .warning-box {
          text-align: center;
        }
        
        .warning-text {
          font-size: 11px;
          font-weight: 600;
          color: #d32f2f !important;
        }
        
        .signature-box {
          position: absolute;
          bottom: 15px;
          width: 100%;
          padding: 0 20px;
        }
        
        .signature-line {
          font-size: 10px;
          color: #666 !important;
          margin-bottom: 4px;
        }
        
        .signature-label {
          font-size: 11px;
          font-weight: 600;
          color: #1C2C56 !important;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          
          /* ENSURE ALL BACKGROUNDS AND COLORS PRINT */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #1C2C56 !important;
          color: white !important;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 1000;
        }
        
        .print-button:hover {
          background: #2a3f73 !important;
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Print ID Card</button>
      
      <!-- FRONT SIDE -->
      <div class="card-side">
        <!-- Header -->
        <div class="card-header">
          <h1>The Dimension Public School</h1>
          <p>STUDENT IDENTITY CARD</p>
        </div>
        
        <!-- Photo -->
        <div class="photo-section">
          <div class="photo-frame">
            ${student.photo?.url 
              ? `<img src="${student.photo.url}" alt="${student.firstName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                 <div class="photo-placeholder" style="display:none;">${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}</div>`
              : `<div class="photo-placeholder">${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}</div>`
            }
          </div>
        </div>
        
        <!-- Details -->
        <div class="details-section">
          <div class="detail-box">
            <div class="detail-label">Name</div>
            <div class="detail-value">${student.firstName} ${student.lastName}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-box">
              <div class="detail-label">Adm. No</div>
              <div class="detail-value-small">${student.admissionNo}</div>
            </div>
            <div class="detail-box">
              <div class="detail-label">Class</div>
              <div class="detail-value-small">${student.className}-${student.section}</div>
            </div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">Date of Birth</div>
            <div class="detail-value-small">${student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}</div>
          </div>
          
          <div class="detail-row">
            <div class="detail-box">
              <div class="detail-label">Gender</div>
              <div class="detail-value-small">${student.gender || 'N/A'}</div>
            </div>
            <div class="detail-box">
              <div class="detail-label">Roll No</div>
              <div class="detail-value-small">${student.rollNo || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="card-footer">
          <p>Valid Till: 2027</p>
        </div>
      </div>
      
      <!-- BACK SIDE -->
      <div class="card-side">
        <!-- Header -->
        <div class="card-header">
          <h1>IMPORTANT INFORMATION</h1>
        </div>
        
        <!-- Contact Info -->
        <div class="contact-info">
          <div class="detail-box">
            <div class="detail-label">Parent/Guardian Name</div>
            <div class="detail-value-small">${student.parentName || 'N/A'}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">Emergency Contact</div>
            <div class="detail-value-small">${student.parentMobile || 'N/A'}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">Address</div>
            <div class="address-text">${student.address || 'N/A'}</div>
          </div>
          
          <div class="detail-box">
            <div class="detail-label">School Contact</div>
            <div class="school-contact">
              📞 +91 8981015354<br>
              ✉️ thedimensionpublicschool@gmail.com
            </div>
          </div>

           <div class="detail-box warning-box">
            <div class="warning-text"> ✅ Always carry this student ID Card</div>
          </div>
          
          <div class="detail-box warning-box">
            <div class="warning-text">⚠️ If found, please return to school</div>
          </div>
        </div>
        
        <!-- Signature -->
        <div class="signature-box">
          <div class="detail-box" style="text-align: center;">
            <div class="signature-line">______________________</div>
            <div class="signature-label">Principal's Signature</div>
          </div>
        </div>
      </div>
      
      <script>
        // Auto-print on load (optional)
        // window.onload = function() {
        //   window.print();
        // };
        
        // Close window after printing
        window.onafterprint = function() {
          // Uncomment to auto-close after print
          // window.close();
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};