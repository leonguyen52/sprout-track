export interface BaseEmailProps {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export interface SendEmailProps extends BaseEmailProps {}

export interface SmtpEmailProps extends BaseEmailProps {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
} 