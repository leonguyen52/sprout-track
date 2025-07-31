import sgMail from '@sendgrid/mail';
import { SendEmailProps } from './types';

export const sendWithSendGrid = async (props: SendEmailProps, apiKey: string) => {
  sgMail.setApiKey(apiKey);

  const msg = {
    to: props.to,
    from: props.from,
    subject: props.subject,
    text: props.text,
    html: props.html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid');
    return { success: true };
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return { success: false, error };
  }
}; 