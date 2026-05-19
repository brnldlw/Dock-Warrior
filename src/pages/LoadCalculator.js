import { useState } from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { Link } from 'react-router-dom'
import { DollarSign, Truck, Fuel, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calculator } from 'lucide-react'
import './LoadCalculator.css'

const FUEL_EFFICIENCY_DEFAULTS = {
  'Semi (loaded)': 6.5,
  'Semi (empty)': 7.5,
  'Straight truck': 10,
  'Sprinter/cargo van': 18,
}

function formatMoney(n) {
  if (!n && n !== 0) return '—'
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ResultRow({ label, value, color, bold, indent }) {
  return (
    <div className={`result-row ${bold ? 'result-row-bold' : ''} ${indent ? 'result-row-indent' : ''}`}>
      <span className="result-label">{label}</span>
      <span className="result-value" style={{ color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export default function LoadCalculator() {
  const { isPro } = useSubscription()

  const [form, setForm] = useState({
    load_rate: '',
    miles: '',
    fuel_price: '',
    mpg: '6.5',
    truck_type: 'Semi (loaded)',
    tolls: '',
    lumper: '',
    detention_minutes: '',
    detention_rate: '50',
    maintenance_reserve: '0.15',
    insurance_per_mile: '0.08',
    other_expenses: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const calc = () => {
    const rate = parseFloat(form.load_rate) || 0
    const miles = parseFloat(form.miles) || 0
    const fuelPrice = parseFloat(form.fuel_price) || 0
    const mpg = parseFloat(form.mpg) || 6.5
    const tolls = parseFloat(form.tolls) || 0
    const lumper = parseFloat(form.lumper) || 0
    const detentionMins = parseFloat(form.detention_minutes) || 0
    const detentionRate = parseFloat(form.detention_rate) || 50
    const maintReserve = parseFloat(form.maintenance_reserve) || 0.15
    const insurancePerMile = parseFloat(form.insurance_per_mile) || 0.08
    const otherExpenses = parseFloat(form.other_expenses) || 0

    const fuelCost = miles > 0 && mpg > 0 ? (miles / mpg) * fuelPrice : 0
    const detentionPay = (detentionMins / 60) * detentionRate
    const maintCost = miles * maintReserve
    const insuranceCost = miles * insurancePerMile
    const totalExpenses = fuelCost + tolls + lumper + maintCost + insuranceCost + otherExpenses
    const grossRevenue = rate + detentionPay
    const netProfit = grossRevenue - totalExpenses
    const ratePerMile = miles > 0 ? rate / miles : 0
    const netPerMile = miles > 0 ? netProfit / miles : 0
    const expensePerMile = miles > 0 ? totalExpenses / miles : 0
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0

    // SE tax estimate (15.3% on net)
    const seTax = Math.max(0, netProfit * 0.153)
    const afterTaxProfit = netProfit - seTax

    return {
      fuelCost, detentionPay, maintCost, insuranceCost, totalExpenses,
      grossRevenue, netProfit, ratePerMile, netPerMile, expensePerMile,
      profitMargin, seTax, afterTaxProfit
    }
  }

  const hasInputs = form.load_rate && form.miles
  const results = hasInputs ? calc() : null

  const getProfitColor = (net) => {
    if (!net && net !== 0) return 'var(--text-primary)'
    if (net < 0) return 'var(--red)'
    if (net < 200) return 'var(--yellow)'
    return 'var(--green)'
  }

  const getRating = (netPerMile) => {
    if (!netPerMile) return null
    if (netPerMile < 0) return { label: 'Losing Money', color: 'var(--red)', icon: <TrendingDown size={16} /> }
    if (netPerMile < 0.50) return { label: 'Below Break-Even', color: 'var(--red)', icon: <AlertTriangle size={16} /> }
    if (netPerMile < 1.00) return { label: 'Marginal Load', color: 'var(--yellow)', icon: <AlertTriangle size={16} /> }
    if (netPerMile < 1.50) return { label: 'Acceptable', color: 'var(--yellow)', icon: <CheckCircle size={16} /> }
    return { label: 'Profitable Load', color: 'var(--green)', icon: <CheckCircle size={16} /> }
  }

  const rating = results ? getRating(results.netPerMile) : null

  return (
    <div className="page">
      <div className="section-header">
        <div className="accent-line" />
        <h2><Calculator size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--orange)' }} />Load Calculator</h2>
        <p>Know exactly what you make on every load — after fuel, expenses, and taxes.</p>
      </div>

      <div className="calc-layout">
        <div className="calc-inputs card">
          <h3 className="calc-section-title"><TrendingUp size={18} /> Load Details</h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Load Rate ($) *</label>
              <input className="form-input" type="number" placeholder="e.g. 2500" value={form.load_rate} onChange={e => set('load_rate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Miles *</label>
              <input className="form-input" type="number" placeholder="e.g. 850" value={form.miles} onChange={e => set('miles', e.target.value)} />
            </div>
          </div>

          <h3 className="calc-section-title" style={{ marginTop: 8 }}><Fuel size={18} /> Fuel</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Diesel Price ($/gal)</label>
              <input className="form-input" type="number" step="0.01" placeholder="e.g. 3.85" value={form.fuel_price} onChange={e => set('fuel_price', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Truck Type</label>
              <select className="form-input" value={form.truck_type} onChange={e => { set('truck_type', e.target.value); set('mpg', FUEL_EFFICIENCY_DEFAULTS[e.target.value] || '6.5') }}>
                {Object.keys(FUEL_EFFICIENCY_DEFAULTS).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">MPG (your truck)</label>
              <input className="form-input" type="number" step="0.1" value={form.mpg} onChange={e => set('mpg', e.target.value)} />
            </div>
          </div>

          <h3 className="calc-section-title" style={{ marginTop: 8 }}><DollarSign size={18} /> Additional Expenses</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Tolls ($)</label>
              <input className="form-input" type="number" placeholder="0" value={form.tolls} onChange={e => set('tolls', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Lumper Fees ($)</label>
              <input className="form-input" type="number" placeholder="0" value={form.lumper} onChange={e => set('lumper', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Other Expenses ($)</label>
              <input className="form-input" type="number" placeholder="0" value={form.other_expenses} onChange={e => set('other_expenses', e.target.value)} />
            </div>
          </div>

          {isPro && (
            <>
              <h3 className="calc-section-title" style={{ marginTop: 8 }}><Clock size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /> Detention</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Detention Time (minutes)</label>
                  <input className="form-input" type="number" placeholder="0" value={form.detention_minutes} onChange={e => set('detention_minutes', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Detention Rate ($/hr)</label>
                  <input className="form-input" type="number" placeholder="50" value={form.detention_rate} onChange={e => set('detention_rate', e.target.value)} />
                </div>
              </div>

              <h3 className="calc-section-title" style={{ marginTop: 8 }}><Truck size={18} /> Operating Costs (per mile)</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Maintenance Reserve ($/mi)</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0.15" value={form.maintenance_reserve} onChange={e => set('maintenance_reserve', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Insurance ($/mi)</label>
                  <input className="form-input" type="number" step="0.01" placeholder="0.08" value={form.insurance_per_mile} onChange={e => set('insurance_per_mile', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {!isPro && (
            <div className="calc-pro-gate">
              <Zap size={16} />
              <span>
                <Link to="/pricing" style={{ color: 'var(--orange)' }}>Upgrade to Pro</Link> to add detention pay, maintenance reserve, insurance costs, and SE tax estimate.
              </span>
            </div>
          )}
        </div>

        {/* RESULTS */}
        <div className="calc-results">
          {!hasInputs ? (
            <div className="card calc-placeholder">
              <Calculator size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
              <h3>Enter load rate and miles</h3>
              <p>Your profitability breakdown will appear here.</p>
            </div>
          ) : (
            <>
              {/* VERDICT */}
              {rating && (
                <div className="card calc-verdict" style={{ borderColor: rating.color }}>
                  <div className="verdict-icon" style={{ color: rating.color }}>{rating.icon}</div>
                  <div>
                    <div className="verdict-label" style={{ color: rating.color }}>{rating.label}</div>
                    <div className="verdict-sub">
                      {formatMoney(results.netPerMile)}/mile net after expenses
                    </div>
                  </div>
                  <div className="verdict-profit" style={{ color: getProfitColor(results.netProfit) }}>
                    {formatMoney(results.netProfit)}
                    <div className="verdict-profit-label">net profit</div>
                  </div>
                </div>
              )}

              {/* BREAKDOWN */}
              <div className="card calc-breakdown">
                <h3 className="breakdown-title">Full Breakdown</h3>

                <div className="breakdown-section">
                  <div className="breakdown-section-label">Revenue</div>
                  <ResultRow label="Load Rate" value={formatMoney(parseFloat(form.load_rate))} />
                  {results.detentionPay > 0 && <ResultRow label="Detention Pay" value={formatMoney(results.detentionPay)} color="var(--green)" indent />}
                  <ResultRow label="Gross Revenue" value={formatMoney(results.grossRevenue)} bold />
                </div>

                <div className="breakdown-divider" />

                <div className="breakdown-section">
                  <div className="breakdown-section-label">Expenses</div>
                  {results.fuelCost > 0 && <ResultRow label={`Fuel (${form.miles}mi ÷ ${form.mpg}mpg × $${form.fuel_price})`} value={`-${formatMoney(results.fuelCost)}`} color="var(--red)" indent />}
                  {parseFloat(form.tolls) > 0 && <ResultRow label="Tolls" value={`-${formatMoney(parseFloat(form.tolls))}`} color="var(--red)" indent />}
                  {parseFloat(form.lumper) > 0 && <ResultRow label="Lumper Fees" value={`-${formatMoney(parseFloat(form.lumper))}`} color="var(--red)" indent />}
                  {isPro && results.maintCost > 0 && <ResultRow label={`Maintenance (${form.miles}mi × $${form.maintenance_reserve})`} value={`-${formatMoney(results.maintCost)}`} color="var(--red)" indent />}
                  {isPro && results.insuranceCost > 0 && <ResultRow label={`Insurance (${form.miles}mi × $${form.insurance_per_mile})`} value={`-${formatMoney(results.insuranceCost)}`} color="var(--red)" indent />}
                  {parseFloat(form.other_expenses) > 0 && <ResultRow label="Other Expenses" value={`-${formatMoney(parseFloat(form.other_expenses))}`} color="var(--red)" indent />}
                  <ResultRow label="Total Expenses" value={`-${formatMoney(results.totalExpenses)}`} bold color="var(--red)" />
                </div>

                <div className="breakdown-divider" />

                <ResultRow label="Net Profit" value={formatMoney(results.netProfit)} bold color={getProfitColor(results.netProfit)} />

                {isPro && results.seTax > 0 && (
                  <>
                    <ResultRow label="Est. SE Tax (15.3%)" value={`-${formatMoney(results.seTax)}`} color="var(--text-muted)" indent />
                    <ResultRow label="After-Tax Profit" value={formatMoney(results.afterTaxProfit)} bold color={getProfitColor(results.afterTaxProfit)} />
                  </>
                )}

                <div className="breakdown-divider" />

                <div className="breakdown-section">
                  <div className="breakdown-section-label">Per Mile</div>
                  <ResultRow label="Rate per mile" value={formatMoney(results.ratePerMile) + '/mi'} />
                  <ResultRow label="Expenses per mile" value={formatMoney(results.expensePerMile) + '/mi'} color="var(--red)" />
                  <ResultRow label="Net per mile" value={formatMoney(results.netPerMile) + '/mi'} bold color={getProfitColor(results.netProfit)} />
                  <ResultRow label="Profit margin" value={results.profitMargin.toFixed(1) + '%'} color={results.profitMargin > 20 ? 'var(--green)' : results.profitMargin > 0 ? 'var(--yellow)' : 'var(--red)'} />
                </div>
              </div>

              {!isPro && (
                <div className="card calc-upgrade-prompt">
                  <Zap size={18} style={{ color: 'var(--orange)' }} />
                  <div>
                    <strong>Get the full picture with Pro</strong>
                    <p>Add detention pay, maintenance costs, insurance, and SE tax estimate for a true after-tax profit number.</p>
                  </div>
                  <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade — $12/mo</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
