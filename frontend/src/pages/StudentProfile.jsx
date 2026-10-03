import { useEffect, useState } from 'react';
import { getMyStudentProfile, updateMyStudentProfile, uploadResume } from '../api/profiles';
import { useToast } from '../context/ToastContext';

export default function StudentProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ phone: '', university: '', graduationYear: '', skills: '', bio: '' });
  const [saveState, setSaveState] = useState('idle');
  const [uploadState, setUploadState] = useState('idle');

  useEffect(() => {
    getMyStudentProfile().then((res) => {
      const p = res.data.profile;
      setProfile(p);
      setForm({
        phone: p.phone || '',
        university: p.university || '',
        graduationYear: p.graduationYear || '',
        skills: (p.skills || []).join(', '),
        bio: p.bio || '',
      });
    });
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveState('saving');
    try {
      const res = await updateMyStudentProfile({
        ...form,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        skills: form.skills ? form.skills.split(',').map((s) => s.trim()) : [],
      });
      setProfile(res.data.profile);
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaveState('idle');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadState('uploading');
    try {
      const res = await uploadResume(file);
      setProfile(res.data.profile);
      toast.success('Resume updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resume upload failed.');
    } finally {
      setUploadState('idle');
    }
  };

  if (!profile) return <div className="mx-auto max-w-xl px-6 py-16 text-ink-light">Loading…</div>;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl mb-8">My profile</h1>

      <div className="border border-hairline rounded-sm p-6 mb-8 bg-white">
        <h2 className="font-medium mb-3">Resume</h2>
        {profile.resumeUrl ? (
          <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline text-sm">
            View current resume
          </a>
        ) : (
          <p className="text-sm text-ink-light mb-2">No resume uploaded yet — required before applying to jobs.</p>
        )}
        <div className="mt-3">
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="text-sm" />
          {uploadState === 'uploading' && <p className="text-sm text-ink-light mt-1">Uploading…</p>}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm text-ink-light mb-1">Phone</label>
          <input value={form.phone} onChange={update('phone')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">University</label>
          <input value={form.university} onChange={update('university')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Graduation year</label>
          <input type="number" value={form.graduationYear} onChange={update('graduationYear')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Skills (comma-separated)</label>
          <input value={form.skills} onChange={update('skills')} placeholder="react, node.js, sql"
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Bio</label>
          <textarea rows={4} value={form.bio} onChange={update('bio')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <button type="submit" disabled={saveState === 'saving'}
          className="bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-ink-light transition-colors disabled:opacity-50">
          {saveState === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
