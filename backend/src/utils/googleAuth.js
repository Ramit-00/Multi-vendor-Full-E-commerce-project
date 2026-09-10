const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '419260446565-cl1c50pj66oos65k7uo87va62enhivit.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

/**
 * Verifies a Google ID Token (credential) and returns the verified user payload.
 * Supports a test mock bypass for automated test suites when credential starts with mock_google_token:.
 *
 * @param {string} token - Google ID token or mock test token
 * @returns {Promise<{ email: string, name: string, picture: string, emailVerified: boolean }>}
 */
async function verifyGoogleIdToken(token) {
  if (!token) {
    throw new Error('Google credential token is required');
  }

  // Only permit mock tokens in explicit isolated automated unit test runner
  if (process.env.NODE_ENV === 'test' && process.env.ALLOW_TEST_MOCKS === 'true' && typeof token === 'string' && token.startsWith('mock_google_token:')) {
    const parts = token.split(':');
    const mockEmail = parts[1] || 'mockuser@example.com';
    const mockName = parts[2] || 'Mock Google User';
    return {
      email: mockEmail.toLowerCase().trim(),
      name: mockName,
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      emailVerified: true,
    };
  }

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google credential payload');
  }

  return {
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || '',
    emailVerified: Boolean(payload.email_verified),
  };
}

module.exports = {
  verifyGoogleIdToken,
  CLIENT_ID,
};
