// services/DataInitializationService.js
const User = require('../models/User'); // Adjust the path if necessary
const bcrypt = require('bcrypt');

class DataInitializationService {
  async initializeAdminUser() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ecom.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword!2024';
    
    try {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      let adminUser = await User.findOne({ email: adminEmail });

      if (!adminUser) {
        adminUser = new User({
          fullName: 'Master Administrator',
          email: adminEmail,
          password: hashedPassword,
          role: 'ROLE_ADMIN',
          accountType: 'ADMIN',
          status: 'ACTIVE'
        });
        await adminUser.save();
        console.log(`[AdminInit] Master Admin initialized: ${adminEmail}`);
      } else {
        // Ensure role, accountType, status and password hash are active and in sync
        adminUser.role = 'ROLE_ADMIN';
        adminUser.accountType = 'ADMIN';
        adminUser.status = 'ACTIVE';
        adminUser.password = hashedPassword;
        await adminUser.save();
        console.log(`[AdminInit] Master Admin verified & updated: ${adminEmail}`);
      }
    } catch (error) {
      console.error('[AdminInit] Error during admin initialization:', error.message);
    }
  }
}

module.exports = new DataInitializationService();
