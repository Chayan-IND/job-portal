import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/');
      toast.success('Account created.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-serif text-3xl mb-8">Create an account</h1>
      <div className="flex gap-2 mb-6">
        {['student', 'company'].map((role) => (
          <button key={role} type="button" onClick={() => setForm((f) => ({ ...f, role }))}
            className={`flex-1 border rounded-sm py-2 text-sm capitalize transition-colors ${
              form.role === role ? 'border-gold bg-gold/10 text-gold-dark font-medium' : 'border-hairline text-ink-light hover:border-ink/30'
            }`}>
            {role}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-ink-light mb-1">{form.role === 'company' ? 'Contact name' : 'Full name'}</label>
          <input type="text" required value={form.name} onChange={update('name')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Email</label>
          <input type="email" required value={form.email} onChange={update('email')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Password</label>
          <input type="password" required minLength={8} value={form.password} onChange={update('password')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
          <p className="text-xs text-ink-light mt-1">At least 8 characters, with one number.</p>
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-ink-light transition-colors disabled:opacity-50">
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-ink-light mt-6">
        Already have an account? <Link to="/login" className="text-gold-dark hover:underline">Log in</Link>
      </p>
    </div>
  );
}
