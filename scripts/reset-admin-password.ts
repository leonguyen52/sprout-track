import prisma from '../prisma/db';
import { encrypt } from '../app/api/utils/encryption';

async function main() {
  try {
    const newPassword = process.argv[2];
    const mode = process.argv[3] || 'plain'; // 'encrypt' | 'plain'

    if (!newPassword) {
      console.error('Usage: tsx scripts/reset-admin-password.ts <NEW_PASSWORD> [encrypt|plain]');
      process.exit(1);
    }

    // Ensure AppConfig exists
    let appConfig = await prisma.appConfig.findFirst();
    if (!appConfig) {
      appConfig = await prisma.appConfig.create({
        data: {
          adminPass: mode === 'plain' ? newPassword : encrypt(newPassword),
          rootDomain: 'localhost',
          enableHttps: false,
        },
      });
      console.log('Created AppConfig and set admin password.');
    } else {
      const updated = await prisma.appConfig.update({
        where: { id: appConfig.id },
        data: {
          adminPass: mode === 'plain' ? newPassword : encrypt(newPassword),
        },
      });
      console.log('Updated AppConfig admin password.');
    }

    console.log(`Mode: ${mode}. If using encrypt, ENC_HASH must be set.`);
  } catch (err) {
    console.error('Failed to reset admin password:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


