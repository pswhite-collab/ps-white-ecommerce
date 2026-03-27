import resend from '../config/resend.js';

const DEFAULT_FROM = 'PS White <noreply@pswhite.com>';
const FALLBACK_FROM = 'PS White Books <onboarding@resend.dev>';

const emailTemplates = {
  welcome: ({ firstName = 'Reader' }) => ({
    subject: 'Welcome to PS White Books',
    html: `<p>Hello ${firstName},</p><p>Welcome to PS White Books. Your reader account is ready.</p>`,
  }),
  verification: ({ firstName = 'Reader', verifyUrl }) => ({
    subject: 'Verify your email',
    html: `<p>Hello ${firstName},</p><p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`,
  }),
  passwordReset: ({ firstName = 'Reader', resetUrl }) => ({
    subject: 'Reset your password',
    html: `<p>Hello ${firstName},</p><p>You can reset your password using <a href="${resetUrl}">this link</a>.</p>`,
  }),
  orderConfirmation: ({ orderNumber }) => ({
    subject: `Order ${orderNumber} confirmed`,
    html: `<p>Your order <strong>${orderNumber}</strong> is confirmed.</p>`,
  }),
};

const isSenderIdentityError = (err) => {
  const errorText = String(
    err?.message ||
      err?.error?.message ||
      err?.response?.data?.message ||
      ''
  ).toLowerCase();

  return (
    errorText.includes('sender') ||
    errorText.includes('from') ||
    errorText.includes('identity') ||
    errorText.includes('verify')
  );
};

export const sendEmail = async ({ to, subject, html, from }) => {
  if (!process.env.RESEND_API_KEY) {
    const missingKeyError = new Error('RESEND_API_KEY is missing');
    console.error('Email send failed:', missingKeyError);
    throw missingKeyError;
  }

  const configuredFrom = from || process.env.EMAIL_FROM || DEFAULT_FROM;

  try {
    const result = await resend.emails.send({ from: configuredFrom, to, subject, html });
    console.log('Email sent successfully:', result);
    return result;
  } catch (err) {
    const shouldRetryWithFallback =
      configuredFrom !== FALLBACK_FROM && isSenderIdentityError(err);

    if (shouldRetryWithFallback) {
      try {
        const fallbackResult = await resend.emails.send({
          from: FALLBACK_FROM,
          to,
          subject,
          html,
        });
        console.log('Email sent successfully:', fallbackResult);
        return fallbackResult;
      } catch (fallbackErr) {
        console.error('Email send failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    console.error('Email send failed:', err);
    throw err;
  }
};

export const sendWelcomeEmail = async ({ to, firstName }) => {
  const template = emailTemplates.welcome({ firstName });
  return await sendEmail({ to, ...template });
};

export const sendVerificationEmail = async ({ to, firstName, verifyUrl }) => {
  const template = emailTemplates.verification({ firstName, verifyUrl });
  return await sendEmail({ to, ...template });
};

export const sendPasswordResetEmail = async ({ to, firstName, resetUrl }) => {
  const template = emailTemplates.passwordReset({ firstName, resetUrl });
  return await sendEmail({ to, ...template });
};

export const sendOrderConfirmationEmail = async ({ to, orderNumber }) => {
  const template = emailTemplates.orderConfirmation({ orderNumber });
  return await sendEmail({ to, ...template });
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

  return await sendEmail({ to, subject, html });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
};
