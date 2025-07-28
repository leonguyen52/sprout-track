import sgMail from '@sendgrid/mail';
import { SendEmailProps } from './types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export const sendEmail = async (props: SendEmailProps) => {
  const { to, from, subject, text, html } = props;

  const msg = {
    to,
    from,
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}; 