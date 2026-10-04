import nodemailer from "nodemailer";

export function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "1",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

export function quoteEmailTemplate(args: {
  customerName: string; companyName: string; number: string; subject: string;
  total: string; link: string; message?: string; senderName?: string;
}) {
  const { customerName, companyName, number, subject, total, link, message, senderName } = args;
  const text =
    `Buongiorno ${customerName},\n\n` +
    (message ? `${message}\n\n` : `Le inviamo in allegato il preventivo n. ${number} relativo a "${subject}" per un totale di ${total}.\n\n`) +
    `Può visualizzarlo e accettarlo online qui:\n${link}\n\n` +
    `Cordiali saluti,\n${senderName || companyName}\n${companyName}`;
  const html =
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">` +
    `<h2 style="color:#3730a3">${companyName}</h2>` +
    `<p>Buongiorno ${customerName},</p>` +
    (message ? `<p>${message.replace(/\n/g, "<br>")}</p>` : `<p>Le inviamo in allegato il <b>preventivo n. ${number}</b> relativo a "<b>${subject}</b>" per un totale di <b>${total}</b>.</p>`) +
    `<p><a href="${link}" style="display:inline-block;background:#4338ca;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none">Visualizza e accetta il preventivo</a></p>` +
    `<p style="color:#64748b;font-size:13px">Oppure apra questo link: ${link}</p>` +
    `<p>Cordiali saluti,<br>${senderName || companyName}<br>${companyName}</p></div>`;
  return { text, html };
}
