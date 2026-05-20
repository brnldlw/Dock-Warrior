import { useState } from 'react'
import { Mail, MessageSquare, Shield, Phone, Send, CheckCircle } from 'lucide-react'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(form.subject || 'DockWarrior Contact')
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    )
    window.location.href = `mailto:contact@dockwarrior.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Mail size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Contact Us</h2>
        <p>Questions, feedback, fleet inquiries, or partnership ideas — we want to hear from you.</p>
      </div>

      <div className="contact-layout">
        <div className="contact-form-wrap">
          {submitted ? (
            <div className="card contact-success">
              <CheckCircle size={48} style={{ color: 'var(--green)', marginBottom: 16 }} />
              <h3>Message Ready to Send</h3>
              <p>Your email client should have opened with your message pre-filled. If it did not open, email us directly at <a href="mailto:contact@dockwarrior.com" style={{ color: 'var(--orange)' }}>contact@dockwarrior.com</a></p>
              <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setSubmitted(false)}>
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="card contact-form">
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input
                      className="form-input"
                      placeholder="John Smith"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                    <option value="">Select a topic</option>
                    <option value="General Question">General Question</option>
                    <option value="Fleet Pricing Inquiry">Fleet Pricing Inquiry</option>
                    <option value="Partnership Opportunity">Partnership Opportunity</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Media Inquiry">Media Inquiry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea
                    className="form-input"
                    placeholder="Tell us what is on your mind..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={6}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={18} /> Send Message
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="contact-sidebar">
          <div className="card contact-info">
            <h3 className="contact-info-title">Get In Touch</h3>
            <div className="contact-methods">
              <a href="mailto:contact@dockwarrior.com" className="contact-method">
                <Mail size={20} style={{ color: 'var(--orange)' }} />
                <div>
                  <div className="contact-method-label">General</div>
                  <div className="contact-method-value">contact@dockwarrior.com</div>
                </div>
              </a>
              <a href="mailto:fleet@dockwarrior.com" className="contact-method">
                <Shield size={20} style={{ color: 'var(--orange)' }} />
                <div>
                  <div className="contact-method-label">Fleet Sales</div>
                  <div className="contact-method-value">fleet@dockwarrior.com</div>
                </div>
              </a>
              <a href="mailto:support@dockwarrior.com" className="contact-method">
                <MessageSquare size={20} style={{ color: 'var(--orange)' }} />
                <div>
                  <div className="contact-method-label">Support</div>
                  <div className="contact-method-value">support@dockwarrior.com</div>
                </div>
              </a>
            </div>
          </div>

          <div className="card contact-faq">
            <h3 className="contact-info-title">Quick Answers</h3>
            <div className="contact-faqs">
              {[
                { q: 'How do I cancel Pro?', a: 'Email us at support@dockwarrior.com and we will cancel immediately with no fees.' },
                { q: 'How do I report a bad review?', a: 'Email contact@dockwarrior.com with the facility name and review details.' },
                { q: 'Can I get fleet pricing?', a: 'Yes — email fleet@dockwarrior.com for custom fleet and enterprise pricing.' },
                { q: 'How do I update my facility info?', a: 'Use the Add a Dock feature or email us and we will update it manually.' },
              ].map((item, i) => (
                <div key={i} className="contact-faq-item">
                  <div className="contact-faq-q">{item.q}</div>
                  <div className="contact-faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
