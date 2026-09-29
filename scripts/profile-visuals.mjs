import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DAY = 86_400_000;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1], m[2]]));
const iso = ms => new Date(ms).toISOString().slice(0, 10);

export function parseContributions(html) {
  const counts = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
    const id = attrs(match[1]).for;
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    const count = text.match(/^(No|[\d,]+) contributions? on\b/i);
    if (id && count) counts.set(id, count[1].toLowerCase() === 'no' ? 0 : Number(count[1].replaceAll(',', '')));
  }
  const days = new Map();
  for (const match of html.matchAll(/<td\b[^>]*>/g)) {
    const a = attrs(match[0]);
    if (!a['data-date']) continue;
    const date = a['data-date'];
    const count = counts.get(a.id);
    const level = Number(a['data-level']);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || iso(Date.parse(date)) !== date ||
        !Number.isSafeInteger(count) || count < 0 || !/^[0-4]$/.test(a['data-level'] ?? '')) {
      throw new Error(`Invalid or missing contribution data for ${date}. Existing assets are preserved.`);
    }
    if (days.has(date)) throw new Error(`Duplicate contribution date: ${date}`);
    days.set(date, { date, count, level });
  }
  if (!days.size) throw new Error('No contribution cells found. GitHub markup may have changed.');
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function selectYear(days, end) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end) || !Number.isFinite(Date.parse(end)) || iso(Date.parse(end)) !== end) throw new Error('Invalid end date');
  const last = Date.parse(end);
  const byDate = new Map(days.map(d => [d.date, d]));
  return Array.from({length:365}, (_, i) => {
    const date = iso(last - (364 - i) * DAY);
    if (!byDate.has(date)) throw new Error(`Missing day ${date}; refusing to render incomplete data.`);
    return byDate.get(date);
  });
}

export function weeklyTotals(days) {
  const weeks = new Map();
  for (const day of days) {
    const ms = Date.parse(day.date);
    const start = iso(ms - new Date(ms).getUTCDay() * DAY);
    if (!weeks.has(start)) weeks.set(start, { start, from:day.date, to:day.date, count:0, active:0 });
    const week = weeks.get(start);
    week.to = day.date;
    week.count += day.count;
    week.active += Number(day.count > 0);
  }
  return [...weeks.values()];
}

