import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { GoogleLogin } from '@react-oauth/google';
import { apiService } from '../services/api';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setError('');
    setIsLoading(true);

    try {
      const response = await apiService.googleLogin(credentialResponse.credential);
      const data = response.data;
      const { isNewUser } = data;

      if (isNewUser) {
        navigate('/profile-setup', { state: { googleData: data.googleData } });
      } else {
        const { token, user } = data;
        localStorage.setItem('token', token);
        useAuthStore.getState().login(token, user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Google Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏛️</div>
          <h1 className="text-2xl font-bold text-green-800">Kerala Election Predictor</h1>
          <p className="text-sm text-gray-600 mt-2">Sign in to make your predictions</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></span>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>
        )}
      </div>
    </div>
  );
}
