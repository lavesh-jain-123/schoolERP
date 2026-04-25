/**
 * Opens a printable fee receipt in a new browser tab.
 * Single-page A4 layout with 3-column info grid.
 */
export function openReceipt({ student, payment, schoolInfo = {} }) {
  const school = {
    name: 'The Dimension Public School',
    address: 'f/x-12, Rabindra Sarani, Zarda Bagan, Jyangra, West Bengal Kolkata-700059',
    phone: '+91 8981015354',
    email: 'thedimensionpublicschool@gmail.com',
    logoText: 'TDPS',
    logoUrl: `${window.location.origin}/logo.jpeg`,
    ...schoolInfo,
  };

  

  const studentData = payment.student && typeof payment.student === 'object'
    ? { ...student, ...payment.student }
    : student;

  const html = buildReceiptHTML({ student: studentData, payment, school });

  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function buildReceiptHTML({ student, payment, school }) {
  const today = new Date(payment.paymentDate || Date.now());
  const formattedDate = today.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const formattedTime = today.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const amount = Number(payment.amount || 0);
  const amountWords = numberToWords(amount);
  const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Fee Receipt - ${payment.receiptNo || ''}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    background: #eef1f6;
    padding: 15px;
    color: #1a1a1a;
    font-size: 12px;
  }
  .receipt {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    border: 2px solid #1C2C56;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(0,0,0,0.08);
  }

  /* Header */
  .header {
    background: linear-gradient(135deg, #1C2C56 0%, #2a3f73 100%);
    color: #fff;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
 .logo {
  width: 54px; height: 54px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  flex-shrink: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 800;
  color: #1C2C56;
}
.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
  .school-info h1 { font-size: 20px; margin-bottom: 2px; letter-spacing: 0.3px; }
  .school-info p { font-size: 11px; opacity: 0.92; line-height: 1.4; }

  /* Title bar */
  .title-bar {
    background: #f5f6fa;
    padding: 9px 20px;
    border-bottom: 1px solid #e1e4ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title-bar h2 {
    color: #1C2C56;
    font-size: 15px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .title-bar .receipt-no {
    background: #8fc750;
    color: #1C2C56;
    padding: 4px 12px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 700;
  }

  /* Body */
  .body { padding: 16px 20px; }

  /* Meta row (date / academic year / month) as 3 columns */
  .meta-strip {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    padding: 10px 14px;
    background: #f5f6fa;
    border-radius: 5px;
    margin-bottom: 14px;
  }
  .meta-item .k { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-item .v { font-size: 12px; color: #1a1a1a; font-weight: 600; margin-top: 1px; }

  /* Sections */
  .section { margin-bottom: 14px; }
  .section-title {
    font-size: 11px;
    color: #8fc750;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 7px;
    padding-bottom: 4px;
    border-bottom: 2px solid #1C2C56;
  }

  /* 3-column info grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px 18px;
  }
  .info-item {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }
  .info-item .k { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
  .info-item .v { font-size: 12px; color: #1a1a1a; font-weight: 600; margin-top: 1px; word-wrap: break-word; }
  .info-item.full { grid-column: 1 / -1; }

  /* Payment table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
  }
  thead th {
    background: #1C2C56;
    color: #fff;
    padding: 7px 10px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tbody td {
    padding: 8px 10px;
    border-bottom: 1px solid #e1e4ed;
    font-size: 12px;
  }
  tbody tr:last-child td { border-bottom: none; }
  .amount-col { text-align: right; font-weight: 600; }
  .total-row { background: #f5f6fa; font-weight: 700; }
  .total-row td { color: #1C2C56; font-size: 13px; }

  .amount-words {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f5f6fa;
    border-left: 3px solid #8fc750;
    font-size: 11px;
    font-style: italic;
    color: #333;
  }

  /* SMS badge */
  .sms-badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .sms-sent { background: #d4edda; color: #155724; }
  .sms-failed { background: #f8d7da; color: #721c24; }
  .sms-pending { background: #fff3cd; color: #856404; }
  .sms-notsent { background: #e2e3e5; color: #383d41; }

  /* Footer */
  .footer {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 2px dashed #d8dce5;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .notes { font-size: 10px; color: #6b7280; line-height: 1.5; max-width: 55%; }
  .notes strong { color: #1C2C56; }
  .signature { text-align: center; min-width: 150px; }
  .signature .line {
    border-top: 1px solid #1a1a1a;
    margin-bottom: 4px;
    padding-top: 22px;
  }
  .signature .caption {
    font-size: 10px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .thankyou {
    text-align: center;
    margin-top: 10px;
    padding: 7px;
    background: #f5f6fa;
    font-size: 10px;
    color: #6b7280;
    border-radius: 3px;
  }

  /* Action bar (hidden in print) */
  .actions {
    max-width: 800px;
    margin: 14px auto 0;
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  .btn {
    padding: 9px 20px;
    border: none;
    border-radius: 5px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-primary { background: #1C2C56; color: #fff; }
  .btn-primary:hover { background: #2a3f73; }
  .btn-secondary { background: #8fc750; color: #1C2C56; }
  .btn-secondary:hover { background: #7fb53f; }

  /* Print-specific */
  @media print {
    body { background: #fff; padding: 0; font-size: 11px; }
    .receipt {
      border: 2px solid #1C2C56;
      box-shadow: none;
      border-radius: 0;
      max-width: 100%;
    }
    .actions { display: none !important; }
    @page { margin: 10mm; size: A4; }
    /* Prevent page breaks inside sections */
    .section, .footer, .header, .title-bar { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="receipt">
  <!-- Header -->
  <div class="header">
 <div class="logo">
  ${school.logoUrl
    ? `<img src="${escapeHtml(school.logoUrl)}" alt="logo" />`
    : escapeHtml(school.logoText)}
</div>
    <div class="school-info">
      <h1>${escapeHtml(school.name)}</h1>
      <p>${escapeHtml(school.address)}</p>
      <p>Phone: ${escapeHtml(school.phone)} &nbsp;|&nbsp; Email: ${escapeHtml(school.email)}</p>
    </div>
  </div>

  <!-- Title bar -->
  <div class="title-bar">
    <h2>Fee Payment Receipt</h2>
    <span class="receipt-no">${escapeHtml(payment.receiptNo || '—')}</span>
  </div>

  <!-- Body -->
  <div class="body">
    <!-- Meta strip -->
    <div class="meta-strip">
      <div class="meta-item">
        <div class="k">Date of Payment</div>
        <div class="v">${formattedDate} at ${formattedTime}</div>
      </div>
      <div class="meta-item">
        <div class="k">Academic Year</div>
        <div class="v">${escapeHtml(payment.academicYear || '—')}</div>
      </div>
      <div class="meta-item">
        <div class="k">Fee Month</div>
        <div class="v">${escapeHtml(payment.month || '—')}</div>
      </div>
    </div>

    <!-- Student Info (3 columns) -->
    <div class="section">
      <div class="section-title">Student Information</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="k">Student Name</span>
          <span class="v">${escapeHtml(studentName || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Admission No</span>
          <span class="v">${escapeHtml(student.admissionNo || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Class / Section</span>
          <span class="v">${escapeHtml(student.className || '—')} - ${escapeHtml(student.section || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Roll No</span>
          <span class="v">${escapeHtml(student.rollNo || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Gender</span>
          <span class="v">${escapeHtml(student.gender || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Status</span>
          <span class="v">${escapeHtml(student.status || '—')}</span>
        </div>
      </div>
    </div>

    <!-- Parent Info (3 columns) -->
    <div class="section">
      <div class="section-title">Parent / Guardian Information</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="k">Parent Name</span>
          <span class="v">${escapeHtml(student.parentName || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Mobile</span>
          <span class="v">${escapeHtml(student.parentMobile || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Email</span>
          <span class="v">${escapeHtml(student.parentEmail || '—')}</span>
        </div>
        <div class="info-item full">
          <span class="k">Address</span>
          <span class="v">${escapeHtml(student.address || '—')}</span>
        </div>
      </div>
    </div>

    <!-- Payment Details -->
    <div class="section">
      <div class="section-title">Payment Details</div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">#</th>
            <th>Fee Description</th>
            <th style="width: 22%;" class="amount-col">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <strong>${escapeHtml(payment.feeType || 'Fee')}</strong>
              ${payment.month ? `<span style="font-size:11px;color:#6b7280;"> — For ${escapeHtml(payment.month)}</span>` : ''}
            </td>
            <td class="amount-col">₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2" style="text-align:right;">TOTAL PAID</td>
            <td class="amount-col">₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
      <div class="amount-words">
        <strong>In Words:</strong> Rupees ${amountWords} Only
      </div>
    </div>

    <!-- Transaction Details (3 columns) -->
    <div class="section">
      <div class="section-title">Transaction Details</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="k">Payment Mode</span>
          <span class="v">${escapeHtml(payment.paymentMode || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Transaction / Cheque No</span>
          <span class="v">${escapeHtml(payment.transactionId || '—')}</span>
        </div>
        <div class="info-item">
          <span class="k">Collected By</span>
          <span class="v">${escapeHtml(payment.collectedBy || 'Admin')}</span>
        </div>
        <div class="info-item">
          <span class="k">SMS to Parent</span>
          <span class="v">
            <span class="sms-badge sms-${(payment.smsStatus || 'pending').toLowerCase().replace(/\s+/g, '')}">
              ${escapeHtml(payment.smsStatus || 'Pending')}
            </span>
          </span>
        </div>
        ${payment.remarks ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="k">Remarks</span>
          <span class="v">${escapeHtml(payment.remarks)}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="notes">
        <strong>Notes:</strong>
        Computer-generated receipt — no signature required.
        Please retain for your records. Fees once paid are non-refundable.
      </div>
      <div class="signature">
        <div class="line"></div>
        <div class="caption">Authorised Signatory</div>
      </div>
    </div>

    <div class="thankyou">
      Thank you for your payment! For any queries, contact the school office.
    </div>
  </div>
</div>

<!-- Action buttons (hidden on print) -->
<div class="actions">
  <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
  <button class="btn btn-secondary" onclick="window.close()">Close</button>
</div>

<script>
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 500);
  });
</script>

</body>
</html>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = inWords(rupees);
  if (paise > 0) result += ' and ' + inWords(paise) + ' Paise';
  return result;
}