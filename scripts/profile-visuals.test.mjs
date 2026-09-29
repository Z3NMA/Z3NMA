import test from 'node:test';
import assert from 'node:assert/strict';
import { parseContributions, selectYear, weeklyTotals, renderActivity } from './profile-visuals.mjs';
const cell = (date, id, count, level=0) => `<td data-level="${level}" id="${id}" data-date="${date}"></td><tool-tip for="${id}">${count===0?'No':count} ${count===1?'contribution':'contributions'} on September 29th.</tool-tip>`;
test('parses reordered cells, singular, zero and thousands without inventing counts',()=>{
  const result=parseContributions(cell('2026-09-29','b',1,1)+cell('2026-09-27','a',0)+cell('2026-09-28','c','1,234',4));
  assert.deepEqual(result.map(d=>d.count),[0,1234,1]);
  assert.equal(result[0].date,'2026-09-27');
});
test('rejects missing tooltips, changed markup, invalid dates and duplicate days',()=>{
  assert.throws(()=>parseContributions('<td data-date="2026-09-29" data-level="0" id="x">'));
  assert.throws(()=>parseContributions('<html>Rate limited</html>'));
  assert.throws(()=>parseContributions(cell('2026-02-30','x',0)));
  assert.throws(()=>parseContributions(cell('2026-09-29','x',0)+cell('2026-09-29','y',0)));
});
test('selects exactly 365 consecutive UTC dates including leap-day boundaries',()=>{
  const end=Date.parse('2024-03-01');
  const days=Array.from({length:367},(_,i)=>({date:new Date(end-(366-i)*86400000).toISOString().slice(0,10),count:0,level:0}));
  const year=selectYear(days,'2024-03-01');
  assert.equal(year.length,365); assert.equal(year.at(-2).date,'2024-02-29');
  assert.throws(()=>selectYear(days.filter(d=>d.date!=='2024-02-29'),'2024-03-01'));
});
test('calendar weeks preserve totals and partial boundary weeks',()=>{
  const days=[{date:'2026-09-26',count:2},{date:'2026-09-27',count:0},{date:'2026-09-28',count:3}];
  const weeks=weeklyTotals(days);
  assert.deepEqual(weeks.map(w=>[w.start,w.count,w.active]),[['2026-09-20',2,1],['2026-09-27',3,1]]);
  assert.equal(weeks[1].to,'2026-09-28');
});
test('empty activity stays valid and labels are escaped',()=>{
  const svg=renderActivity([{date:'2026-09-29',count:0,level:0}],'a&b');
  assert.ok(!/NaN|Infinity/.test(svg)); assert.ok(svg.includes('a&amp;b'));
  assert.ok(svg.includes('0 contributions')); assert.ok(!svg.includes('class="peak"'));
});