function shell(title, desc, height, body, style = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" fill="none" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc>
<defs><linearGradient id="surface" x2="1200" y2="${height}" gradientUnits="userSpaceOnUse"><stop stop-color="#0D1727"/><stop offset="1" stop-color="#152C3C"/></linearGradient></defs>
<style>text{font-family:Segoe UI,Arial,sans-serif}.mono{font-family:Consolas,monospace}${style}</style>
<rect x="1" y="1" width="1198" height="${height - 2}" rx="24" fill="url(#surface)" stroke="#253B4C"/>
${body}
</svg>\n`;
}
const text = (x,y,content,size=16,color='#91A9B9',extra='') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${esc(content)}</text>`;

export function renderToolkit() {
  const columns = [
    { x:40, index:'01', label:'Languages', line1:'TypeScript · JavaScript', line2:'HTML · CSS', icon:'M0 6L-8 14L0 22M14 6L22 14L14 22M10 3L4 25' },
    { x:420, index:'02', label:'Stack', line1:'React · Node.js', line2:'JSP · MySQL', icon:'M-6 8L7 1L20 8L7 15ZM-6 14L7 21L20 14M-6 20L7 27L20 20' },
    { x:800, index:'03', label:'Tools', line1:'Git · GitHub', line2:'VS Code', icon:'M-3 4V22H17M-3 13H17M17 4V22' },
  ];
  const cards = columns.map(c => `<g>
<rect x="${c.x}" y="125" width="360" height="142" rx="12" fill="#0D1928" fill-opacity=".7" stroke="#2A4152"/>
<path d="${c.icon}" transform="translate(${c.x+315} 143)" stroke="#80E8CB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
${text(c.x+22,156,c.index+' / '+c.label.toUpperCase(),12,'#91A9B9','class="mono" letter-spacing="1.3"')}
${text(c.x+22,201,c.line1,23,'#E7EFF5','font-weight="500"')}
${text(c.x+22,237,c.line2,18,'#91A9B9')}
</g>`).join('\n');
  return shell('ZENMA — Toolkit', 'Languages: TypeScript, JavaScript, HTML, CSS. Stack: React, Node.js, JSP, MySQL. Tools: Git, GitHub, VS Code.', 300,
    text(40,43,'01 / RESOURCES',12,'#80E8CB','class="mono" letter-spacing="2"') + text(40,88,'Toolkit',30,'#E7EFF5','font-weight="600"') + cards);
}

export function renderActivity(days, user) {
  const weeks = weeklyTotals(days);
  const total = days.reduce((n,d) => n+d.count,0);
  const active = days.filter(d=>d.count>0).length;
  const peak = Math.max(1,...weeks.map(w=>w.count));
  // A linear scale preserves relative weekly totals; node size reflects active days.
  const points = weeks.map((w,i)=>({ ...w, x:64+i*(1072/Math.max(1,weeks.length-1)), y:282-(w.count/peak)*108 }));
  const path = points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  let lastMonth = '';
  const months = points.map(p=>{
    const key=p.from.slice(0,7);
    if (key===lastMonth) return '';
    lastMonth=key;
    if (p.x>1090 || (p===points[0] && new Date(p.from).getUTCDate()>21)) return '';
    return text(p.x,324,new Date(p.from).toLocaleString('en-US',{month:'short',timeZone:'UTC'}).toUpperCase(),11,'#708C9F','class="mono"');
  }).join('');
  const nodes = points.map(p=>`<g><title>${esc(p.from)} to ${esc(p.to)}: ${p.count} contributions, ${p.active} active days</title>
<path d="M${p.x.toFixed(2)} 293V${p.y.toFixed(2)}" stroke="#476477" stroke-opacity="${p.count?'.22':'.12'}"/>
<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${p.count ? (2.3+p.active*.32).toFixed(2) : '1.8'}" fill="${p.count?'#80E8CB':'#496172'}"/>
${p.count===peak?`<circle class="peak" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="10" stroke="#80E8CB" stroke-opacity=".3"/>`:''}</g>`).join('\n');
  return shell('ZENMA — Activity', `${user}: ${total} contributions on ${active} active days from ${days[0].date} to ${days.at(-1).date}. Each node represents one calendar week; height shows weekly contribution count. Edge weeks can be partial.`, 385,
    text(40,43,'02 / ACTIVITY',12,'#80E8CB','class="mono" letter-spacing="2"') +
    text(40,88,'Contribution signal',30,'#E7EFF5','font-weight="600"') +
    text(1160,43,`${days[0].date.replaceAll('-','.')} — ${days.at(-1).date.replaceAll('-','.')}`,12,'#91A9B9','class="mono" text-anchor="end"') +
    text(1160,87,`${total.toLocaleString('en-US')} contributions  /  ${active} active days`,17,'#C7D8E2','text-anchor="end"') +
    '<path d="M40 120H1160" stroke="#294151"/>' +
    text(64,149,'WEEKLY CONTRIBUTIONS',10,'#708C9F','class="mono" letter-spacing="1.5"') +
    `<path d="${path}" stroke="#6AABAB" stroke-width="1.4" stroke-opacity=".45" stroke-linejoin="round"/>
<path class="trace" d="${path}" pathLength="1000" stroke="#B2F4DF" stroke-width="1.6" stroke-opacity=".55" stroke-dasharray="45 955" stroke-linejoin="round"/>
${nodes}${months}` +
    text(40,361,'ONE NODE / ONE WEEK',10,'#708C9F','class="mono" letter-spacing="1.3"') +
    text(1160,361,'GITHUB · UTC',10,'#708C9F','class="mono" text-anchor="end" letter-spacing="1.3"'),
    '.trace{animation:trace 18s linear infinite}.peak{animation:pulse 6s ease-in-out infinite}@keyframes trace{to{stroke-dashoffset:-1000}}@keyframes pulse{50%{opacity:.35}}');
}

async function main() {
  const user = process.env.PROFILE_USER || 'Z3NMA';
  if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(user)) throw new Error('Invalid GitHub username');
  const end = process.env.PROFILE_DATE || new Date().toISOString().slice(0,10);
  let html;
  if (process.env.CONTRIBUTIONS_HTML) html = await readFile(process.env.CONTRIBUTIONS_HTML,'utf8');
  else {
    const url = `https://github.com/users/${encodeURIComponent(user)}/contributions`;
    const response = await fetch(url,{headers:{'User-Agent':'ZENMA-profile-visuals','Accept-Language':'en-US'},signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error(`GitHub contributions returned HTTP ${response.status}`);
    html = await response.text();
  }
  const days = selectYear(parseContributions(html),end);
  const activity = renderActivity(days,user);
  const toolkit = renderToolkit();
  await mkdir('assets',{recursive:true});
  // Fetch, parse, and validate the full year before replacing either published asset.
  await writeFile('assets/activity.svg',activity,'utf8');
  await writeFile('assets/toolkit.svg',toolkit,'utf8');
  console.log(`Rendered ${days.length} days for ${user}: ${days.reduce((n,d)=>n+d.count,0)} contributions.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
