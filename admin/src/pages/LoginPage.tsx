import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getAccessToken } from '../lib/api';
import { useAuth } from '../lib/auth';
import { btnPrimary, inputClass } from '../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (getAccessToken()) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await login(String(form.get('login')), String(form.get('password')));
    setPending(false);
    if (result.ok) navigate('/');
    else setError(result.message ?? 'Login failed');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Admin sign in</h1>
        <p className="mb-6 text-sm text-slate-500">Fleet App operations</p>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-slate-600">Login</span>
          <input name="login" required className={inputClass} autoComplete="username" />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-600">Password</span>
          <input name="password" type="password" required className={inputClass} autoComplete="current-password" />
        </label>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button className={`${btnPrimary} w-full py-2`} disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
