import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerUser, clearAuthError } from '../authSlice';
import AuthLayout from './AuthLayout';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'Name is too long'),
  emailId: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join and start practicing today"
      footerText="Already have an account?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      {error && (
        <div className="auth-error-banner" role="alert">
          {typeof error === 'string' ? error : 'Registration failed. Please try again.'}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-field">
          <label htmlFor="firstName">First name</label>
          <div className="auth-input-wrap">
            <User className="input-icon" aria-hidden />
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Alex"
              className={errors.firstName ? 'auth-input-error' : ''}
              {...register('firstName')}
            />
          </div>
          {errors.firstName && (
            <p className="auth-field-error">{errors.firstName.message}</p>
          )}
        </div>

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
              autoComplete="new-password"
              placeholder="At least 6 characters"
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
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Signup;
