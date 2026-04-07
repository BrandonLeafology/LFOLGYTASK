import React, { useState, useEffect, useMemo } from 'react';

const PINK = '#FF2D78';
const CYAN = '#00F0FF';
const BG = '#080810';

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider mb-4" style={{ color: CYAN }}>
    {children}
  </h2>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`border border-white/10 rounded-xl p-5 md:p-6 mb-6 ${className}`} style={{ background: '#0f0f1a' }}>
    {children}
  </section>
);

const inputCls =
  'w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#00F0FF] placeholder-gray-500';

const labelCls = 'block text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-semibold';

// ---------- Countdown ----------
const Countdown: React.FC = () => {
  const target = useMemo(() => new Date('2026-04-20T00:00:00').getTime(), []);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const Box: React.FC<{ n: number; l: string }> = ({ n, l }) => (
    <div className="text-center px-3 py-2 rounded-md border border-white/10 bg-black/40 min-w-[64px]">
      <div className="text-2xl md:text-3xl font-bold" style={{ color: PINK }}>
        {String(n).padStart(2, '0')}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-gray-400">{l}</div>
    </div>
  );
  return (
    <div className="flex gap-2 md:gap-3 flex-wrap">
      <Box n={d} l="days" />
      <Box n={h} l="hrs" />
      <Box n={m} l="min" />
      <Box n={s} l="sec" />
    </div>
  );
};

// ---------- Strategy Builder ----------
type Loyalist = { tier: string; reward: string; date: string; copy: string };
type Regular = { threshold: number; reward: number; categories: string; date: string };
type Newcust = { discount: number; signupReward: string; followup: string };

