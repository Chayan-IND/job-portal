import { useEffect, useState } from 'react';
import { getMyCompanyProfile, updateMyCompanyProfile, uploadLogo } from '../api/profiles';
import { useToast } from '../context/ToastContext';

export default function CompanyProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ companyName: '', industry: '', website: '', description: '' });
  const [saveState, setSaveState] = useState('idle');
  const [uploadState, setUploadState] = useState('idle');

  useEffect(() => {
    getMyCompanyProfile().then((res) => {
      const p = res.data.profile;
      setProfile(p);
      setForm({
        companyName: p.companyName || '',
        industry: p.industry || '',
        website: p.website || '',
        description: p.description || '',
      });
    });
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveState('saving');
    try {
      const res = await updateMyCompanyProfile(form);
      setProfile(res.data.profile);
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaveState('idle');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadState('uploading');
    try {
      const res = await uploadLogo(file);
      setProfile(res.data.profile);
      toast.success('Logo updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo upload failed.');
    } finally {
      setUploadState('idle');
    }
  };

  if (!profile) return <div className="mx-auto max-w-xl px-6 py-16 text-ink-light">Loading…</div>;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl mb-8">Company profile</h1>

      <div className="border border-hairline rounded-sm p-6 mb-8 bg-white flex items-center gap-4">
        {profile.logoUrl ? (
          <img src={profile.logoUrl} alt="Company logo" className="h-16 w-16 object-contain rounded-sm border border-hairline" />
        ) : (
          <div className="h-16 w-16 rounded-sm border border-dashed border-hairline flex items-center justify-center text-xs text-ink-light">
            No logo
          </div>
        )}
        <div>
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
          {uploadState === 'uploading' && <p className="text-sm text-ink-light mt-1">Uploading…</p>}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm text-ink-light mb-1">Company name</label>
          <input required value={form.companyName} onChange={update('companyName')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Industry</label>
          <input value={form.industry} onChange={update('industry')}
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Website</label>
          <input value={form.website} onChange={update('website')} placeholder="https://"
            className="w-full border border-hairline rounded-sm px-4 py-2.5 text-sm focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={update('description')}
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
