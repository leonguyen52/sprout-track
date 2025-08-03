import { sendEmail } from '@/src/lib/email';
import prisma from '../db';

async function getDomainUrl(): Promise<string> {
  try {
    let appConfig = await prisma.appConfig.findFirst();
    
    if (!appConfig) {
      // Create default app config if none exists
      appConfig = await prisma.appConfig.create({
        data: {
          adminPass: 'admin',
          rootDomain: 'localhost:3000',
          enableHttps: false,
        },
      });
    }

    const protocol = appConfig.enableHttps ? 'https' : 'http';
    return `${protocol}://${appConfig.rootDomain}`;
  } catch (error) {
    console.error('Error fetching app config for domain URL:', error);
    // Fallback to environment variable or default
    return process.env.ROOT_DOMAIN || 'http://localhost:3000';
  }
}

export async function sendVerificationEmail(email: string, token: string, firstName: string) {
  const domainUrl = await getDomainUrl();
  const verificationUrl = `${domainUrl}/#verify?token=${token}`;
  
  const result = await sendEmail({
    to: email,
    from: process.env.VERIFICATION_EMAIL || 'accounts@sprout-track.com',
    subject: 'Welcome to Sprout Track - Verify Your Account',
    text: `Hi ${firstName},

Welcome to Sprout Track! Please verify your email address by visiting this link:

${verificationUrl}

This link will expire in 24 hours.

Best regards,
The Sprout Track Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Welcome to Sprout Track!</h2>
        <p>Hi ${firstName},</p>
        <p>Welcome to Sprout Track! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account with Sprout Track, 
          please ignore this email.
        </p>
        <p>Best regards,<br>The Sprout Track Team</p>
      </div>
    `
  });

  return result;
}

export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  const domainUrl = await getDomainUrl();
  const resetUrl = `${domainUrl}/account/reset-password?token=${token}`;
  
  const result = await sendEmail({
    to: email,
    from: process.env.SECURITY_EMAIL || 'passwordreset@sprout-track.com',
    subject: 'Sprout Track - Password Reset Request',
    text: `Hi ${firstName},

You requested a password reset for your Sprout Track account. Please visit this link to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you didn't request a password reset, please ignore this email.

Best regards,
The Sprout Track Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested a password reset for your Sprout Track account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 15 minutes. If you didn't request a password reset, 
          please ignore this email.
        </p>
        <p>Best regards,<br>The Sprout Track Team</p>
      </div>
    `
  });

  return result;
}

export async function sendWelcomeEmail(email: string, firstName: string, familySlug: string, familyPin: string, caretakerLoginId: string) {
  const domainUrl = await getDomainUrl();
  const familyUrl = `${domainUrl}/${familySlug}`;
  
  const result = await sendEmail({
    to: email,
    from: process.env.ACCOUNTS_EMAIL || 'accounts@sprout-track.com',
    subject: 'Welcome to Sprout Track - Your Family is Ready!',
    text: `Hi ${firstName},

Welcome to Sprout Track! Your account has been verified and your family is ready to use.

Your Family Details:
- Family URL: ${familyUrl}
- Your Caretaker Login ID: ${caretakerLoginId}
- Family PIN: ${familyPin}

Use your Caretaker Login ID (${caretakerLoginId}) and PIN (${familyPin}) to access your family's dashboard directly.

You can share the family URL, your login ID, and PIN with other caretakers so they can access your family's data.

As the account owner, you can also log in directly using your email and password without needing the PIN.

Get started by adding your first baby and logging your first activities!

Best regards,
The Sprout Track Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Welcome to Sprout Track!</h2>
        <p>Hi ${firstName},</p>
        <p>Welcome to Sprout Track! Your account has been verified and your family is ready to use.</p>
        
        <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0d9488; margin-top: 0;">Your Family Details:</h3>
          <p><strong>Family URL:</strong> <a href="${familyUrl}">${familyUrl}</a></p>
          <p><strong>Your Caretaker Login ID:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${caretakerLoginId}</code></p>
          <p><strong>Family PIN:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px;">${familyPin}</code></p>
        </div>
        
        <p>Use your Caretaker Login ID (<strong>${caretakerLoginId}</strong>) and PIN (<strong>${familyPin}</strong>) to access your family's dashboard directly.</p>
        <p>You can share the family URL, your login ID, and PIN with other caretakers so they can access your family's data.</p>
        <p>As the account owner, you can also log in directly using your email and password without needing the PIN.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${familyUrl}" 
             style="background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Your Family Dashboard
          </a>
        </div>
        
        <p>Get started by adding your first baby and logging your first activities!</p>
        <p>Best regards,<br>The Sprout Track Team</p>
      </div>
    `
  });

  return result;
}