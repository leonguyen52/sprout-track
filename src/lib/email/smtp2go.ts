import { SendEmailProps } from './types';

export const sendWithSmtp2goApi = async (props: SendEmailProps, apiKey: string) => {
  const { to, from, subject, text, html } = props;

  const body = {
    sender: from,
    to: [to], // SMTP2GO API expects an array of strings
    subject,
    text_body: text,
    html_body: html,
  };

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data?.data?.succeeded > 0) {
      console.log('Email sent successfully via SMTP2GO API');
      return { success: true };
    } else {
      const errorMessage = data?.data?.error || data?.data?.failures?.[0]?.error || 'Failed to send email with SMTP2GO';
      console.error('Error sending email with SMTP2GO API:', errorMessage);
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Error sending email with SMTP2GO API:', error);
    return { success: false, error };
  }
}; 