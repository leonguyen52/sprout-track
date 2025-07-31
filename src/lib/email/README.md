# Email Service

This module provides a unified `sendEmail` function for sending emails through various providers, including SendGrid, SMTP2GO, and a manual SMTP configuration. The service intelligently selects the provider based on the settings configured in the `EmailConfig` table in the database.

## Setup

The email provider is configured on the **App Configuration** page in the application's admin settings. Depending on the selected provider, you will need to provide the appropriate credentials (e.g., API keys, SMTP server details).

## `sendEmail` Function

The `sendEmail` function orchestrates sending emails by first fetching the current email configuration from the database and then dispatching the request to the appropriate provider-specific function.

### Props

The function accepts a single object with the following properties, as defined in `SendEmailProps`:

- `to` (string): The recipient's email address.
- `from` (string): The sender's email address.
- `subject` (string): The subject line of the email.
- `text` (string): The plain text content of the email.
- `html` (string): The HTML content of the email.

### Return Value

- On **success**, it returns `{ success: true }`.
- On **failure**, it returns `{ success: false, error: <error_object> }`.

### Example Usage

Here is an example of how to import and use the `sendEmail` function. The function will automatically use the configured provider.

```typescript
import { sendEmail } from '@/lib/email';

const handleSendEmail = async () => {
  const result = await sendEmail({
    to: 'recipient@example.com',
    from: 'verified-sender@example.com',
    subject: 'Hello from Sprout Track',
    text: 'This is a test email sent from the configured email service.',
    html: '<strong>This is a test email sent from the configured email service.</strong>',
  });

  if (result.success) {
    console.log('Email sent successfully!');
  } else {
    console.error('Failed to send email:', result.error);
  }
};
``` 