const Strategy: React.FC<{
  loyal: Loyalist; setLoyal: (v: Loyalist) => void;
  reg: Regular; setReg: (v: Regular) => void;
  neu: Newcust; setNeu: (v: Newcust) => void;
}> = ({ loyal, setLoyal, reg, setReg, neu, setNeu }) => {
  const [tab, setTab] = useState<'A' | 'B' | 'C'>('A');
  const TabBtn: React.FC<{ id: 'A' | 'B' | 'C'; label: string }> = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className="px-4 py-2 text-sm font-semibold uppercase tracking-wider border-b-2 transition"
      style={tab === id ? { borderColor: PINK, color: PINK } : { borderColor: 'transparent', color: '#6b7280' }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="flex gap-2 border-b border-white/10 mb-5 flex-wrap">
        <TabBtn id="A" label="Loyalists / High-Value" />
        <TabBtn id="B" label="Regulars / Mid-Tier" />
        <TabBtn id="C" label="New / Occasional" />
      </div>

      {tab === 'A' && (
        <div>
          <p className="text-sm text-gray-400 mb-4 border-l-2 pl-3" style={{ borderColor: CYAN }}>
            <strong className="text-gray-200">Strategy:</strong> Exclusivity over discount. Early access, limited
            drops, VIP event invites. No blanket % off.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Loyalty Tier Name</label>
              <input className={inputCls} value={loyal.tier} onChange={(e) => setLoyal({ ...loyal, tier: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Reward Type</label>
              <select className={inputCls} value={loyal.reward} onChange={(e) => setLoyal({ ...loyal, reward: e.target.value })}>
                <option>early access</option>
                <option>exclusive bundle</option>
                <option>points multiplier</option>
                <option>VIP event</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Activation Date</label>
              <input type="date" className={inputCls} value={loyal.date} onChange={(e) => setLoyal({ ...loyal, date: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Message Copy</label>
              <textarea rows={2} className={inputCls} value={loyal.copy} onChange={(e) => setLoyal({ ...loyal, copy: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {tab === 'B' && (
        <div>
          <p className="text-sm text-gray-400 mb-4 border-l-2 pl-3" style={{ borderColor: CYAN }}>
            <strong className="text-gray-200">Strategy:</strong> Moderate tiered deals. Spend-threshold unlocks.
            Incentivize AoV growth.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Spend Threshold ($)</label>
              <input type="number" className={inputCls} value={reg.threshold} onChange={(e) => setReg({ ...reg, threshold: +e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Reward Amount ($ off)</label>
              <input type="number" className={inputCls} value={reg.reward} onChange={(e) => setReg({ ...reg, reward: +e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Categories Eligible</label>
              <input className={inputCls} value={reg.categories} onChange={(e) => setReg({ ...reg, categories: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Activation Date</label>
              <input type="date" className={inputCls} value={reg.date} onChange={(e) => setReg({ ...reg, date: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {tab === 'C' && (
        <div>
          <p className="text-sm text-gray-400 mb-4 border-l-2 pl-3" style={{ borderColor: CYAN }}>
            <strong className="text-gray-200">Strategy:</strong> Traffic conversion. First-visit offer, loyalty
            sign-up incentive, post-visit follow-up.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>First-Visit Discount %</label>
              <input type="number" className={inputCls} value={neu.discount} onChange={(e) => setNeu({ ...neu, discount: +e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Loyalty Sign-Up Reward</label>
              <input className={inputCls} value={neu.signupReward} onChange={(e) => setNeu({ ...neu, signupReward: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Follow-Up Timing</label>
              <select className={inputCls} value={neu.followup} onChange={(e) => setNeu({ ...neu, followup: e.target.value })}>
                <option>3 days post-visit</option>
                <option>5 days post-visit</option>
                <option>7 days post-visit</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ---------- Calendar ----------
type DayEntry = {
  date: string;
  label: string;
  theme: string;
  promo: string;
  segments: { loyal: boolean; reg: boolean; neu: boolean };
  channels: { sms: boolean; email: boolean; instore: boolean; weedmaps: boolean; google: boolean };
  notes: string;
};

const PROMO_OPTIONS = ['early access', 'tiered deal', 'flat discount', 'BOGO', 'event', 'no promo'];

const defaultCalendar: DayEntry[] = [
  {
    date: '2026-04-16', label: 'Wed 4/16',
    theme: 'Event kickoff — VIP early access',
    promo: 'early access',
    segments: { loyal: true, reg: false, neu: false },
    channels: { sms: true, email: true, instore: false, weedmaps: false, google: false },
    notes: 'Loyalist-only soft open. No public promotion.',
  },
  {
    date: '2026-04-17', label: 'Thu 4/17',
    theme: 'Loyalty multiplier activation',
    promo: 'event',
    segments: { loyal: true, reg: true, neu: false },
    channels: { sms: true, email: true, instore: true, weedmaps: false, google: false },
    notes: '2x points day for enrolled members.',
  },
  {
    date: '2026-04-18', label: 'Sat 4/18',
    theme: 'High-AoV tiered deal',
    promo: 'tiered deal',
    segments: { loyal: true, reg: true, neu: false },
    channels: { sms: true, email: true, instore: true, weedmaps: true, google: false },
    notes: 'Spend $75 → $15 off. Protect margin.',
  },
  {
    date: '2026-04-19', label: 'Sun 4/19',
    theme: 'Peak pre-day — best inventory featured',
    promo: 'no promo',
    segments: { loyal: true, reg: true, neu: true },
    channels: { instore: true, weedmaps: true, email: false, sms: false, google: true },
    notes: 'No deep discounting. Highlight premium SKUs.',
  },
  {
    date: '2026-04-20', label: 'Mon 4/20',
    theme: 'Full celebration — broadest promo',
    promo: 'flat discount',
    segments: { loyal: true, reg: true, neu: true },
    channels: { sms: true, email: true, instore: true, weedmaps: true, google: true },
    notes: 'New customer focus. Capture contact info at POS.',
  },
  {
    date: '2026-04-21', label: 'Tue 4/21',
    theme: 'Post-event retention — loyalty re-engagement',
    promo: 'event',
    segments: { loyal: true, reg: true, neu: false },
    channels: { sms: true, email: true, instore: false, weedmaps: false, google: false },
    notes: 'Thank-you + next reward preview.',
  },
  {
    date: '2026-04-22', label: 'Wed 4/22',
    theme: 'Follow-up with new 4/20 customers',
    promo: 'event',
    segments: { loyal: false, reg: false, neu: true },
    channels: { sms: true, email: true, instore: false, weedmaps: false, google: false },
    notes: 'Loyalty enrollment push. Review ask.',
  },
];

const Calendar: React.FC<{ days: DayEntry[]; setDays: (d: DayEntry[]) => void }> = ({ days, setDays }) => {
  const update = (i: number, patch: Partial<DayEntry>) => {
    const next = [...days];
    next[i] = { ...next[i], ...patch };
    setDays(next);
  };
  const Chk: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#FF2D78]" />
      {label}
    </label>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {days.map((day, i) => (
        <div key={day.date} className="border border-white/10 rounded-lg p-4 bg-black/30">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-sm uppercase tracking-wider" style={{ color: PINK }}>
              {day.label}
            </div>
            <div className="text-[10px] text-gray-500">{day.date}</div>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Theme / Headline</label>
              <input className={inputCls} value={day.theme} onChange={(e) => update(i, { theme: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Promotion Type</label>
              <select className={inputCls} value={day.promo} onChange={(e) => update(i, { promo: e.target.value })}>
                {PROMO_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Segments</label>
              <div className="flex gap-3 flex-wrap">
                <Chk checked={day.segments.loyal} onChange={() => update(i, { segments: { ...day.segments, loyal: !day.segments.loyal } })} label="Loyalist" />
                <Chk checked={day.segments.reg} onChange={() => update(i, { segments: { ...day.segments, reg: !day.segments.reg } })} label="Regular" />
                <Chk checked={day.segments.neu} onChange={() => update(i, { segments: { ...day.segments, neu: !day.segments.neu } })} label="New" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Channels</label>
              <div className="flex gap-3 flex-wrap">
                <Chk checked={day.channels.sms} onChange={() => update(i, { channels: { ...day.channels, sms: !day.channels.sms } })} label="SMS" />
                <Chk checked={day.channels.email} onChange={() => update(i, { channels: { ...day.channels, email: !day.channels.email } })} label="Email" />
                <Chk checked={day.channels.instore} onChange={() => update(i, { channels: { ...day.channels, instore: !day.channels.instore } })} label="In-store" />
                <Chk checked={day.channels.weedmaps} onChange={() => update(i, { channels: { ...day.channels, weedmaps: !day.channels.weedmaps } })} label="Weedmaps" />
                <Chk checked={day.channels.google} onChange={() => update(i, { channels: { ...day.channels, google: !day.channels.google } })} label="Google" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={2} className={inputCls} value={day.notes} onChange={(e) => update(i, { notes: e.target.value })} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------- Guardrails Calculator ----------
type Calc = {
  atv: number; tx: number;
  pctLoyal: number; pctReg: number; pctNew: number;
  discLoyal: number; discReg: number; discNew: number;
};

const Guardrails: React.FC<{ calc: Calc; setCalc: (c: Calc) => void }> = ({ calc, setCalc }) => {
  const up = (k: keyof Calc, v: number) => setCalc({ ...calc, [k]: v });
  const txLoyal = calc.tx * (calc.pctLoyal / 100);
  const txReg = calc.tx * (calc.pctReg / 100);
  const txNew = calc.tx * (calc.pctNew / 100);
  const revLoyal = txLoyal * calc.atv;
  const revReg = txReg * calc.atv;
  const revNew = txNew * calc.atv;
  const gross = revLoyal + revReg + revNew;
  const disc = revLoyal * (calc.discLoyal / 100) + revReg * (calc.discReg / 100) + revNew * (calc.discNew / 100);
  const net = gross - disc;
  const pctSum = calc.pctLoyal + calc.pctReg + calc.pctNew;
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelCls}>Avg Transaction Value</label>
            <input type="number" className={inputCls} value={calc.atv} onChange={(e) => up('atv', +e.target.value)} />
          </div>
          <div>
            <label className={labelCls}># of 4/20 Transactions</label>
            <input type="number" className={inputCls} value={calc.tx} onChange={(e) => up('tx', +e.target.value)} />
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2 font-semibold">Segment Mix & Discounts</div>
        <div className="space-y-3">
          {(['Loyal', 'Reg', 'New'] as const).map((seg) => {
            const pctKey = `pct${seg}` as keyof Calc;
            const discKey = `disc${seg}` as keyof Calc;
            const label = seg === 'Loyal' ? 'Loyalist' : seg === 'Reg' ? 'Regular' : 'New';
            return (
              <div key={seg} className="grid grid-cols-3 gap-2 items-end">
                <div className="text-sm text-gray-300 pb-2">{label}</div>
                <div>
                  <label className={labelCls}>% of Tx</label>
                  <input type="number" className={inputCls} value={calc[pctKey]} onChange={(e) => up(pctKey, +e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Discount %</label>
                  <input type="number" className={inputCls} value={calc[discKey]} onChange={(e) => up(discKey, +e.target.value)} />
                </div>
              </div>
            );
          })}
        </div>
        {pctSum !== 100 && (
          <p className="text-xs text-yellow-400 mt-2">Segment % totals {pctSum}% (should sum to 100).</p>
        )}
      </div>
      <div className="border border-white/10 rounded-lg p-4 bg-black/30">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-3 font-semibold">Output</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Gross Revenue</span><span className="font-semibold">{fmt(gross)}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Discounts Given</span><span className="font-semibold" style={{ color: PINK }}>−{fmt(disc)}</span></div>
          <div className="flex justify-between border-t border-white/10 pt-2"><span className="text-gray-300">Net Revenue</span><span className="font-bold" style={{ color: CYAN }}>{fmt(net)}</span></div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex justify-between text-xs"><span className="text-gray-500">Loyalist rev</span><span>{fmt(revLoyal)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Regular rev</span><span>{fmt(revReg)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">New rev</span><span>{fmt(revNew)}</span></div>
        </div>
        {calc.discLoyal > 10 && (
          <div className="mt-4 border border-pink-500/50 rounded-md p-3 text-xs" style={{ background: 'rgba(255,45,120,0.1)', color: PINK }}>
            ⚠ You're leaving money on the table — these customers don't need this.
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Retention Checklist ----------
const CHECKLIST = [
  'Export new customer list from Alpine IQ / Dutchie',
  'Segment: first-timers vs. lapsed regulars',
  'Send Day 3 re-engagement SMS (loyalty enrollment CTA)',
  'Send Day 7 follow-up with "how\'d you like it?" + review ask',
  'Flag any new loyalty enrollees for first-tier milestone push',
  'Review 4/20 AoV by segment vs. prior year',
  'Brief team debrief — what held margin, what didn\'t',
];

// ---------- Main App ----------
export default function App() {
  const [loyal, setLoyal] = useState<Loyalist>({
    tier: 'Leaf Circle',
    reward: 'early access',
    date: '2026-04-16',
    copy: 'Leaf Circle: doors open 4/16 at 9am. Limited drops, your pick first.',
  });
  const [reg, setReg] = useState<Regular>({
    threshold: 75, reward: 15, categories: 'Flower, Pre-rolls, Edibles', date: '2026-04-18',
  });
  const [neu, setNeu] = useState<Newcust>({
    discount: 15, signupReward: '$10 off next visit on sign-up', followup: '3 days post-visit',
  });
  const [days, setDays] = useState<DayEntry[]>(defaultCalendar);
  const [calc, setCalc] = useState<Calc>({
    atv: 60, tx: 200,
    pctLoyal: 30, pctReg: 45, pctNew: 25,
    discLoyal: 5, discReg: 15, discNew: 20,
  });
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [exported, setExported] = useState('');

  const buildExport = () => {
    const lines: string[] = [];
    lines.push('420 CAMPAIGN PLAN · LEAFOLOGY 2026');
    lines.push('White Plains, NY · 244 Main St');
    lines.push('='.repeat(48));
    lines.push('');
    lines.push('-- SEGMENT STRATEGIES --');
    lines.push(`Loyalists (${loyal.tier}): ${loyal.reward}, activates ${loyal.date}`);
    lines.push(`  Copy: ${loyal.copy}`);
    lines.push(`Regulars: spend $${reg.threshold} → $${reg.reward} off · ${reg.categories} · ${reg.date}`);
    lines.push(`New: ${neu.discount}% first-visit · ${neu.signupReward} · Follow-up ${neu.followup}`);
    lines.push('');
    lines.push('-- CALENDAR --');
    days.forEach((d) => {
      const segs = [d.segments.loyal && 'Loyalist', d.segments.reg && 'Regular', d.segments.neu && 'New'].filter(Boolean).join('/');
      const chs = Object.entries(d.channels).filter(([, v]) => v).map(([k]) => k).join(', ');
      lines.push(`${d.label} — ${d.theme}`);
      lines.push(`  Promo: ${d.promo} | Segments: ${segs || 'none'} | Channels: ${chs || 'none'}`);
      if (d.notes) lines.push(`  Notes: ${d.notes}`);
    });
    lines.push('');
    lines.push('-- DISCOUNT GUARDRAILS --');
    const gross = calc.tx * calc.atv;
    const rL = calc.tx * (calc.pctLoyal / 100) * calc.atv;
    const rR = calc.tx * (calc.pctReg / 100) * calc.atv;
    const rN = calc.tx * (calc.pctNew / 100) * calc.atv;
    const disc = rL * (calc.discLoyal / 100) + rR * (calc.discReg / 100) + rN * (calc.discNew / 100);
    lines.push(`ATV $${calc.atv} × ${calc.tx} tx`);
    lines.push(`Mix: Loyal ${calc.pctLoyal}% / Reg ${calc.pctReg}% / New ${calc.pctNew}%`);
    lines.push(`Disc: Loyal ${calc.discLoyal}% / Reg ${calc.discReg}% / New ${calc.discNew}%`);
    lines.push(`Gross: $${gross.toFixed(0)} | Discounts: $${disc.toFixed(0)} | Net: $${(gross - disc).toFixed(0)}`);
    if (calc.discLoyal > 10) lines.push('WARNING: Loyalist discount >10% — leaving margin on the table.');
    lines.push('');
    lines.push('-- RETENTION CHECKLIST --');
    CHECKLIST.forEach((item, i) => lines.push(`${checked[i] ? '[x]' : '[ ]'} ${item}`));
    setExported(lines.join('\n'));
  };

  const copyExport = async () => {
    try { await navigator.clipboard.writeText(exported); } catch {}
  };

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">Leafology · White Plains, NY</div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: PINK }}>
            420 Campaign War Room · 2026
          </h1>
        </header>

        <Card>
          <H2>Campaign Overview</H2>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Event Window</div>
              <div className="text-lg font-semibold text-gray-100 mb-4">April 16 (Wed) → April 20 (Mon)</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Countdown to 4/20/2026</div>
              <Countdown />
            </div>
            <div className="border-l-2 pl-4" style={{ borderColor: PINK }}>
              <div className="text-[11px] uppercase tracking-wider mb-2 font-bold" style={{ color: CYAN }}>Key Insight</div>
              <p className="text-gray-200 leading-relaxed">
                Pre-peak (4/18–4/19) drives higher AoV than 4/20 itself. Don't sacrifice margin on your best customers.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <H2>Strategy Builder</H2>
          <Strategy loyal={loyal} setLoyal={setLoyal} reg={reg} setReg={setReg} neu={neu} setNeu={setNeu} />
        </Card>

        <Card>
          <H2>Day-by-Day Calendar</H2>
          <Calendar days={days} setDays={setDays} />
        </Card>

        <Card>
          <H2>Discount Guardrails</H2>
          <Guardrails calc={calc} setCalc={setCalc} />
        </Card>

        <Card>
          <H2>Post-420 Retention Checklist</H2>
          <ul className="space-y-2">
            {CHECKLIST.map((item, i) => (
              <li key={i}>
                <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={() => { const n = [...checked]; n[i] = !n[i]; setChecked(n); }}
                    className="mt-0.5 accent-[#FF2D78] w-4 h-4"
                  />
                  <span className={checked[i] ? 'line-through text-gray-500' : ''}>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <H2>Export</H2>
          <div className="flex gap-3 flex-wrap mb-4">
            <button
              onClick={buildExport}
              className="px-5 py-2.5 rounded-md font-bold uppercase tracking-wider text-sm text-black"
              style={{ background: PINK }}
            >
              Export Plan as Text Summary
            </button>
            {exported && (
              <button
                onClick={copyExport}
                className="px-5 py-2.5 rounded-md font-bold uppercase tracking-wider text-sm border"
                style={{ borderColor: CYAN, color: CYAN }}
              >
                Copy to Clipboard
              </button>
            )}
          </div>
          {exported && (
            <textarea
              readOnly
              value={exported}
              rows={16}
              className="w-full bg-black/60 border border-white/10 rounded-md p-3 text-xs text-gray-200 font-mono"
            />
          )}
        </Card>

        <footer className="text-center text-xs text-gray-600 mt-8 pb-4">
          Leafology Cannabis Co. · CAURD Licensee · Internal planning tool
        </footer>
      </div>
    </div>
  );
}
