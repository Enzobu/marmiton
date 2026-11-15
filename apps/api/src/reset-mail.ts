import nodemailer from 'nodemailer';

export type SendResetMail = (email: string, token: string) => Promise<void>;

export async function sendResetMail(email: string, token: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, PUBLIC_WEB_URL } = process.env;
  if (!SMTP_HOST || !PUBLIC_WEB_URL || !SMTP_USER || !SMTP_PASSWORD) throw new Error('SMTP or public web URL is not configured');
  const port = Number(SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
  const resetUrl = new URL('/reset-password', PUBLIC_WEB_URL);
  resetUrl.hash = new URLSearchParams({ token }).toString();
  await transport.sendMail({
    from: SMTP_FROM_EMAIL || 'no-reply@enzo-palermo.com',
    to: email,
    subject: 'Réinitialiser ton mot de passe Les Petits Plats',
    text: `Utilise ce lien dans les 30 minutes pour choisir un nouveau mot de passe :\n${resetUrl}\n\nSi tu n’as rien demandé, ignore cet e-mail.`,
  });
}
