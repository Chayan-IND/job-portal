import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-serif text-3xl mb-8">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-ink-light mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-ink-light transition-colors disabled:opacity-50">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-sm text-ink-light mt-6">
        Don&apos;t have an account? <Link to="/register" className="text-gold-dark hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
