import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store.js';
import api from '../services/api.js';
import { FiMail, FiLock, FiLogIn, FiUser, FiPhone } from 'react-icons/fi';
import { Button, Input, Alert } from '../components/index';

export function LoginPage() {
  const navigate = useNavigate();
  const setToken = useStore((state: any) => state.setToken);
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginData, setLoginData] = useState({ email: '', pin: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    pin: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.loginMerchant(loginData.email, loginData.pin);
      const { token, merchant } = response.data;
      setToken(token, merchant.id, merchant.name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.registerMerchant(
        registerData.name,
        registerData.email,
        registerData.phone,
        registerData.pin
      );
      const { token, merchant } = response.data;
      setToken(token, merchant.id, merchant.name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-white">
      <div className="lg:w-[44%] bg-gradient-to-br from-[#ccfbf1] via-[#e0f2fe] to-[#f8fafc] flex flex-col justify-center px-10 py-14 lg:py-10 border-b lg:border-b-0 lg:border-r border-slate-100">
        <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto lg:mr-12">
          <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-xl shadow-lg mb-6">🍴</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">DineFlow</h1>
          <p className="text-slate-600 font-medium mt-2 text-[15px]">Restaurant Edition</p>
          <p className="text-slate-500 text-sm mt-6 leading-relaxed">
            POS, loyalty, and CRM in one calm workspace — built for teams who want clarity at the register and in the
            back office.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#fafbfc]">
        <div className="w-full max-w-md">
          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError(null)} />
            </div>
          )}

          <div className="df-card p-8 lg:p-10">
            {isRegister ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Create account</h2>

                <Input
                  label="Restaurant Name"
                  icon={FiUser}
                  placeholder="Your Restaurant Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  icon={FiMail}
                  placeholder="you@restaurant.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />

                <Input
                  label="Phone"
                  type="tel"
                  icon={FiPhone}
                  placeholder="+1 (555) 000-0000"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  required
                />

                <Input
                  label="PIN (4 digits)"
                  type="password"
                  icon={FiLock}
                  placeholder="••••"
                  maxLength={4}
                  value={registerData.pin}
                  onChange={(e) => setRegisterData({ ...registerData, pin: e.target.value })}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full flex items-center justify-center gap-2 mt-2"
                >
                  <FiLogIn /> Create Account
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className="w-full text-[13px] font-semibold text-teal-800 hover:text-teal-900 py-2"
                >
                  Already have an account? Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Welcome back</h2>

                <Input
                  label="Email"
                  type="email"
                  icon={FiMail}
                  placeholder="you@restaurant.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />

                <Input
                  label="PIN"
                  type="password"
                  icon={FiLock}
                  placeholder="••••"
                  maxLength={4}
                  value={loginData.pin}
                  onChange={(e) => setLoginData({ ...loginData, pin: e.target.value })}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full flex items-center justify-center gap-2 mt-2"
                >
                  <FiLogIn /> Login
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className="w-full text-[13px] font-semibold text-teal-800 hover:text-teal-900 py-2"
                >
                  Don&apos;t have an account? Sign up
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-slate-400 text-xs mt-8">© 2026 DineFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
