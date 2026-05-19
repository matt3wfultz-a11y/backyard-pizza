import nodemailer from 'nodemailer';

interface ReservationEmailData {
  to: string;
  name: string;
  quantity: number;
  nextDate: string;
  cancelUrl: string;
}

export async function sendReservationEmail(data: ReservationEmailData): Promise<void> {
  const { to, name, quantity, nextDate, cancelUrl } = data;

  if (!process.env.SMTP_HOST) {
    console.log('[EMAIL - no SMTP configured]');
    console.log(`  To: ${to}`);
    console.log(`  Name: ${name}`);
    console.log(`  Quantity: ${quantity}`);
    console.log(`  Next Date: ${nextDate}`);
    console.log(`  Cancel URL: ${cancelUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const dateLabel = nextDate
    ? new Date(nextDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBD';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Georgia, serif; background: #fff7ed; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #fed7aa;">
          <h1 style="color: #c2410c; font-size: 24px; margin-bottom: 8px;">🍕 You're on the list!</h1>
          <p style="color: #57534e; font-size: 16px;">Hi ${name},</p>
          <p style="color: #57534e;">Your reservation for <strong>${quantity} pizza${quantity > 1 ? 's' : ''}</strong> on <strong>${dateLabel}</strong> is confirmed.</p>
          <p style="color: #57534e;">We'll have them fresh from the brick oven. See you then!</p>
          <hr style="border: none; border-top: 1px solid #fed7aa; margin: 24px 0;" />
          <p style="color: #78716c; font-size: 14px;">Need to cancel? Use the link below — no account needed.</p>
          <a href="${cancelUrl}" style="display: inline-block; margin-top: 8px; padding: 10px 20px; background: #ea580c; color: white; border-radius: 8px; text-decoration: none; font-size: 14px;">Cancel my reservation</a>
          <p style="color: #a8a29e; font-size: 12px; margin-top: 24px;">Or copy this link: ${cancelUrl}</p>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Your Backyard Pizza reservation – ${dateLabel}`,
    html,
    text: `Hi ${name},\n\nYour reservation for ${quantity} pizza${quantity > 1 ? 's' : ''} on ${dateLabel} is confirmed.\n\nTo cancel: ${cancelUrl}`,
  });
}
