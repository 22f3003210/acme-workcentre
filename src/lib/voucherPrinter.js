import { acmeLogoBase64 } from "./logoBase64";

// Utility for printing Expense Vouchers (4 per A4 sheet in Landscape)

export function numberToWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return "Zero Rupees Only";
  }

  const num = Math.floor(Math.abs(Number(amount)));
  const paise = Math.round((Math.abs(Number(amount)) - num) * 100);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertTwoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
  }

  function convertThreeDigits(n) {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
    }
    const remainder = n % 100;
    if (remainder > 0) {
      str += convertTwoDigits(remainder);
    }
    return str.trim();
  }

  let words = "";
  let crore = Math.floor(num / 10000000);
  let lakh = Math.floor((num % 10000000) / 100000);
  let thousand = Math.floor((num % 100000) / 1000);
  let hundred = num % 1000;

  if (crore > 0) words += convertTwoDigits(crore) + " Crore ";
  if (lakh > 0) words += convertTwoDigits(lakh) + " Lakh ";
  if (thousand > 0) words += convertTwoDigits(thousand) + " Thousand ";
  if (hundred > 0) words += convertThreeDigits(hundred);

  words = words.trim();
  if (!words) words = "Zero";

  let result = words + " Rupees";
  if (paise > 0) {
    result += " and " + convertTwoDigits(paise) + " Paise";
  }
  return result + " Only";
}

export function formatVoucherHtml(vouchers = []) {
  // Chunk vouchers into groups of 4 (each group is 1 A4 Landscape page)
  const pages = [];
  for (let i = 0; i < vouchers.length; i += 4) {
    pages.push(vouchers.slice(i, i + 4));
  }

  const renderSingleVoucher = (v) => {
    if (!v) {
      // Empty placeholder voucher box to preserve 2x2 grid balance
      return `<div class="voucher-box placeholder"></div>`;
    }

    const dateStr = v.date || v.expenseDate || v.submittedDate || new Date().toISOString().split("T")[0];
    const consultantName = v.employeeName || v.consultantName || "Consultant";
    const category = v.category || "Expense";
    const title = v.reason || v.description || v.title || "Field Expense";
    const comments = v.comments || v.notes || v.description || "Official Consultant Expense";
    const amountNum = Number(v.amount || 0);
    const amountWords = numberToWords(amountNum);
    const paymentMode = v.paymentMode || (v.category === "Travel" || v.category === "Food" ? "UPI / CASH" : "UPI / CASH");
    const paidBy = v.paidBy || consultantName;

    return `
      <div class="voucher-box">
        <div class="voucher-header">
          <div class="header-content">
            <img src="${acmeLogoBase64}" alt="ACME Logo" class="voucher-logo" />
            <span class="voucher-title">Expense Voucher - ${dateStr}</span>
          </div>
        </div>
        <div class="voucher-details">
          ${consultantName} - ${category} - ${title} - ${comments}
        </div>
        <table class="voucher-table">
          <tr>
            <td class="col-label words-label">Amount (in words)</td>
            <td class="col-val words-val" colspan="3">${amountWords}</td>
          </tr>
          <tr>
            <td class="col-label amt-label">Amount :</td>
            <td class="col-val amt-val">₹ ${amountNum.toFixed(2)}</td>
            <td class="col-label mode-label">Payment Mode:</td>
            <td class="col-val mode-val">${paymentMode}</td>
          </tr>
        </table>
        
        <div class="voucher-spacer"></div>

        <div class="voucher-footer">
          <div class="footer-col left">
            <span class="sign-label">Paid by: ${paidBy}</span>
            <div class="sign-line"></div>
          </div>
          <div class="footer-col right">
            <span class="sign-label">Authorised Signature</span>
            <div class="sign-line"></div>
          </div>
        </div>
      </div>
    `;
  };

  const pagesHtml = pages.map((pageVouchers, pIdx) => {
    // Fill up to 4 items per page
    const fourItems = [...pageVouchers];
    while (fourItems.length < 4) {
      fourItems.push(null);
    }

    return `
      <div class="print-page">
        ${fourItems.map(v => renderSingleVoucher(v)).join("")}
      </div>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ACME Expense Vouchers - Print</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      -webkit-font-smoothing: antialiased;
    }
    .print-page {
      width: 100%;
      height: 190mm;
      max-height: 190mm;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 7mm 10mm;
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
      padding: 0;
    }
    .print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .voucher-box {
      border: 2px solid #000000;
      height: 90mm;
      max-height: 90mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      background: #ffffff;
      overflow: hidden;
    }
    .voucher-box.placeholder {
      border: 1px dashed #cccccc;
      visibility: hidden;
    }
    .voucher-header {
      padding: 4px 8px;
      border-bottom: 1.5px solid #000000;
      background: #ffffff;
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .voucher-logo {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 1px solid #e2e8f0;
    }
    .voucher-title {
      font-size: 12.5pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    .voucher-details {
      padding: 6px 8px;
      font-size: 9.5pt;
      font-weight: 600;
      border-bottom: 1.5px solid #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }
    .voucher-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .voucher-table td {
      border: 1.5px solid #000000;
      padding: 4.5px 8px;
      vertical-align: middle;
      line-height: 1.2;
    }
    .col-label {
      font-weight: 600;
      white-space: nowrap;
    }
    .words-label {
      width: 25%;
    }
    .words-val {
      width: 75%;
      font-weight: 600;
      font-size: 9pt;
      text-transform: capitalize;
    }
    .amt-label {
      width: 15%;
      font-weight: bold;
    }
    .amt-val {
      width: 35%;
      font-weight: bold;
      font-size: 10.5pt;
    }
    .mode-label {
      width: 25%;
      font-weight: 600;
    }
    .mode-val {
      width: 25%;
      font-weight: bold;
      text-align: center;
    }
    .voucher-spacer {
      flex-grow: 1;
      min-height: 16px;
    }
    .voucher-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 4px 14px 8px 14px;
      font-size: 9.5pt;
      font-weight: 600;
    }
    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .footer-col.left {
      align-items: flex-start;
    }
    .footer-col.right {
      align-items: flex-end;
    }
    .sign-label {
      font-size: 9.5pt;
      font-weight: 600;
    }
    .sign-line {
      width: 130px;
      height: 1px;
      border-bottom: 1px dotted #000000;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>
  `;
}

export function printVouchers(vouchers = []) {
  if (!vouchers || vouchers.length === 0) {
    alert("No expense vouchers selected to print.");
    return;
  }

  const htmlContent = formatVoucherHtml(vouchers);

  // Use hidden iframe to trigger seamless print without altering host page
  let iframe = document.getElementById("voucher-print-iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "voucher-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow || iframe.contentDocument;
  const doc = iframe.contentDocument || iframe.contentWindow.document;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Trigger print after iframe renders
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error("Print iframe error:", err);
      // Fallback: open in new window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  }, 400);
}
