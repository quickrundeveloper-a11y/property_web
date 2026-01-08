"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Firebase
import { auth, db } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// TypeScript interfaces
interface AuthState {
  mode: 'login' | 'signup';
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // Initialize state with default values
  const [authState, setAuthState] = useState<AuthState>({
    mode: 'login',
    email: '',
    password: '',
    confirmPassword: '',
    loading: false,
    errors: {}
  });

  // Handle mounting and URL parameters
  useEffect(() => {
    setMounted(true);
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup' || urlMode === 'login') {
      setAuthState(prev => ({ ...prev, mode: urlMode }));
    }
  }, [searchParams]);

  // Update URL when mode changes (client-side only)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('mode', authState.mode);
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [authState.mode, mounted]);

  // Mode switching function
  const switchMode = (newMode: 'login' | 'signup') => {
    setAuthState(prev => ({
      ...prev,
      mode: newMode,
      errors: {} // Clear errors when switching modes
    }));
  };

  // Form field update function with real-time validation
  const updateField = (field: keyof Pick<AuthState, 'email' | 'password' | 'confirmPassword'>, value: string) => {
    setAuthState(prev => {
      const newState = {
        ...prev,
        [field]: value,
        errors: {
          ...prev.errors,
          [field]: undefined // Clear field-specific error
        }
      };

      // Real-time validation for better UX
      if (field === 'email' && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newState.errors.email = 'Please enter a valid email address';
        }
      }

      if (field === 'password' && value) {
        if (value.length < 6) {
          newState.errors.password = 'Password should be at least 6 characters';
        }
      }

      if (field === 'confirmPassword' && value && prev.mode === 'signup') {
        if (value !== prev.password) {
          newState.errors.confirmPassword = 'Passwords do not match';
        }
      }

      // Also validate confirm password when password changes
      if (field === 'password' && prev.confirmPassword && prev.mode === 'signup') {
        if (value !== prev.confirmPassword) {
          newState.errors.confirmPassword = 'Passwords do not match';
        } else {
          newState.errors.confirmPassword = undefined;
        }
      }

      return newState;
    });
  };

  // Check if form is valid for submit button state
  const isFormValid = (): boolean => {
    const { email, password, confirmPassword, mode } = authState;
    
    // Basic field requirements
    if (!email || !password) return false;
    
    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    
    // Password length validation
    if (password.length < 6) return false;
    
    // Confirm password validation for signup
    if (mode === 'signup') {
      if (!confirmPassword || password !== confirmPassword) return false;
    }
    
    return true;
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: AuthState['errors'] = {};
    
    // Email validation
    if (!authState.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authState.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!authState.password) {
      errors.password = 'Password is required';
    } else if (authState.password.length < 6) {
      errors.password = 'Password should be at least 6 characters';
    }
    
    // Confirm password validation (signup only)
    if (authState.mode === 'signup') {
      if (!authState.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (authState.password !== authState.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setAuthState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    setAuthState(prev => ({ ...prev, loading: true, errors: {} }));

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Ensure Firestore document exists
      const userRef = doc(db, "users", user.email!.toLowerCase());
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // Create user document
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email!.toLowerCase(),
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: "google",
          createdAt: serverTimestamp(),
        });
      } else {
        // Update last login time
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        }, { merge: true });
      }

      // Success callback and redirect
      router.push("/home");

    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      let errorMessage = 'An error occurred with Google sign in. Please try again.';
      
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled.';
      } else if (firebaseError.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      }
      
      setAuthState(prev => ({
        ...prev,
        errors: { general: errorMessage }
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };
  // Handle authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setAuthState(prev => ({ ...prev, loading: true, errors: {} }));

    try {
      const emailKey = authState.email.toLowerCase();
      let userCredential;

      if (authState.mode === 'signup') {
        // Create new user account
        userCredential = await createUserWithEmailAndPassword(
          auth,
          emailKey,
          authState.password
        );
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(
          auth,
          emailKey,
          authState.password
        );
      }

      const user = userCredential.user;

      // Ensure Firestore document exists
      const userRef = doc(db, "users", emailKey);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // Create user document with appropriate metadata
        const userData: Record<string, unknown> = {
          uid: user.uid,
          email: emailKey,
          provider: "password",
          createdAt: serverTimestamp(),
        };

        // Add lastLoginAt for existing users logging in
        if (authState.mode === 'login') {
          userData.lastLoginAt = serverTimestamp();
        }

        await setDoc(userRef, userData);
      } else if (authState.mode === 'login') {
        // Update last login time for existing users
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        }, { merge: true });
      }

      // Success callback and redirect
      router.push("/home");

    } catch (error: unknown) {
      let errorMessage = 'An error occurred. Please try again.';
      
      // Type guard for Firebase error
      const firebaseError = error as { code?: string };
      
      // Signup-specific errors
      if (authState.mode === 'signup') {
        if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists. Try logging in instead.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address';
        }
      } 
      // Login-specific errors
      else {
        if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'Invalid email or password';
        } else if (firebaseError.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (firebaseError.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled. Please contact support.';
        }
      }
      
      setAuthState(prev => ({
        ...prev,
        errors: { general: errorMessage }
      }));
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authState.mode === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authState.mode === 'signup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-semibold mb-2 text-center text-gray-900">
          {authState.mode === 'login' ? 'Log in to Hommie' : 'Create your account'}
        </h2>

        <p className="text-sm text-gray-500 mb-6 text-center">
          {authState.mode === 'login' 
            ? 'Enter your details below' 
            : 'Enter your details to get started'
          }
        </p>

        {/* General Error */}
        {authState.errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{authState.errors.general}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          {/* Email Field */}
          <div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full py-3 px-4 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                authState.errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              value={authState.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
            {authState.errors.email && (
              <p className="text-sm text-red-600 mt-1">{authState.errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <input
              type="password"
              placeholder="Password"
              className={`w-full py-3 px-4 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                authState.errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              value={authState.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
            />
            {authState.errors.password && (
              <p className="text-sm text-red-600 mt-1">{authState.errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field (Signup only) */}
          {authState.mode === 'signup' && (
            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                className={`w-full py-3 px-4 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  authState.errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                value={authState.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
              />
              {authState.errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{authState.errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={authState.loading || !isFormValid()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed w-full hover:bg-blue-700 transition-colors font-semibold"
          >
            {authState.loading 
              ? (authState.mode === 'login' ? 'Logging in...' : 'Creating account...') 
              : (authState.mode === 'login' ? 'Log in' : 'Create account')
            }
          </button>
        </form>

        {/* Google Sign Up Button (Signup only) */}
        {authState.mode === 'signup' && (
          <>
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={authState.loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {authState.loading ? 'Signing up...' : 'Continue with Google'}
            </button>
          </>
        )}

        {/* Mode Switch Text */}
        <p className="text-sm mt-4 text-center text-gray-600">
          {authState.mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}