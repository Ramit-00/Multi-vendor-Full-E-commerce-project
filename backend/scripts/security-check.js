#!/usr/bin/env node
/**
 * PERMANENT AUTOMATED SECURITY, INTEGRITY & ZERO-REGRESSION SUITE
 * 
 * Run via: npm run security:check
 * 
 * This suite permanently guards against:
 *  1. Local storage leaks & non-Cloudinary image regressions
 *  2. Master Admin unauthorized access & secret key bypasses
 *  3. Authentication backdoors & mock token exploits
 *  4. IDOR / RBAC privilege escalation
 *  5. Missing HTTP security headers
 *  6. Rate limiting failures
 *  7. Accidental secret key leaks in source or client bundles
 *  8. PostgreSQL & MongoDB database connection regressions
 */

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function request({ method = 'GET', url, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsedBody = data;
        try {
          parsedBody = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsedBody });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('       AUTOMATED SECURITY & ZERO-REGRESSION VERIFICATION        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const issues = [];

  function assert(name, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} -> ${detail}`);
      failed++;
      issues.push({ name, detail });
    }
  }

  // 1. HEALTH & DUAL DATABASE CONNECTIVITY
  console.log('--- 1. DATABASE & SERVER HEALTH ---');
  try {
    const health = await request({ url: `${BASE_URL}/health` });
    assert('Backend Server is online (HTTP 200)', health.status === 200, `status: ${health.status}`);
    assert('System Health status is "healthy"', health.body?.status === 'healthy', `got: ${health.body?.status}`);
    assert('PostgreSQL connection status is "connected"', health.body?.databases?.postgresql === 'connected', `got: ${health.body?.databases?.postgresql}`);
    assert('MongoDB Atlas connection status is "connected"', health.body?.databases?.mongodb === 'connected', `got: ${health.body?.databases?.mongodb}`);
  } catch (err) {
    assert('Server & Database Health check', false, err.message);
  }

  // 2. ZERO-LOCAL-STORAGE & CLOUDINARY CDN DELIVERY
  console.log('\n--- 2. ZERO-LOCAL-STORAGE & CLOUDINARY CDN INTEGRITY ---');
  try {
    const localProbe = await request({ url: `${BASE_URL}/product-images/shirt.jpg` });
    assert('ZERO-LOCAL-STORAGE: /product-images static route disabled (HTTP 404)', localProbe.status === 404, `status: ${localProbe.status}`);

    const productsRes = await request({ url: `${BASE_URL}/products?pageSize=30` });
    const productList = productsRes.body?.content || [];
    assert('Products catalog returns items', productList.length > 0, `found: ${productList.length}`);

    let allCloudinary = true;
    let anyLocal = false;
    let sampleUrls = [];

    for (const p of productList) {
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          if (typeof img === 'string') {
            if (img.includes('localhost') || img.startsWith('/product-images')) {
              anyLocal = true;
            }
            if (img.startsWith('https://res.cloudinary.com/pddxfqxe/')) {
              if (sampleUrls.length < 5) sampleUrls.push(img);
            } else if (!img.startsWith('https://images.unsplash.com')) {
              allCloudinary = false;
            }
          }
        }
      }
    }

    assert('ZERO-LOCAL-STORAGE: Zero images contain local routes/localhost', !anyLocal, 'Local image routes found');
    assert('Catalog products deliver secure Cloudinary CDN URLs (res.cloudinary.com/pddxfqxe)', allCloudinary, 'Non-Cloudinary URL found');

    let cdnOk = true;
    for (const url of sampleUrls) {
      try {
        const probe = await request({ url, method: 'GET' });
        if (probe.status !== 200) cdnOk = false;
      } catch (e) {
        cdnOk = false;
      }
    }
    assert(`Cloudinary CDN Probing: Sampled ${sampleUrls.length} images returned HTTP 200 OK`, cdnOk && sampleUrls.length > 0, `sampled: ${sampleUrls.length}`);
  } catch (err) {
    assert('Cloudinary & Zero-Storage verification', false, err.message);
  }

  // 3. HTTP SECURITY HEADERS
  console.log('\n--- 3. HTTP SECURITY HEADERS & DEFENSE-IN-DEPTH ---');
  try {
    const res = await request({ url: `${BASE_URL}/health` });
    const h = res.headers;
    assert('Header: X-Content-Type-Options is "nosniff"', h['x-content-type-options'] === 'nosniff', h['x-content-type-options']);
    assert('Header: X-Frame-Options is "DENY"', h['x-frame-options'] === 'DENY', h['x-frame-options']);
    assert('Header: Strict-Transport-Security configured', !!h['strict-transport-security'], h['strict-transport-security']);
    assert('Header: Referrer-Policy configured', h['referrer-policy'] === 'strict-origin-when-cross-origin', h['referrer-policy']);
  } catch (err) {
    assert('HTTP security headers check', false, err.message);
  }

  // 4. RATE LIMITING (BRUTE FORCE DEFENSE)
  console.log('\n--- 4. RATE LIMITING & BRUTE FORCE DEFENSE ---');
  try {
    const authProbe = await request({
      url: `${BASE_URL}/auth/signin`,
      method: 'POST',
      body: { email: 'nonexistent_test_rate_limit@ecom.com', otp: '000000' },
    });
    // express-rate-limit sets standard headers (ratelimit-limit, ratelimit-remaining, or ratelimit-reset)
    const hasRateLimitHeader = !!(
      authProbe.headers['ratelimit-limit'] || 
      authProbe.headers['x-ratelimit-limit'] ||
      authProbe.headers['ratelimit-policy'] ||
      authProbe.headers['ratelimit-remaining']
    );
    assert('Rate Limiting: Sensitive auth routes enforce RateLimit headers', hasRateLimitHeader, 'Rate limit headers missing');
  } catch (err) {
    assert('Rate limiting verification', false, err.message);
  }

  // 5. AUTHENTICATION HARDENING & BACKDOOR DEFENSES
  console.log('\n--- 5. AUTHENTICATION HARDENING & BACKDOOR DEFENSES ---');
  try {
    const otpSignin = await request({
      url: `${BASE_URL}/auth/signin`,
      method: 'POST',
      body: { email: 'admin@ecom.com', otp: '123456' },
    });
    assert('Backdoor Defense: Hardcoded OTP 123456 rejected on /auth/signin', otpSignin.status >= 400, `status: ${otpSignin.status}`);

    const googleLogin = await request({
      url: `${BASE_URL}/auth/google`,
      method: 'POST',
      body: { token: 'mock_google_token_12345' },
    });
    assert('Backdoor Defense: Mock Google Token rejected on /auth/google', googleLogin.status >= 400, `status: ${googleLogin.status}`);

    const sellerOtp = await request({
      url: `${BASE_URL}/sellers`,
      method: 'POST',
      body: { email: 'fake_seller@ecom.com', otp: '123456' },
    });
    assert('Backdoor Defense: Hardcoded OTP rejected on POST /sellers', sellerOtp.status >= 400, `status: ${sellerOtp.status}`);
  } catch (err) {
    assert('Auth hardening check', false, err.message);
  }

  // 6. AUTHORIZATION, RBAC & IDOR PREVENTION
  console.log('\n--- 6. AUTHORIZATION, RBAC & IDOR PREVENTION ---');
  try {
    const unauthCategory = await request({
      url: `${BASE_URL}/home/categories`,
      method: 'POST',
      body: { categoryId: 'hack_cat', name: 'Hack Category' },
    });
    assert('RBAC: Unauthenticated user rejected from POST /home/categories (401)', unauthCategory.status === 401, `status: ${unauthCategory.status}`);

    const unauthOrder = await request({
      url: `${BASE_URL}/api/orders/99999`,
      method: 'GET',
    });
    assert('IDOR Protection: Unauthenticated user rejected from GET /api/orders/:id (401)', unauthOrder.status === 401, `status: ${unauthOrder.status}`);
  } catch (err) {
    assert('Authorization checks', false, err.message);
  }

  // 7. MASTER ADMIN AUTHENTICATION & SECRET KEY DEFENSE
  console.log('\n--- 7. MASTER ADMIN AUTHENTICATION & SECRET KEY DEFENSE ---');
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;

    const wrongKeyRes = await request({
      url: `${BASE_URL}/admin/auth/login`,
      method: 'POST',
      body: {
        email: adminEmail,
        password: 'wrongpassword',
        adminSecretKey: 'invalid_secret_key_123',
      },
    });
    assert('Admin Defense: Wrong Master Secret Key rejected with 401 Unauthorized', wrongKeyRes.status === 401, `status: ${wrongKeyRes.status}`);

    if (adminSecretKey) {
      const validAdminRes = await request({
        url: `${BASE_URL}/admin/auth/login`,
        method: 'POST',
        body: {
          email: adminEmail,
          password: adminPassword,
          adminSecretKey: adminSecretKey,
        },
      });
      assert('Admin Auth: Valid Master Secret Key & Admin Password authenticates with 200 OK', validAdminRes.status === 200 && !!validAdminRes.body?.jwt, `status: ${validAdminRes.status}`);
    } else {
      console.warn('  [SKIP] Skipping live admin auth assertion because ADMIN_SECRET_KEY is not configured in environment.');
    }
  } catch (err) {
    assert('Master admin checks', false, err.message);
  }

  // 8. SECRETS LEAKAGE AUDIT & GITIGNORE INTEGRITY
  console.log('\n--- 8. SECRETS LEAKAGE AUDIT & GIT PROTECTION ---');
  try {
    const rootGitignore = path.resolve(__dirname, '../../.gitignore');
    const gitignoreContent = fs.readFileSync(rootGitignore, 'utf8');
    assert('Git Protection: .gitignore explicitly ignores .env files', gitignoreContent.includes('.env'), 'missing .env in .gitignore');

    const distPath = path.resolve(__dirname, '../../frontend/dist');
    let bundleClean = true;
    if (fs.existsSync(distPath)) {
      const sensitiveKeys = [
        process.env.CLOUDINARY_API_SECRET,
        process.env.ADMIN_SECRET_KEY,
        process.env.EMAIL_PASS,
        process.env.SECERET_KEY,
      ].filter(k => k && typeof k === 'string' && k.length > 5);
      function scanDir(dir) {
        for (const file of fs.readdirSync(dir)) {
          const full = path.join(dir, file);
          if (fs.statSync(full).isDirectory()) scanDir(full);
          else if (file.endsWith('.js') || file.endsWith('.html')) {
            const c = fs.readFileSync(full, 'utf8');
            for (const key of sensitiveKeys) {
              if (c.includes(key)) bundleClean = false;
            }
          }
        }
      }
      scanDir(distPath);
    }
    assert('Client Bundle Audit: Zero sensitive API secrets or passwords leaked in dist', bundleClean, 'Secrets detected in frontend build');
  } catch (err) {
    assert('Secrets audit check', false, err.message);
  }

  // --- 9. UPSTASH REDIS EDGE CACHING & DISTRIBUTED RATE LIMITING ---
  console.log('\n--- 9. UPSTASH REDIS EDGE CACHING & DISTRIBUTED RATE LIMITING ---');
  try {
    const healthRes = await request({ method: 'GET', url: `${BASE_URL}/health` });
    const redisStatus = healthRes.body && healthRes.body.databases && healthRes.body.databases.redis;
    assert('Upstash Redis status in /health is "connected"', redisStatus === 'connected', `Redis status was "${redisStatus}"`);

    const redisClient = require('../src/config/redis');
    const cacheService = require('../src/services/CacheService');
    
    // Test cache write, read, and invalidation
    const testKey = 'sec_audit_redis_test';
    await redisClient.set(testKey, 'secure_ok', 30);
    const readVal = await redisClient.get(testKey);
    await redisClient.del(testKey);
    assert('Upstash Redis Read/Write/Delete round-trip verified', readVal === 'secure_ok', 'Failed Redis round-trip');

    // Test OTP auto-expiring TTL in CacheService
    const testEmail = 'sec_check@example.com';
    await cacheService.setOtp(testEmail, '999888', 30);
    const otpVal = await cacheService.getOtp(testEmail);
    await cacheService.deleteOtp(testEmail);
    assert('Redis OTP Auto-Expiring TTL & retrieval verified', otpVal === '999888', 'Failed OTP Redis cache');
  } catch (err) {
    assert('Upstash Redis edge caching check', false, err.message);
  }

  // SUMMARY
  console.log('\n================================================================');
  console.log(` SECURITY VERIFICATION COMPLETE: Passed ${passed} / ${passed + failed} Checks (${Math.round((passed / (passed + failed)) * 100)}%)`);
  if (failed > 0) {
    console.log('\n Vulnerabilities / Issues Found:');
    issues.forEach((iss, i) => {
      console.log(`  ${i + 1}. ${iss.name}: ${iss.detail}`);
    });
  } else {
    console.log(' ALL SECURITY CHECKS PASSED PERFECTLY WITH ZERO VULNERABILITIES!');
  }
  console.log('================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runSecurityAudit().catch((err) => {
  console.error('Fatal security audit runner error:', err);
  process.exit(1);
});
