import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginUser, clearAuthError } from '../authSlice';
import AuthLayout from './AuthLayout';

const loginSchema = z.object({
  emailId: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue solving problems"
      footerText="Don't have an account?"
      footerLink="/signup"
      footerLabel="Create one"
    >
      {error && (
        <div className="auth-error-banner" role="alert">
          {typeof error === 'string' ? error : 'Login failed. Please try again.'}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-field">
          <label htmlFor="emailId">Email</label>
          <div className="auth-input-wrap">
            <Mail className="input-icon" aria-hidden />
            <input
              id="emailId"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={errors.emailId ? 'auth-input-error' : ''}
              {...register('emailId')}
            />
          </div>
          {errors.emailId && (
            <p className="auth-field-error">{errors.emailId.message}</p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrap">
            <Lock className="input-icon" aria-hidden />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={errors.password ? 'auth-input-error' : ''}
              {...register('password')}
            />
            <button
              type="button"
              className="toggle-pwd"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="auth-field-error">{errors.password.message}</p>
          )}
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="auth-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
