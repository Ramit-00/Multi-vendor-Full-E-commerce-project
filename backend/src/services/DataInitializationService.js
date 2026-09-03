// services/DataInitializationService.js
const User = require('../models/User'); // Adjust the path if necessary
const bcrypt = require('bcrypt');

class DataInitializationService {
  async initializeAdminUser() {
    const adminEmail = 'codewithzosh@gmail.com';
    const adminPassword = 'codewithzosh';
    
    try {
      // Check if an admin user already exists
      const adminExists = await User.findOne({ email: adminEmail });

      if (!adminExists) {
        // Hash the admin password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create the admin user
        const adminUser = new User({
          fullName: 'E-COM Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'ROLE_ADMIN',
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
      } else {
        console.log('Admin user already exists.');
      }
    } catch (error) {
      console.error('Error during admin initialization:', error);
    }
  }
}

module.exports = new DataInitializationService();
