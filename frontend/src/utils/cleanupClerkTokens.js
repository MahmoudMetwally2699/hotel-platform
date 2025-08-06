/**
 * Cleanup Clerk Tokens Utility
 * Removes Clerk authentication tokens that might interfere with our authentication system
 */

/**
 * Clean up Clerk tokens from localStorage and cookies
 */
export const cleanupClerkTokens = () => {
  try {
    console.log('🧹 Cleaning up Clerk tokens...');

    // List of Clerk-related keys that might be in localStorage
    const clerkKeys = [
      '__clerk_client_jwt',
      '__clerk_session',
      '__clerk_db_jwt',
      '__client_uat',
      '__session'
    ];

    // Remove from localStorage
    clerkKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed ${key} from localStorage`);
      }
    });

    // Note: We can't remove HTTP-only cookies from JavaScript
    // But we can avoid reading them in our authentication logic

    console.log('✅ Clerk tokens cleanup completed');
  } catch (error) {
    console.warn('⚠️ Error during Clerk tokens cleanup:', error);
  }
};

/**
 * Check if a token appears to be a Clerk token
 * @param {string} token - Token to check
 * @returns {boolean} - True if it looks like a Clerk token
 */
export const isClerkToken = (token) => {
  if (!token || typeof token !== 'string') return false;

  // Clerk tokens are typically not JWTs (don't have 3 parts separated by dots)
  // and often have specific patterns
  const isJWT = token.split('.').length === 3;

  // Clerk tokens are often shorter and don't follow JWT format
  const looksLikeClerk = !isJWT && (
    token.length < 100 || // Clerk session tokens are often shorter
    token.startsWith('dvb_') ||
    token.startsWith('sess_') ||
    token.startsWith('user_')
  );

  return looksLikeClerk;
};

const clerkTokenUtils = {
  cleanupClerkTokens,
  isClerkToken
};

export default clerkTokenUtils;
