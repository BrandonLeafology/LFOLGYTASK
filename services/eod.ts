
import { Task, Settings, CATEGORIES } from '../types';

/** buildEOD(dateISO, tasks, settings): returns Markdown EOD string */
export function buildEOD(dateISO: string, tasks: Task[], settings: Settings): string {
  const day = new Date(dateISO + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const todays = tasks.filter(t => t.date === dateISO && t.disposition !== 'retired');
  const done = todays.filter(t => t.status === 'done');
  const carry = todays.filter(t => t.status !== 'done');
  
  const byCat = (c: typeof CATEGORIES[number]) => todays.filter(t => t.category === c).length;

  const wins = todays.filter(t => t.starred && t.status === 'done')
    .sort((a,b)=>(b.comments?.length||0)-(a.comments?.length||0)).slice(0,3);
  const asks = todays.filter(t => t.asks || (t.status !== 'done' && t.includeInEOD));

  const k = settings.kpis || {};
  const kpiLine = [
    k.AOV != null && k.AOV > 0 ? `AOV: $${k.AOV.toFixed(2)}` : null,
    k.googleReviews != null && k.googleReviews > 0 ? `Google Reviews: ${k.googleReviews}` : null,
    k.proposalsNew != null && k.proposalsNew > 0 ? `New Proposals: ${k.proposalsNew}` : null,
    k.initiativesProgress ? `Progress: ${k.initiativesProgress}` : null
  ].filter(Boolean).join(' • ');
  
  const subjDate = new Date(dateISO + 'T00:00:00').toLocaleString('en-US',{month:'short',day:'2-digit',year:'numeric'}).replace(',', '').replace(/ /g, '-');
  const subj = `EoD ${subjDate}`;

  const hdr = `Leafology — EOD — ${day}`;

  const body = [
    `**KPIs**  ${kpiLine || '(add KPIs)'}`,
    `**At-a-glance**  Total: ${todays.length} | Done: ${done.length} | Carryover: ${carry.length}`,
    `**By category**  ${CATEGORIES.map(c=>`${c} ${byCat(c)}`).join(' · ')}`,
    ``,
    `**Top 3 Wins**`, ...(wins.length?wins.map(t=>`- ${t.title}`):['- (add a win)']),
    ``,
    `**Blockers & Asks**`, ...(asks.length?asks.map(t=>`- ${t.title}`):['- None today']),
    ``,
    `**Notes to Ownership**`,
    `- Side-note: General status is positive.`,
    `- Appreciated. The data seems to say we are on track.`,
    ``,
    `**Carryover → Tomorrow**`, ...carry.map(t=>`- ${t.title}`)
  ].join('\n');

  return `SUBJECT: ${subj}\n\n${hdr}\n\n${body}`;
}


export function applyToneGuard(text: string): { guardedText: string, warning: boolean } {
  const sensitiveWords = ['owner', 'management', 'boss', 'leadership'];
  const negativeContext = ['sucks', 'is bad', 'terrible', 'awful', 'stupid', 'incompetent'];
  
  let guardedText = text;
  let warning = false;

  sensitiveWords.forEach(word => {
    negativeContext.forEach(neg => {
      const regex = new RegExp(`(${word}\\s*${neg}|${neg}\\s*${word})`, 'ig');
      if (regex.test(guardedText)) {
        warning = true;
        guardedText = guardedText.replace(regex, '(redacted)');
      }
    });
  });

  return { guardedText, warning };
}
