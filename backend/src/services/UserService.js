const prisma = require('../config/prisma');
const jwtProvider = require('../utils/jwtProvider');
const UserError = require('../exceptions/UserError');

function toAppRole(prismaRole) {
  if (prismaRole === 'ADMIN') return 'ROLE_ADMIN';
  if (prismaRole === 'SELLER') return 'ROLE_SELLER';
  return 'ROLE_CUSTOMER';
}

function toPrismaRole(appRole) {
  if (appRole === 'ROLE_ADMIN' || appRole === 'ADMIN') return 'ADMIN';
  if (appRole === 'ROLE_SELLER' || appRole === 'SELLER') return 'SELLER';
  return 'BUYER';
}

function formatAddress(addr, user) {
  if (!addr) return null;
  return {
    id: addr.id,
    _id: addr.id,
    userId: addr.userId,
    name: user?.name || user?.fullName || 'Customer',
    line1: addr.line1,
    address: addr.line1,
    line2: addr.line2 || '',
    locality: addr.line2 || '',
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    pinCode: addr.pincode,
    mobile: user?.phone || user?.mobile || '',
    isDefault: addr.isDefault || false,
    createdAt: addr.createdAt,
  };
}

function formatUser(user) {
  if (!user) return null;
  const addresses = (user.addresses || []).map(a => formatAddress(a, user));
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    fullName: user.name,
    email: user.email,
    mobile: user.phone || '',
    phone: user.phone || '',
    role: toAppRole(user.role),
    accountType: user.role === 'ADMIN' ? 'ADMIN' : (user.role === 'SELLER' ? 'SELLER' : 'CUSTOMER'),
    status: 'ACTIVE',
    addresses,
    seller: user.seller || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class UserService {
  async findUserProfileByJwt(jwt) {
    const email = jwtProvider.getEmailFromJwt(jwt);
    const normalized = (email || '').toLowerCase().trim();

    try {
      const user = await prisma.user.findUnique({
        where: { email: normalized },
        include: {
          addresses: true,
          seller: true,
        },
      });

      if (user) {
        const formatted = formatUser(user);
        const AuthService = require('./AuthService');
        if (AuthService.setFallbackUser) {
          AuthService.setFallbackUser(normalized, formatted);
        }
        return formatted;
      }
    } catch (err) {
      console.warn('[UserService] Database findUserProfileByJwt notice:', err.message);
    }

    // Fallback to offline cache
    const AuthService = require('./AuthService');
    const cached = AuthService.getFallbackUser ? AuthService.getFallbackUser(normalized) : null;
    if (cached) return cached;

    throw new UserError(`User does not exist with email ${email}`);
  }

  async findUserByEmail(email) {
    const normalized = (email || '').toLowerCase().trim();

    try {
      const user = await prisma.user.findUnique({
        where: { email: normalized },
        include: {
          addresses: true,
          seller: true,
        },
      });

      if (user) {
        return formatUser(user);
      }
    } catch (err) {
      console.warn('[UserService] findUserByEmail database notice:', err.message);
    }

    const AuthService = require('./AuthService');
    const cached = AuthService.getFallbackUser ? AuthService.getFallbackUser(normalized) : null;
    if (cached) return cached;

    throw new UserError(`User does not exist with email ${email}`);
  }

  async findUserById(id) {
    if (!id) throw new UserError('User ID is required');

    try {
      const user = await prisma.user.findUnique({
        where: { id: String(id) },
        include: {
          addresses: true,
          seller: true,
        },
      });

      if (user) {
        return formatUser(user);
      }
    } catch (err) {
      console.warn('[UserService] findUserById notice:', err.message);
    }

    throw new UserError(`User not found with id ${id}`);
  }

  async updateUserProfile(currentUser, updateData) {
    const email = (currentUser?.email || '').toLowerCase().trim();
    const userId = currentUser?.id || currentUser?._id;

    const dataToUpdate = {};
    if (typeof updateData.fullName === 'string' && updateData.fullName.trim()) {
      dataToUpdate.name = updateData.fullName.trim();
    } else if (typeof updateData.name === 'string' && updateData.name.trim()) {
      dataToUpdate.name = updateData.name.trim();
    }

    if (typeof updateData.mobile === 'string') {
      dataToUpdate.phone = updateData.mobile.trim();
    } else if (typeof updateData.phone === 'string') {
      dataToUpdate.phone = updateData.phone.trim();
    }

    try {
      let updatedUser = null;
      if (userId && !String(userId).startsWith('offline_')) {
        updatedUser = await prisma.user.update({
          where: { id: String(userId) },
          data: dataToUpdate,
          include: { addresses: true, seller: true },
        });
      } else if (email) {
        updatedUser = await prisma.user.update({
          where: { email },
          data: dataToUpdate,
          include: { addresses: true, seller: true },
        });
      }

      if (updatedUser) {
        const formatted = formatUser(updatedUser);
        const AuthService = require('./AuthService');
        if (AuthService.setFallbackUser) {
          AuthService.setFallbackUser(email, formatted);
        }
        return formatted;
      }
    } catch (err) {
      console.warn('[UserService] updateUserProfile notice:', err.message);
    }

    // Offline fallback update
    const AuthService = require('./AuthService');
    let fallback = AuthService.getFallbackUser ? AuthService.getFallbackUser(email) : null;
    if (!fallback) {
      fallback = {
        _id: userId || `offline_${email}`,
        id: userId || `offline_${email}`,
        email,
        fullName: dataToUpdate.name || 'User',
        name: dataToUpdate.name || 'User',
        mobile: dataToUpdate.phone || '',
        phone: dataToUpdate.phone || '',
        role: currentUser?.role || 'ROLE_CUSTOMER',
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
        addresses: currentUser?.addresses || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      if (dataToUpdate.name) {
        fallback.fullName = dataToUpdate.name;
        fallback.name = dataToUpdate.name;
      }
      if (dataToUpdate.phone !== undefined) {
        fallback.mobile = dataToUpdate.phone;
        fallback.phone = dataToUpdate.phone;
      }
      fallback.updatedAt = new Date().toISOString();
    }

    if (AuthService.setFallbackUser) {
      AuthService.setFallbackUser(email, fallback);
    }
    return fallback;
  }

  async addAddress(currentUser, addressData) {
    const email = (currentUser?.email || '').toLowerCase().trim();
    let userId = currentUser?.id || currentUser?._id;

    if (!userId || String(userId).startsWith('offline_')) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) userId = dbUser.id;
      } catch (e) {}
    }

    if (!userId) {
      throw new UserError('User account not found to attach address');
    }

    const line1 = addressData.line1 || addressData.address || addressData.locality || 'Standard Address';
    const line2 = addressData.line2 || addressData.locality || addressData.name || null;
    const city = addressData.city || 'City';
    const state = addressData.state || 'State';
    const pincode = String(addressData.pincode || addressData.pinCode || '000000').trim();

    const created = await prisma.address.create({
      data: {
        userId,
        line1,
        line2,
        city,
        state,
        pincode,
        isDefault: !!addressData.isDefault,
      },
    });

    const formatted = formatAddress(created, currentUser);

    // Sync offline cache
    const AuthService = require('./AuthService');
    const cached = AuthService.getFallbackUser ? AuthService.getFallbackUser(email) : null;
    if (cached) {
      if (!Array.isArray(cached.addresses)) cached.addresses = [];
      cached.addresses.push(formatted);
      AuthService.setFallbackUser(email, cached);
    }

    return formatted;
  }

  async deleteAddress(currentUser, addressId) {
    const email = (currentUser?.email || '').toLowerCase().trim();
    let userId = currentUser?.id || currentUser?._id;

    if (!userId || String(userId).startsWith('offline_')) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) userId = dbUser.id;
      } catch (e) {}
    }

    if (!userId) {
      throw new UserError('User account not found to delete address');
    }

    try {
      await prisma.address.deleteMany({
        where: {
          id: String(addressId),
          userId: String(userId),
        },
      });
    } catch (e) {
      console.warn('[UserService] deleteAddress notice:', e.message);
    }

    // Sync offline cache
    const AuthService = require('./AuthService');
    const cached = AuthService.getFallbackUser ? AuthService.getFallbackUser(email) : null;
    if (cached && Array.isArray(cached.addresses)) {
      cached.addresses = cached.addresses.filter(a => String(a._id || a.id) !== String(addressId));
      AuthService.setFallbackUser(email, cached);
    }

    return { message: 'Address deleted successfully', addressId };
  }

  async getAllUsers() {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      include: { addresses: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(formatUser);
  }

  formatUser(u) {
    return formatUser(u);
  }

  formatAddress(a, u) {
    return formatAddress(a, u);
  }

  toAppRole(r) {
    return toAppRole(r);
  }

  toPrismaRole(r) {
    return toPrismaRole(r);
  }
}

module.exports = new UserService();
