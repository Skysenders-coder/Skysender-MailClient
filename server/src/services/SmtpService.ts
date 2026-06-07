import nodemailer from 'nodemailer';
import type { SessionCredentials, SendPayload, ReplyPayload } from '../types';

export async function sendMail(
  creds: SessionCredentials,
  payload: SendPayload | ReplyPayload
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: 465,
    secure: true,
    auth: { user: creds.email, pass: creds.password },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: creds.email,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  };

  if ('inReplyTo' in payload && payload.inReplyTo) {
    mailOptions.inReplyTo = payload.inReplyTo;
    mailOptions.references = payload.references;
  }

  await transporter.sendMail(mailOptions);
}
