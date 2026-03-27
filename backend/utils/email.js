import { emailTemplates, sendEmail as sendRawEmail } from '../config/resend.js';

export const sendEmail = async ({ to, subject, html }) => {
  return await sendRawEmail({ to, subject, html });
};

export const sendWelcomeEmail = async ({ to, firstName }) => {
  const template = emailTemplates.welcome({ firstName });
  return await sendRawEmail({ to, ...template });
};

export const sendVerificationEmail = async ({ to, firstName, verifyUrl }) => {
  const template = emailTemplates.verification({ firstName, verifyUrl });
  return await sendRawEmail({ to, ...template });
};

export const sendPasswordResetEmail = async ({ to, firstName, resetUrl }) => {
  const template = emailTemplates.passwordReset({ firstName, resetUrl });
  return await sendRawEmail({ to, ...template });
};

export const sendOrderConfirmationEmail = async ({ to, orderNumber }) => {
  const template = emailTemplates.orderConfirmation({ orderNumber });
  return await sendRawEmail({ to, ...template });
};

export const sendShippingNotificationEmail = async ({ to, customerName, order }) => {
  const trackingLink = order.shipping?.trackingUrl || '#';
  const safeName = customerName || 'Reader';
  const orderNumber = order.orderNumber || 'N/A';
  const carrier = order.shipping?.carrier || 'Carrier';
  const trackingNumber = order.shipping?.trackingNumber || 'N/A';
  const shippedAt = order.shipping?.shippedAt
    ? new Date(order.shipping.shippedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  const subject = `Your Order ${orderNumber} Has Shipped`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#232323;max-width:620px;margin:0 auto">
      <div style="background:#685D54;color:#FBF7F4;padding:20px;border-radius:10px 10px 0 0">
        <h2 style="margin:0">Your Order Has Shipped</h2>
      </div>
      <div style="background:#FBF7F4;border:1px solid #E5DED2;border-top:0;padding:20px 24px;border-radius:0 0 10px 10px">
        <p>Hi ${safeName},</p>
        <p>Your order <strong>${orderNumber}</strong> is now on the way.</p>
        <div style="background:#fff;border:1px solid #E5DED2;border-radius:8px;padding:14px 16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Carrier:</strong> ${carrier}</p>
          <p style="margin:0 0 8px"><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p style="margin:0"><strong>Shipped Date:</strong> ${shippedAt}</p>
        </div>
        <p style="margin:18px 0">
          <a href="${trackingLink}" style="display:inline-block;background:#685D54;color:#FBF7F4;text-decoration:none;padding:10px 18px;border-radius:24px">
            Track Your Package
          </a>
        </p>
        <p>Thank you for shopping with PS White Books.</p>
      </div>
    </div>
  `;

  return await sendRawEmail({ to, subject, html });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
};
