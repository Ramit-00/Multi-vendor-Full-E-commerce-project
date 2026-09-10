const prisma = require('../config/prisma');

class InvoiceService {
  /**
   * Fetch complete order data for invoice generation
   */
  async getInvoiceData(orderId, userId = null, sellerId = null) {
    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        shippingAddress: true,
        orderItems: {
          include: {
            product: { select: { id: true, name: true, sku: true, price: true } },
            seller: { select: { id: true, storeName: true } },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new Error('Order not found for invoice generation');
    }

    // Access control: only customer who placed order or participating seller/admin
    if (userId && order.userId !== String(userId)) {
      throw new Error('Unauthorized access to invoice');
    }
    if (sellerId && !order.orderItems.some(it => it.sellerId === String(sellerId))) {
      throw new Error('Unauthorized access to seller invoice');
    }

    return order;
  }

  /**
   * Render a clean, professional, print-ready HTML invoice
   */
  renderInvoiceHtml(order) {
    const items = order.orderItems || [];
    const user = order.user || {};
    const addr = order.shippingAddress || {};
    const payment = order.payment || {};
    const invoiceNum = `INV-${order.id.substring(0, 8).toUpperCase()}`;
    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const itemsRows = items.map((it, idx) => {
      const pName = it.product?.name || 'Product Item';
      const pSku = it.product?.sku || 'N/A';
      const uPrice = Number(it.unitPrice || 0).toFixed(2);
      const subtotal = Number(it.subtotal || (it.unitPrice * it.quantity)).toFixed(2);
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 12px; font-weight: 600; color: #1e293b;">
            ${pName}
            <div style="font-size: 11px; color: #94a3b8; font-weight: normal;">SKU: ${pSku}</div>
          </td>
          <td style="padding: 12px; text-align: right; color: #334155;">₹${uPrice}</td>
          <td style="padding: 12px; text-align: center; color: #334155;">${it.quantity}</td>
          <td style="padding: 12px; text-align: right; font-weight: 600; color: #0f172a;">₹${subtotal}</td>
        </tr>
      `;
    }).join('');

    const grandTotal = Number(order.totalAmount || 0).toFixed(2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoiceNum}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 40px 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .invoice-num {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 32px;
    }
    .info-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .info-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    th {
      background: #f1f5f9;
      padding: 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .summary-table {
      width: 320px;
      margin-left: auto;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 8px 12px;
    }
    .total-row {
      border-top: 2px solid #0f172a;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .print-actions {
      text-align: center;
      margin-top: 32px;
    }
    .print-btn {
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-container { box-shadow: none; border: none; padding: 0; }
      .print-actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div>
        <div class="brand-name">MULTI-VENDOR E-COMMERCE</div>
        <div class="brand-sub">Official Digital Tax Invoice & Purchase Receipt</div>
      </div>
      <div class="invoice-badge">
        <h1 class="invoice-title">INVOICE</h1>
        <div class="invoice-num">${invoiceNum}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${formattedDate}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="info-card">
        <div class="info-title">Billed & Shipped To:</div>
        <div style="font-weight: 700; color: #0f172a;">${user.name || 'Valued Customer'}</div>
        <div style="font-size: 13px; color: #475569; margin-top: 4px;">
          ${addr.line1 || 'Customer Delivery Address'}<br>
          ${addr.line2 ? addr.line2 + '<br>' : ''}
          ${addr.city || 'City'}, ${addr.state || 'State'} - ${addr.pincode || '000000'}<br>
          Phone: ${user.phone || 'N/A'}<br>
          Email: ${user.email || 'N/A'}
        </div>
      </div>

      <div class="info-card">
        <div class="info-title">Order & Payment Details:</div>
        <div style="font-size: 13px; color: #334155; line-height: 1.6;">
          <strong>Order ID:</strong> ${order.id}<br>
          <strong>Order Status:</strong> <span style="font-weight: 700; color: #0284c7;">${order.status}</span><br>
          <strong>Payment Method:</strong> ${payment.paymentGateway || 'Digital Payment'}<br>
          <strong>Payment Status:</strong> <span style="font-weight: 700; color: #16a34a;">${payment.status || 'SUCCESS'}</span><br>
          <strong>Currency:</strong> INR (₹)
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="text-align: left;">Item Description</th>
          <th style="text-align: right; width: 100px;">Price</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 120px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <table class="summary-table">
      <tr>
        <td style="color: #64748b;">Subtotal:</td>
        <td style="text-align: right; font-weight: 600; color: #334155;">₹${grandTotal}</td>
      </tr>
      <tr>
        <td style="color: #64748b;">Shipping / Delivery:</td>
        <td style="text-align: right; font-weight: 600; color: #16a34a;">FREE</td>
      </tr>
      <tr class="total-row">
        <td>Total Amount Paid:</td>
        <td style="text-align: right;">₹${grandTotal}</td>
      </tr>
    </table>

    <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      Thank you for shopping with us! For any return, refund, or warranty inquiries, please visit our Help Center or contact support.
    </div>

    <div class="print-actions">
      <button class="print-btn" onclick="window.print()">Download / Print PDF</button>
    </div>
  </div>
</body>
</html>`;
  }
}

module.exports = new InvoiceService();
