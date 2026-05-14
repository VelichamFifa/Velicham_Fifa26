import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '256211048883-phsgjqmft45dkbtdp43s202j6ep7tm25.apps.googleusercontent.com';

  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setError('');

    try {
      const response = await apiService.googleLogin(credentialResponse.credential);
      const user = response.data.user;
      login(response.data.token, user);

      // Check if user needs to complete profile (backend sets these to 'Not Set' for new Google users)
      if (user.city === 'Not Set' || user.state === 'Not Set' || user.country === 'Not Set') {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Login failed');
    }
  };

  const handleGoogleError = () => {
    setError('Google Login was unsuccessful. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">
          Login to Velicham Fifa'26 Prediction
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4 flex flex-col items-center mt-2">
          <div className="w-full flex justify-center">
            {googleClientId ? (
              <div className="origin-center" aria-label="Google login button">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="outline"
                  text="continue_with"
                  size="large"
                  shape="pill"
                  width="260"
                />
              </div>
            ) : (
              <div className="w-full text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-center">
                Google login is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend env.
              </div>
            )}
          </div>
          <button
            aria-label="Instagram login"
            className="w-[260px] h-11 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <svg
              className="w-6 h-6 text-pink-600"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7.75 2h8.5A5.756 5.756 0 0 1 22 7.75v8.5A5.756 5.756 0 0 1 16.25 22h-8.5A5.756 5.756 0 0 1 2 16.25v-8.5A5.756 5.756 0 0 1 7.75 2Zm8.5 1.5h-8.5A4.254 4.254 0 0 0 3.5 7.75v8.5a4.254 4.254 0 0 0 4.25 4.25h8.5a4.254 4.254 0 0 0 4.25-4.25v-8.5a4.254 4.254 0 0 0-4.25-4.25Zm-4.25 3.25A5.25 5.25 0 1 1 6.75 12 5.256 5.256 0 0 1 12 6.75Zm0 1.5A3.75 3.75 0 1 0 15.75 12 3.754 3.754 0 0 0 12 8.25Zm5.38-2.12a1.12 1.12 0 1 1-1.12 1.12 1.122 1.122 0 0 1 1.12-1.12Z" />
            </svg>
            <span>Continue with Instagram</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
