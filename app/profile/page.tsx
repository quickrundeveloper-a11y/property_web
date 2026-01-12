"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    mobile: "",
    agreeToTerms: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.isAnonymous)) {
      router.push("/auth");
      return;
    }

    if (user && !user.isAnonymous) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "property_All", "main", "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          name: data.name || user.displayName || "",
          email: user.email || "",
          countryCode: data.countryCode || "+91",
          mobile: data.mobile || "",
          agreeToTerms: data.agreeToTerms || false,
        });
      } else {
        setFormData(prev => ({
          ...prev,
          name: user.displayName || "",
          email: user.email || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }
    
    setSaving(true);
    setMessage(null);

    try {
      if (user.displayName !== formData.name) {
        await updateProfile(user, { displayName: formData.name });
      }

      const docRef = doc(db, "property_All", "main", "users", user.uid);
      await setDoc(docRef, {
        name: formData.name,
        email: formData.email,
        countryCode: formData.countryCode,
        mobile: formData.mobile,
        agreeToTerms: formData.agreeToTerms,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: 'error', text: 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: "New passwords don't match." });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: "Password must be at least 6 characters." });
      return;
    }

    setSaving(true);
    setPasswordMessage(null);

    try {
      // Direct password update without re-authentication (requires recent login)
      await updatePassword(user, passwordData.newPassword);
      
      setPasswordMessage({ type: 'success', text: "Password updated successfully." });
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/requires-recent-login') {
        setPasswordMessage({ type: 'error', text: "For security, please log out and log back in to change your password." });
      } else {
        setPasswordMessage({ type: 'error', text: "Failed to update password. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <label htmlFor="name" className="md:col-span-3 block text-sm font-semibold text-gray-700 md:text-right">
              Name<span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-9">
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2.5"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <label htmlFor="email" className="md:col-span-3 block text-sm font-semibold text-gray-700 md:text-right">
              Email<span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-9">
              <input
                type="email"
                id="email"
                value={formData.email}
                disabled
                className="block w-full bg-gray-50 border-gray-300 text-gray-600 rounded-md shadow-sm sm:text-sm border p-2.5 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <label htmlFor="mobile" className="md:col-span-3 block text-sm font-semibold text-gray-700 md:text-right">
              Mobile Number<span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-9 flex">
              <div className="relative">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                  className="block w-[110px] border-gray-300 rounded-l-md border-r-0 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2.5 bg-white appearance-none"
                >
                  <option value="+91">+91 IND</option>
                  <option value="+1">+1 USA</option>
                  <option value="+44">+44 UK</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <input
                type="tel"
                id="mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="block w-full border-gray-300 rounded-r-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2.5"
                placeholder="Mobile number"
              />
            </div>
          </div>

          {/* Agreement */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3"></div>
            <div className="md:col-span-9">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agree" className="font-medium text-gray-700 leading-relaxed">
                    I agree to be contacted by Hommie for similar properties or related services via WhatsApp, phone (overriding NDNC registration), sms, e-mail etc.
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3"></div>
            <div className="md:col-span-9">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2.5 px-8 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3"></div>
            <div className="md:col-span-9 space-y-4">
              
              {/* Change Password Link */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showPasswordChange ? 'Cancel Change Password' : 'Change Password'}
                </button>
              </div>

              {/* Password Change Form */}
              {showPasswordChange && (
                <div className="bg-gray-50 p-6 rounded-md border border-gray-200 mt-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  {passwordMessage && (
                    <div className={`mb-4 p-2 rounded text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {passwordMessage.text}
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Password</label>
                      <input
                        type="password"
                        required
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2.5"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm text-gray-600">
                  To delete your account, <button className="text-blue-600 hover:underline font-medium">click here</button>
                </p>
              </div>
              
              <div>
                 <p className="text-xs text-gray-500">
                  By clicking you agree to <a href="#" className="text-blue-600 hover:underline font-medium">Terms and Conditions</a>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}