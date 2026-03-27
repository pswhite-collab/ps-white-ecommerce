import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const RESEND_FALLBACK_FROM = 'PS White Books <onboarding@resend.dev>';

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

export const emailTemplates = {
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

export const sendEmail = async ({ to, subject, html }) => {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY is missing; email skipped. Add RESEND_API_KEY to Render environment variables.');
    return null;
  }

  const configuredFrom = process.env.EMAIL_FROM || RESEND_FALLBACK_FROM;

  try {
    const result = await resend.emails.send({ from: configuredFrom, to, subject, html });
    console.log('Email sent:', result);
    return result;
  } catch (err) {
    const shouldRetryWithFallback = configuredFrom !== RESEND_FALLBACK_FROM && isSenderIdentityError(err);
    if (shouldRetryWithFallback) {
      console.warn('[Email] Sender identity rejected. Retrying with Resend fallback sender.');
      const fallbackResult = await resend.emails.send({
        from: RESEND_FALLBACK_FROM,
        to,
        subject,
        html,
      });
      console.log('Email sent with fallback sender:', fallbackResult);
      return fallbackResult;
    }

    console.error('Email error:', err);
    throw err;
  }
};

export default resend;
