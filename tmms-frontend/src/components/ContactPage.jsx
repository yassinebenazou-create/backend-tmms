import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendContactMessage } from '../api/contactApi';

function ContactPage({ user, t }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email
    }));
  }, [user?.name, user?.email]);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await sendContactMessage(form);
      toast.success(t ? t('contactSentSuccess') : 'Message sent successfully');
      setForm((prev) => ({ ...prev, subject: '', message: '' }));
    } catch (error) {
      toast.error(error?.response?.data?.message || (t ? t('contactSentFailed') : 'Failed to send message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Contact</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Get in touch with the TMMS team for support, integration, or enterprise inquiries.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Contact Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="h-4 w-4" />
              hbouchi@tmmsgroup.ma
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="h-4 w-4" />
              +212 6 00 00 00 00
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="h-4 w-4" />
              Casablanca, Morocco
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="glass-card rounded-2xl p-5 lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Send us a message</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              required
              placeholder="Your name"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              required
              type="email"
              placeholder="Your email"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <input
            value={form.subject}
            onChange={(e) => onChange('subject', e.target.value)}
            required
            placeholder="Subject"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <textarea
            value={form.message}
            onChange={(e) => onChange('message', e.target.value)}
            required
            rows={6}
            placeholder="Write your message..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {loading ? (t ? t('contactSending') : 'Sending...') : (t ? t('contactSend') : 'Send Message')}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ContactPage;
