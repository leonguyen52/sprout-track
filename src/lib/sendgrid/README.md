# SendGrid Email Service

This module provides a reusable function for sending emails using the SendGrid API.

## Setup

Before using this service, ensure that your SendGrid API key is set as an environment variable named `SENDGRID_API_KEY` in your `.env` file:

```env
SENDGRID_API_KEY="YOUR_SENDGRID_API_KEY"
```

## `sendEmail` Function

The `sendEmail` function sends an email with the specified properties. It is an asynchronous function that returns a promise resolving to an object indicating success or failure.

### Props

The function accepts a single object with the following properties, as defined in `SendEmailProps`:

- `to` (string): The recipient's email address.
- `from` (string): The sender's email address. This must be a verified sender in your SendGrid account.
- `subject` (string): The subject line of the email.
- `text` (string): The plain text content of the email.
- `html` (string): The HTML content of the email.

### Return Value

- On **success**, it returns `{ success: true }`.
- On **failure**, it returns `{ success: false, error: <error_object> }`.

### Example Usage

Here is an example of how to import and use the `sendEmail` function:

```typescript
import { sendEmail } from '@/lib/sendgrid';

const handleSendEmail = async () => {
  const result = await sendEmail({
    to: 'recipient@example.com',
    from: 'verified-sender@example.com',
    subject: 'Hello from Sprout Track',
    text: 'This is a test email sent from the SendGrid service.',
    html: '<strong>This is a test email sent from the SendGrid service.</strong>',
  });

  if (result.success) {
    console.log('Email sent successfully!');
  } else {
    console.error('Failed to send email:', result.error);
  }
};
``` 