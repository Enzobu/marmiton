import nodemailer from 'nodemailer';

export type ResetMailTheme = 'light' | 'dark';
export type SendResetMail = (email: string, token: string, theme: ResetMailTheme) => Promise<void>;

// Match the app's light and dark palettes. Use a deeper orange for the light button's text contrast.
const palette = {
  light: { page: '#fffdf9', paper: '#ffffff', ink: '#2b2723', muted: '#77716a', line: '#eee8e0', accent: '#b6481b', buttonText: '#ffffff' },
  dark: { page: '#161b18', paper: '#222923', ink: '#f3eee5', muted: '#b8b8ad', line: '#3b453d', accent: '#ffac78', buttonText: '#161b18' },
};

export function renderResetMail(publicUrl: string, token: string, theme: ResetMailTheme) {
  const url = new URL('/reset-password', publicUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('PUBLIC_WEB_URL must use HTTP or HTTPS');
  url.hash = new URLSearchParams({ token }).toString();
  const link = url.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const colors = palette[theme];
  const intro = 'Ce lien est valable 30 minutes et permet de définir un nouveau mot de passe.';
  const footer = 'Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.';
  const heading = 'Réinitialisation du mot de passe';

  return {
    subject: 'Réinitialisation du mot de passe · Les petits plats',
    text: `Les petits plats\n\n${heading}\n\n${intro}\n${url.href}\n\n${footer}`,
    html: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="${theme}">
  <meta name="supported-color-schemes" content="${theme}">
  <title>${heading} · Les petits plats</title>
</head>
<body style="margin:0;background-color:${colors.page};color:${colors.ink};font-family:Arial,sans-serif;color-scheme:${theme}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${colors.page}" style="background-color:${colors.page}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${colors.paper}" style="width:100%;max-width:520px;background-color:${colors.paper};border:1px solid ${colors.line};border-radius:14px">
        <tr><td style="padding:28px 24px;color:${colors.ink}">
          <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:${colors.ink}">Les petits <span style="color:${colors.accent}">plats.</span></p>
          <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:29px;line-height:1.2;color:${colors.ink}">${heading}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${colors.ink}">${intro}</p>
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr><td bgcolor="${colors.accent}" style="background-color:${colors.accent};border-radius:8px">
              <a href="${link}" style="display:inline-block;padding:14px 18px;color:${colors.buttonText};font-size:15px;font-weight:bold;text-decoration:none">Choisir un nouveau mot de passe</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${colors.line};font-size:13px;line-height:1.6;color:${colors.muted}">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

export async function sendResetMail(email: string, token: string, theme: ResetMailTheme) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, PUBLIC_WEB_URL } = process.env;
  if (!SMTP_HOST || !PUBLIC_WEB_URL || !SMTP_USER || !SMTP_PASSWORD) throw new Error('SMTP or public web URL is not configured');
  const port = Number(SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
  await transport.sendMail({
    from: SMTP_FROM_EMAIL || 'no-reply@enzo-palermo.com',
    to: email,
    ...renderResetMail(PUBLIC_WEB_URL, token, theme),
  });
}
