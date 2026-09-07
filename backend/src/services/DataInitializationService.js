const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

class DataInitializationService {
  async initializeAdminUser() {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('[AdminInit] ADMIN_EMAIL or ADMIN_PASSWORD not configured; skipping automatic admin seeding.');
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Initialize/verify in PostgreSQL via Prisma
      const existingPostgresAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (!existingPostgresAdmin) {
        await prisma.user.create({
          data: {
            name: 'Master Administrator',
            email: adminEmail,
            passwordHash: hashedPassword,
            role: 'ADMIN',
          }
        });
        console.log(`[AdminInit] Master Admin initialized in PostgreSQL: ${adminEmail}`);
      } else {
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            name: existingPostgresAdmin.name || 'Master Administrator',
            passwordHash: hashedPassword,
            role: 'ADMIN',
          }
        });
        console.log(`[AdminInit] Master Admin verified & updated in PostgreSQL: ${adminEmail}`);
      }

      // Admin user verified in PostgreSQL
    } catch (error) {
      console.error('[AdminInit] Error during admin initialization:', error.message);
    }
  }
}

module.exports = new DataInitializationService();
