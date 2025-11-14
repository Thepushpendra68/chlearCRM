/**
 * Authentication Diagnostics Utility
 * Helps debug authentication issues
 */

import { getCachedSession, ensureSessionInitialized } from '../config/supabase';
import supabase from '../config/supabase';

export async function runAuthDiagnostics() {
  console.log('🔍 [AUTH DIAGNOSTICS] Starting authentication diagnostics...\n');

  // 1. Check session initialization
  console.log('1️⃣ Checking session initialization...');
  try {
    await ensureSessionInitialized();
    console.log('✅ Session initialization successful');
  } catch (error) {
    console.error('❌ Session initialization failed:', error);
    return { success: false, error: 'Session initialization failed' };
  }

  // 2. Get cached session
  console.log('\n2️⃣ Checking cached session...');
  const session = getCachedSession();
  if (!session) {
    console.error('❌ No cached session found');
    return { success: false, error: 'No session found' };
  }
  console.log('✅ Session found:', {
    hasAccessToken: !!session.access_token,
    hasRefreshToken: !!session.refresh_token,
    tokenLength: session.access_token?.length || 0,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none',
    expiresIn: session.expires_at ? Math.round((session.expires_at * 1000 - Date.now()) / 1000) : 'none',
    user: session.user?.email || 'unknown'
  });

  // 3. Check token expiration
  console.log('\n3️⃣ Checking token expiration...');
  if (session.expires_at) {
    const expiresIn = session.expires_at * 1000 - Date.now();
    if (expiresIn < 0) {
      console.error('❌ Token has expired');
      console.log('   Expired:', Math.abs(Math.round(expiresIn / 1000)), 'seconds ago');
    } else if (expiresIn < 60000) {
      console.warn('⚠️ Token expiring soon:', Math.round(expiresIn / 1000), 'seconds');
    } else {
      console.log('✅ Token is valid for', Math.round(expiresIn / 1000), 'seconds');
    }
  } else {
    console.warn('⚠️ No expiration time found in session');
  }

  // 4. Test token refresh
  console.log('\n4️⃣ Testing token refresh capability...');
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('❌ Token refresh failed:', error.message);
      return { success: false, error: `Token refresh failed: ${error.message}` };
    }
    console.log('✅ Token refresh successful');
    if (data?.session) {
      console.log('   New token expires in:', 
        data.session.expires_at ? Math.round((data.session.expires_at * 1000 - Date.now()) / 1000) : 'unknown', 
        'seconds'
      );
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return { success: false, error: `Token refresh error: ${error.message}` };
  }

  // 5. Decode token (basic check)
  console.log('\n5️⃣ Checking token structure...');
  try {
    const tokenParts = session.access_token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid token format (should have 3 parts)');
      return { success: false, error: 'Invalid token format' };
    }
    console.log('✅ Token has correct structure (header.payload.signature)');
    
    // Decode payload (without verification)
    const payload = JSON.parse(atob(tokenParts[1]));
    console.log('   Token payload:', {
      sub: payload.sub,
      email: payload.email,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none',
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'none',
      role: payload.role || payload.app_metadata?.role || 'none'
    });
  } catch (error) {
    console.error('❌ Failed to decode token:', error);
    return { success: false, error: `Token decode error: ${error.message}` };
  }

  console.log('\n✅ [AUTH DIAGNOSTICS] All checks passed!');
  return { success: true, session };
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  window.runAuthDiagnostics = runAuthDiagnostics;
}

