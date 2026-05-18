import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { FileText, Download, Send, Clock, DollarSign, Zap, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import './DetentionInvoice.css'

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export default function DetentionInvoice() {
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const [logs, setLogs] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    driver_name: '',
    driver_company: '',
    driver_address: '',
    driver_phone: '',
    driver_email: '',
    mc_number: '',
    detention_rate: '50',
    invoice_number: '',
    notes: ''
  })

  useEffect(() => {
    if (user) {
      fetchLogs()
      prefillDriverInfo()
    }
  }, [user])

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('detention_logs')
      .select('*')
      .eq('user_id', user.id)
      .gt('detention_minutes', 0)
      .order('created_at', { ascending: false })
      .limit(20)
    setLogs(data || [])
    setLoading(false)
  }

  const prefillDriverInfo = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setForm(f => ({
        ...f,
        driver_name: data.full_name || user.user_metadata?.full_name || '',
        driver_phone: data.phone_number || ''
      }))
    }
    // Auto-generate invoice number
    const invoiceNum = `DW-${Date.now().toString().slice(-6)}`
    setForm(f => ({ ...f, invoice_number: invoiceNum }))
  }

  const generatePDF = () => {
    if (!selectedLog) { toast.error('Select a detention log first'); return }
    if (!form.driver_name) { toast.error('Enter your name'); return }

    const log = selectedLog
    const detentionHours = (log.detention_minutes / 60)
    const detentionAmount = (detentionHours * parseFloat(form.detention_rate)).toFixed(2)
    const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Detention Invoice ${form.invoice_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #FF6B00; }
  .brand { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #1a1a1a; }
  .brand span { color: #FF6B00; }
  .brand-sub { font-size: 11px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 24px; font-weight: 700; color: #FF6B00; text-transform: uppercase; letter-spacing: 2px; }
  .invoice-num { font-size: 14px; color: #888; margin-top: 4px; }
  .invoice-date { font-size: 13px; color: #444; margin-top: 2px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
  .party h3 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
  .party p { line-height: 1.8; color: #333; }
  .party strong { color: #1a1a1a; font-size: 15px; }
  .section { margin-bottom: 28px; }
  .section h3 { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f5f5f5; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #666; }
  td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #333; }
  .amount-row td { font-weight: 600; }
  .total-row { background: #FF6B00; }
  .total-row td { color: #fff; font-weight: 700; font-size: 16px; padding: 14px; }
  .timeline { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
  .timeline-item { background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 14px; text-align: center; }
  .timeline-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
  .timeline-value { font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .detention-highlight { background: #fff3ee; border: 2px solid #FF6B00; border-radius: 6px; padding: 16px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
  .detention-highlight .label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #FF6B00; }
  .detention-highlight .value { font-size: 32px; font-weight: 900; color: #FF6B00; }
  .notes-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 16px; color: #555; line-height: 1.6; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 12px; color: #888; }
  .footer-legal { font-size: 11px; color: #aaa; text-align: right; max-width: 400px; line-height: 1.5; }
  .warning-box { background: #fff8e1; border: 1px solid #ffc107; border-radius: 6px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #856404; line-height: 1.6; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand">DOCK<span>WARRIOR</span></div>
    <div class="brand-sub">Detention Invoice</div>
  </div>
  <div class="invoice-meta">
    <div class="invoice-title">Invoice</div>
    <div class="invoice-num">${form.invoice_number}</div>
    <div class="invoice-date">Date: ${invoiceDate}</div>
  </div>
</div>

<div class="parties">
  <div class="party">
    <h3>From (Carrier)</h3>
    <p>
      <strong>${form.driver_name}</strong><br>
      ${form.driver_company ? form.driver_company + '<br>' : ''}
      ${form.driver_address ? form.driver_address + '<br>' : ''}
      ${form.driver_phone ? 'Phone: ' + form.driver_phone + '<br>' : ''}
      ${form.driver_email ? 'Email: ' + form.driver_email + '<br>' : ''}
      ${form.mc_number ? 'MC#: ' + form.mc_number : ''}
    </p>
  </div>
  <div class="party">
    <h3>Bill To (Broker/Shipper)</h3>
    <p>
      <strong>${log.broker_name || 'Broker/Shipper'}</strong><br>
      ${log.load_number ? 'Load #: ' + log.load_number + '<br>' : ''}
      <br>
      Facility: ${log.facility_name}<br>
      ${log.facility_address || ''}
    </p>
  </div>
</div>

<div class="section">
  <h3>Stop Details</h3>
  <div class="timeline">
    <div class="timeline-item">
      <div class="timeline-label">Arrived</div>
      <div class="timeline-value">${formatTime(log.arrived_at)}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${new Date(log.arrived_at).toLocaleDateString()}</div>
    </div>
    <div class="timeline-item">
      <div class="timeline-label">Departed</div>
      <div class="timeline-value">${log.departed_at ? formatTime(log.departed_at) : 'N/A'}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${log.departed_at ? new Date(log.departed_at).toLocaleDateString() : ''}</div>
    </div>
    <div class="timeline-item">
      <div class="timeline-label">Free Time</div>
      <div class="timeline-value">${log.free_time_minutes} min</div>
      <div style="font-size:11px;color:#888;margin-top:2px">Per contract</div>
    </div>
  </div>

  <div class="detention-highlight">
    <div>
      <div class="label">⚠ Detention Time</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Time beyond free time allowance</div>
    </div>
    <div class="value">${formatDuration(log.detention_minutes)}</div>
  </div>
</div>

<div class="section">
  <h3>Invoice Summary</h3>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Duration</th>
        <th>Rate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr class="amount-row">
        <td>Detention Time at ${log.facility_name}</td>
        <td>${formatDuration(log.detention_minutes)}</td>
        <td>$${parseFloat(form.detention_rate).toFixed(2)}/hr</td>
        <td style="text-align:right">$${detentionAmount}</td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right;font-weight:600;color:#888">Subtotal</td>
        <td style="text-align:right;font-weight:600">$${detentionAmount}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3"><strong>TOTAL DUE</strong></td>
        <td style="text-align:right"><strong>$${detentionAmount}</strong></td>
      </tr>
    </tfoot>
  </table>
</div>

${form.notes ? `<div class="section"><h3>Notes</h3><div class="notes-box">${form.notes}</div></div>` : ''}

<div class="warning-box">
  <strong>Notice:</strong> Per 49 CFR Part 371 and standard carrier-broker agreements, detention pay is owed when a carrier is held beyond the agreed free time. This invoice represents compensation for time lost beyond the contractual free time of ${log.free_time_minutes} minutes. Failure to remit payment may result in a formal complaint filed with the FMCSA.
</div>

<div class="footer">
  <div class="footer-brand">Generated by DockWarrior · dockwarrior.com<br>The driver intelligence platform.</div>
  <div class="footer-legal">Payment due within 30 days of invoice date. Late payments subject to applicable interest. This document serves as official notice of detention charges incurred.</div>
</div>

</body>
</html>`

    // Open in new window and trigger print/save as PDF
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
    toast.success('Invoice opened — use Print > Save as PDF to download')
  }

  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>Sign in required</h3>
          <p>You need to be signed in to generate detention invoices.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 20 }}>Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><FileText size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Detention Invoice</h2>
        <p>Generate a professional detention invoice to send directly to your broker.</p>
      </div>

      {!isPro && (
        <div className="invoice-pro-banner">
          <Zap size={18} />
          <div>
            <strong>Pro Feature</strong> — Detention invoices are available to Pro members. Upgrade for $9/month.
          </div>
          <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade to Pro</Link>
        </div>
      )}

      <div className="invoice-layout">
        <div className="invoice-main">

          {/* SELECT LOG */}
          <div className="card invoice-section">
            <h3 className="invoice-section-title"><Clock size={18} /> Select Detention Stop</h3>
            {loading ? (
              <div className="loading-spinner"><div className="spinner" />Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <Clock size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <h3>No detention logs found</h3>
                <p>Use the detention timer at your next stop to create a log.</p>
                <Link to="/timer" className="btn btn-primary" style={{ marginTop: 16 }}>Open Timer</Link>
              </div>
            ) : (
              <div className="log-select-list">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`log-select-item ${selectedLog?.id === log.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="log-select-info">
                      <div className="log-select-name">{log.facility_name}</div>
                      <div className="log-select-meta">
                        {new Date(log.arrived_at).toLocaleDateString()} · {log.broker_name || 'No broker'}
                      </div>
                    </div>
                    <div className="log-select-detention">
                      <span className="badge badge-red">{formatDuration(log.detention_minutes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DRIVER INFO */}
          <div className="card invoice-section">
            <h3 className="invoice-section-title"><FileText size={18} /> Your Information</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Your Full Name *</label>
                <input className="form-input" placeholder="John Smith" value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-input" placeholder="Smith Trucking LLC" value={form.driver_company} onChange={e => setForm(f => ({ ...f, driver_company: e.target.value }))} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="555-555-5555" value={form.driver_phone} onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" placeholder="you@email.com" value={form.driver_email} onChange={e => setForm(f => ({ ...f, driver_email: e.target.value }))} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">MC Number</label>
                <input className="form-input" placeholder="MC-123456" value={form.mc_number} onChange={e => setForm(f => ({ ...f, mc_number: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Detention Rate ($/hr)</label>
                <input className="form-input" type="number" placeholder="50" value={form.detention_rate} onChange={e => setForm(f => ({ ...f, detention_rate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea className="form-input" placeholder="Any additional details for the broker..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>

          {/* GENERATE */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={generatePDF}
            disabled={!selectedLog || !isPro}
          >
            <Download size={20} />
            {!isPro ? 'Pro Required — Upgrade to Generate' : !selectedLog ? 'Select a Stop First' : 'Generate Professional Invoice PDF'}
          </button>
        </div>

        {/* PREVIEW SIDEBAR */}
        <div className="invoice-sidebar">
          <div className="card invoice-preview-card">
            <h4 className="invoice-preview-title">Invoice Preview</h4>
            {!selectedLog ? (
              <div className="preview-empty">
                <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p>Select a detention stop to preview your invoice</p>
              </div>
            ) : (
              <div className="preview-content">
                <div className="preview-row">
                  <span>Invoice #</span>
                  <strong>{form.invoice_number}</strong>
                </div>
                <div className="preview-row">
                  <span>Facility</span>
                  <strong>{selectedLog.facility_name}</strong>
                </div>
                <div className="preview-row">
                  <span>Date</span>
                  <strong>{new Date(selectedLog.arrived_at).toLocaleDateString()}</strong>
                </div>
                <div className="preview-row">
                  <span>Detention</span>
                  <strong style={{ color: 'var(--red)' }}>{formatDuration(selectedLog.detention_minutes)}</strong>
                </div>
                <div className="preview-row">
                  <span>Rate</span>
                  <strong>${form.detention_rate}/hr</strong>
                </div>
                <div className="preview-divider" />
                <div className="preview-total">
                  <span>Total Due</span>
                  <strong style={{ color: 'var(--orange)', fontSize: 24 }}>
                    ${((selectedLog.detention_minutes / 60) * parseFloat(form.detention_rate || 0)).toFixed(2)}
                  </strong>
                </div>
                <div className="preview-note">
                  Opens as printable page — use Print → Save as PDF to download
                </div>
              </div>
            )}
          </div>

          <div className="card invoice-tips">
            <h4><AlertTriangle size={15} /> Tips for Getting Paid</h4>
            <ul>
              <li>Send the invoice within 24 hours of the stop</li>
              <li>Email it to the broker AND their accounting department</li>
              <li>Include your load number in the subject line</li>
              <li>Follow up after 7 days if no response</li>
              <li>After 30 days file an FMCSA complaint</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
