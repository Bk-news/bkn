// ================= صفحات: ملفات الصحف، الأرشيف، التقرير الأسبوعي، الخط الزمني =================
const L = (ar, en) => (EN ? en : ar);
const P = new URLSearchParams(location.search);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const tipEl = () => document.getElementById('tip');
function tipShow(e, html) { const tt = tipEl(); tt.innerHTML = html; tt.style.opacity = 1; tt.style.left = Math.min(e.clientX + 14, innerWidth - tt.offsetWidth - 8) + 'px'; tt.style.top = e.clientY + 14 + 'px'; }
const tipHide = () => { tipEl().style.opacity = 0; };
const dayKey = (offset) => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10);
const fmtTime = (iso) => new Intl.DateTimeFormat(EN ? 'en-GB' : 'ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

// أعمدة بسيطة (لون واحد) مع تلميح
function volumeBars(rows, H = 160) {
  const box = document.createElement('div');
  const W = 700, padB = 22, max = Math.max(1, ...rows.map((r) => r[1])), bw = W / rows.length, barW = Math.max(3, Math.min(28, bw - 4));
  const every = Math.ceil(rows.length / 7);
  box.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <g class="grid"><line x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}"/></g>
    ${rows.map(([d, v], i) => {
      const x = (EN ? i : rows.length - 1 - i) * bw + (bw - barW) / 2, h = ((H - padB - 8) * v) / max;
      return `<g class="vb" data-i="${i}"><rect x="${x}" y="${H - padB - h}" width="${barW}" height="${Math.max(v ? 2 : 0, h)}" rx="3" fill="var(--green)"/>
        <rect x="${(EN ? i : rows.length - 1 - i) * bw}" y="0" width="${bw}" height="${H - padB}" fill="transparent"/>
        ${(rows.length - 1 - i) % every === 0 ? `<text x="${x + barW / 2}" y="${H - 6}" text-anchor="middle">${new Intl.DateTimeFormat(EN ? 'en-GB' : 'ar', { day: 'numeric', month: 'short' }).format(new Date(d + 'T12:00:00Z'))}</text>` : ''}</g>`;
    }).join('')}</svg>`;
  const svg = box.firstElementChild;
  svg.addEventListener('mousemove', (e) => { const g = e.target.closest('.vb'); if (!g) return tipHide(); const [d, v] = rows[+g.dataset.i]; tipShow(e, `${fmtDate(d, { day: 'numeric', month: 'long' })}<br><b>${v}</b> ${L('مادة', 'items')}`); });
  svg.addEventListener('mouseleave', tipHide);
  return box;
}
const hbarsHTML = (rows, label = esc, n = 8) => {
  if (!rows.length) return `<span class="time">${L('ما فيه بيانات كافية بعد.', 'Not enough data yet.')}</span>`;
  const max = rows[0][1];
  return `<div class="hbars">${rows.slice(0, n).map(([k, v]) => `<div class="hbar"><span>${label(k)}</span><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div><b>${v}</b></div>`).join('')}</div>`;
};
const countBy = (items, key) => Object.entries(items.reduce((m, i) => { if (i[key]) m[i[key]] = (m[i[key]] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
const tonesOf = (items) => { const o = { positive: 0, neutral: 0, critical: 0 }; items.forEach((i) => o[i.tone || 'neutral']++); return o; };

// ================= ملفات الصحف =================
async function sourcePage() {
  const name = P.get('s');
  const [stats, n, a] = await Promise.all([load('stats', { days: {} }), load('news'), load('articles')]);
  const items = [...n, ...a].sort(byNewest);
  const days = [...Array(90)].map((_, i) => dayKey(89 - i));
  const agg = {};
  for (const d of days) {
    const s = stats.days?.[d]; if (!s) continue;
    for (const [src, c] of Object.entries(s.sources || {})) { const x = (agg[src] ||= { count: 0, tone: [0, 0, 0] }); x.count += c; }
    for (const [src, tn] of Object.entries(s.sourceTone || {})) { const x = (agg[src] ||= { count: 0, tone: [0, 0, 0] }); tn.forEach((v, k) => { x.tone[k] += v; }); }
  }
  for (const i of items) if (!agg[i.source]) { agg[i.source] = { count: 0, tone: [0, 0, 0], fromItems: true }; }
  for (const [src, x] of Object.entries(agg)) if (x.fromItems || !x.count) { const mine = items.filter((i) => i.source === src); const tn = tonesOf(mine); x.count = mine.length; x.tone = [tn.positive, tn.neutral, tn.critical]; }
  const countryOf = Object.fromEntries(items.filter((i) => i.country).map((i) => [i.source, i.country]));
  const total = Object.values(agg).reduce((s, x) => s + x.count, 0);
  const root = $('#list-root');

  if (!name) {
    pageHead('sources');
    const rows = Object.entries(agg).sort((x, y) => y[1].count - x[1].count);
    root.innerHTML = rows.length ? `<div class="page-grid">${rows.map(([src, x]) => {
      const tt = x.tone.reduce((s, v) => s + v, 0) || 1;
      return `<a class="card src-card" href="source.html?s=${encodeURIComponent(src)}">
        <div class="top"><span class="src">${flag(countryOf[src])}${esc(src)}</span><span class="time">${countryOf[src] ? esc(regionName(countryOf[src])) : ''}</span></div>
        <div class="big-num">${x.count}<small> ${L('مادة', 'items')} · ${pct(x.count, total)}%</small></div>
        <div class="meter thin"><span style="width:${(x.tone[0] / tt) * 100}%;background:var(--green)"></span><span style="width:${(x.tone[1] / tt) * 100}%;background:var(--line2)"></span><span style="width:${(x.tone[2] / tt) * 100}%;background:var(--amber)"></span></div>
      </a>`;
    }).join('')}</div>` : empty();
    return;
  }

  const x = agg[name] || { count: 0, tone: [0, 0, 0] };
  const mine = items.filter((i) => i.source === name);
  const cc = countryOf[name];
  $('#page-head').innerHTML = `<a class="back" href="source.html">${L('→ كل الصحف', '← All outlets')}</a>
    <h2>${flag(cc)} ${esc(name)}</h2><p>${cc ? esc(regionName(cc)) + ' · ' : ''}${L('ملف تغطية السعودية خلال آخر ٩٠ يوم', 'Saudi coverage profile, last 90 days')}</p>`;
  const tt = { positive: x.tone[0], neutral: x.tone[1], critical: x.tone[2] };
  root.innerHTML = `
    <div class="kpis">
      <div class="panel kpi"><span>${L('مادة عن السعودية', 'Items on Saudi Arabia')}</span><b>${x.count}</b><small>${L('آخر ٩٠ يوم', 'last 90 days')}</small></div>
      <div class="panel kpi"><span>${L('حصتها من التغطية', 'Share of coverage')}</span><b>${pct(x.count, total)}%</b><small>${L('من كل المواد المرصودة', 'of all tracked items')}</small></div>
      <div class="panel kpi" style="grid-column:span 2"><span>${L('نبرتها تجاه السعودية', 'Tone toward Saudi Arabia')}</span><div style="margin-top:12px">${toneMeter(tt, x.count)}</div></div>
    </div>
    <div class="an-grid">
      <div class="panel"><div class="chart-title"><h3>${L('حجم التغطية يوميًا', 'Daily coverage')}</h3></div><p class="chart-sub">${L('آخر ٣٠ يوم', 'Last 30 days')}</p><div id="vol"></div></div>
      <div class="panel"><div class="chart-title"><h3>${L('مواضيعها', 'Its topics')}</h3></div><p class="chart-sub">${L('من المواد المحفوظة حاليًا', 'From currently stored items')}</p>${hbarsHTML(countBy(mine, 'topic'), (k) => esc(topicName(k)))}</div>
    </div>
    <div class="h2"><h2>${L('آخر ما نشرته', 'Latest from this outlet')}</h2></div>
    <div class="page-grid">${mine.slice(0, 30).map((i) => card(i)).join('') || empty(L('ما فيه مواد محفوظة حاليًا.', 'No stored items right now.'))}</div>`;
  $('#vol').append(volumeBars(days.slice(-30).map((d) => [d, stats.days?.[d]?.sources?.[name] || 0])));
}

// ================= الأرشيف =================
async function archivePage() {
  pageHead('archive');
  const index = await load('archive/index', {});
  const daysAll = Object.keys(index).sort();
  const root = $('#list-root');
  if (!daysAll.length) { root.innerHTML = empty(L('الأرشيف يبدأ يتجمع من أول يوم تشغيل.', 'The archive starts building from the first day the site runs.')); return; }
  let sel = P.get('d') && index[P.get('d')] != null ? P.get('d') : daysAll[daysAll.length - 1];
  let month = sel.slice(0, 7);
  const max = Math.max(...Object.values(index));
  root.innerHTML = `<div class="archive"><div class="panel cal" id="cal"></div><div id="day"></div></div>`;

  const paintCal = () => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1)), daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const startDow = (first.getUTCDay() + 1) % 7; // الأسبوع يبدأ السبت
    const wd = EN ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push('<span></span>');
    for (let d = 1; d <= daysIn; d++) {
      const k = `${month}-${String(d).padStart(2, '0')}`, n = index[k];
      cells.push(n != null ? `<button class="cd ${k === sel ? 'sel' : ''}" data-d="${k}" style="--h:${0.15 + 0.85 * (n / max)}"><b>${d}</b><i>${n}</i></button>` : `<span class="cd off"><b>${d}</b></span>`);
    }
    const mName = new Intl.DateTimeFormat(EN ? 'en-GB' : 'ar', { month: 'long', year: 'numeric' }).format(first);
    $('#cal').innerHTML = `<div class="cal-head"><button class="round" data-m="-1">${EN ? '‹' : '›'}</button><b>${mName}</b><button class="round" data-m="1">${EN ? '›' : '‹'}</button></div>
      <div class="cal-grid">${wd.map((w) => `<em>${w}</em>`).join('')}${cells.join('')}</div>`;
  };
  $('#cal').onclick = (e) => {
    const mb = e.target.closest('[data-m]');
    if (mb) { const [y, m] = month.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + +mb.dataset.m, 1)); month = d.toISOString().slice(0, 7); paintCal(); return; }
    const b = e.target.closest('[data-d]'); if (b) { sel = b.dataset.d; history.replaceState(null, '', `?d=${sel}`); paintCal(); paintDay(); }
  };
  const paintDay = async () => {
    const data = await load(`archive/${sel}`, { items: [], brief: null });
    const items = (data.items || []).sort(byNewest);
    $('#day').innerHTML = `<div class="h2"><h2>${fmtDate(sel, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} <small>${t('items', { n: items.length })}</small></h2></div>
      <div id="day-brief"></div>
      <div class="filters"><input id="aq" type="search" placeholder="${t('search')}"></div>
      <div class="page-grid" id="day-items"></div>`;
    if (data.brief) {
      $('#day-brief').innerHTML = briefPanel(data.brief, items);
      bindBrief(data.brief, items);
      $('#day-brief').querySelectorAll('.story-link').forEach((a) => { a.href += `&d=${sel}`; });
    }
    const paint = () => { const q = norm($('#aq').value); const rows = items.filter((i) => !q || norm(`${i.title_ar} ${i.title_en}`).includes(q)); $('#day-items').innerHTML = rows.map((i) => card(i)).join('') || empty(t('noResults')); };
    $('#aq').oninput = paint; paint();
  };
  paintCal(); paintDay();
}

// ================= التقرير الأسبوعي =================
async function reportPage() {
  pageHead('reports');
  const index = await load('weekly/index', []);
  const root = $('#list-root');
  if (!index.length) { root.innerHTML = empty(L('أول تقرير أسبوعي يُكتب تلقائيًا بعد ما يجمع الموقع ٣ أيام على الأقل من البيانات (ويحتاج مفتاح الذكاء الاصطناعي).', 'The first weekly report is written automatically once the site has at least 3 days of data (requires the AI key).')); return; }
  const date = P.get('d') && index.some((x) => x.date === P.get('d')) ? P.get('d') : index[0].date;
  const r = await load(`weekly/${date}`, null);
  if (!r) { root.innerHTML = empty(); return; }
  const N = r.numbers || {};
  const lbl = (x) => esc(regionName(x));
  root.innerHTML = `
    <div class="report-tools btns">
      <select id="rep-sel" class="btn">${index.map((x) => `<option value="${x.date}" ${x.date === date ? 'selected' : ''}>${fmtDate(x.date, { day: 'numeric', month: 'long', year: 'numeric' })} · ${esc(x.title)}</option>`).join('')}</select>
      <button class="btn primary" onclick="print()">🖨 ${L('طباعة / حفظ PDF', 'Print / save PDF')}</button>
      <button class="btn" id="rep-wa">${ICON.wa} ${L('مشاركة', 'Share')}</button>
    </div>
    <article class="report panel">
      <div class="tag">BKN WEEKLY · ${fmtDate(r.from, { day: 'numeric', month: 'short' })} – ${fmtDate(r.to, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <h1>${esc(r.title || '')}</h1>
      <p class="intro">${esc(r.intro || '')}</p>
      <div class="kpis">
        <div class="kpi"><span>${L('مادة صحفية', 'Items')}</span><b>${N.total ?? '—'}</b></div>
        <div class="kpi"><span>${L('عن ولي العهد', 'On the Crown Prince')}</span><b>${N.mbs ?? '—'}</b></div>
        <div class="kpi"><span>${t('tone.positive')}</span><b style="color:var(--green)">${pct(N.positive, N.total)}%</b></div>
        <div class="kpi"><span>${t('tone.critical')}</span><b style="color:var(--amber)">${pct(N.critical, N.total)}%</b></div>
      </div>
      <div class="rep-grid">
        <section><h3>${L('أبرز ما ميّز الأسبوع', 'Week highlights')}</h3><ol class="rep-list">${(r.highlights || []).map((h) => `<li>${esc(h)}</li>`).join('')}</ol></section>
        <section><h3>${L('حجم التغطية يوميًا', 'Daily coverage')}</h3><div id="rep-vol"></div></section>
      </div>
      <h3>${L('القصص الكبرى', 'Big stories')}</h3>
      <div class="rep-stories">${(r.stories || []).map((s, i) => `<div class="rep-story"><b>${String(i + 1).padStart(2, '0')}</b><div><h4>${esc(s.title)}</h4><p>${esc(s.summary)}</p></div></div>`).join('')}</div>
      ${r.mbs ? `<div class="rep-mbs"><h3>${L('ولي العهد في الصحافة العالمية', 'The Crown Prince in the world press')}</h3><p>${esc(r.mbs)}</p></div>` : ''}
      <div class="rep-grid three">
        <section><h3>${L('أكثر الدول', 'Top countries')}</h3>${hbarsHTML(N.countries || [], lbl, 6)}</section>
        <section><h3>${L('أكثر الصحف', 'Top outlets')}</h3>${hbarsHTML(N.sources || [], esc, 6)}</section>
        <section><h3>${L('أكثر المواضيع', 'Top topics')}</h3>${hbarsHTML(N.topics || [], (k) => esc(topicName(k)), 6)}</section>
      </div>
      ${r.outlook ? `<div class="mood"><b>${L('ماذا بعد؟', "What's next?")}</b> ${esc(r.outlook)}</div>` : ''}
      <p class="time">${L('تقرير مولّد آليًا من BKN', 'Automatically generated by BKN')} · ${fmtTime(r.generated || r.date)}</p>
    </article>`;
  $('#rep-vol').append(volumeBars(N.daily || [], 150));
  $('#rep-sel').onchange = (e) => { location.search = `?d=${e.target.value}`; };
  $('#rep-wa').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(`📊 ${r.title}\n\n${(r.highlights || []).map((h) => '• ' + h).join('\n')}\n\n${location.href}`), '_blank', 'noopener');
}

// ================= الخط الزمني للقصة =================
async function storyPage() {
  pageHead('story');
  const id = P.get('id'), d = P.get('d');
  let brief, items;
  if (d) { const a = await load(`archive/${d}`, { items: [], brief: null }); brief = a.brief; items = a.items; }
  else { const [b, n, a] = await Promise.all([load('brief', null), load('news'), load('articles')]); brief = b; items = [...n, ...a]; }
  let story = brief?.stories?.find((s) => s.id === id);
  if (!story && !d) { // ندوّر في أرشيف آخر ١٤ يوم
    for (let k = 0; k < 14 && !story; k++) { const a = await load(`archive/${dayKey(k)}`, null); const s = a?.brief?.stories?.find((x) => x.id === id); if (s) { story = s; items = [...items, ...a.items]; } }
  }
  const root = $('#list-root');
  if (!story) { root.innerHTML = empty(L('ما لقينا هذي القصة.', 'Story not found.')); return; }
  const byId = new Map(items.map((i) => [i.id, i]));
  const list = story.ids.map((x) => byId.get(x)).filter(Boolean).sort((a, b) => (a.published || '').localeCompare(b.published || ''));
  if (!list.length) { root.innerHTML = empty(); return; }
  const countries = countBy(list, 'country');
  const span = (new Date(list[list.length - 1].published) - new Date(list[0].published)) / 3600e3;
  root.innerHTML = `
    <div class="panel story-hero"><h1>${esc(story.title)}</h1><p>${esc(story.summary || '')}</p></div>
    <div class="kpis">
      <div class="panel kpi"><span>${L('صحيفة غطّتها', 'Outlets covering it')}</span><b>${new Set(list.map((i) => i.source)).size}</b></div>
      <div class="panel kpi"><span>${L('دولة', 'Countries')}</span><b>${countries.length}</b></div>
      <div class="panel kpi"><span>${L('أول من نشر', 'First to report')}</span><b class="kpi-text">${flag(list[0].country)} ${esc(list[0].source)}</b><small>${fmtTime(list[0].published)}</small></div>
      <div class="panel kpi"><span>${L('مدة انتشارها', 'Spread over')}</span><b>${span < 1 ? Math.round(span * 60) + (EN ? ' min' : ' د') : Math.round(span) + (EN ? ' h' : ' س')}</b></div>
    </div>
    <div class="an-grid">
      <div class="panel"><div class="chart-title"><h3>${L('الخط الزمني', 'Timeline')}</h3></div>
        <ol class="timeline">${list.map((i, k) => { cache.set(i.id, i); return `<li class="${k === 0 ? 'first' : ''}">
          <time>${fmtTime(i.published)}</time>
          <div><div class="top"><a class="src" href="source.html?s=${encodeURIComponent(i.source)}">${flag(i.country)}${esc(i.source)}</a>
            ${k === 0 ? `<span class="tone positive">${L('أول من نشر', 'First')}</span>` : `<span class="time">+${Math.max(1, Math.round((new Date(i.published) - new Date(list[0].published)) / 60000))} ${t('minute')}</span>`}
            ${i.tone && i.tone !== 'neutral' ? `<span class="tone ${i.tone}">${t('tone.' + i.tone)}</span>` : ''}</div>
          <a href="${safeUrl(i.url)}" target="_blank" rel="noopener">${esc(T_(i))}</a></div></li>`; }).join('')}</ol></div>
      <div class="panel"><div class="chart-title"><h3>${L('كيف غطّتها كل دولة', 'Coverage by country')}</h3></div><p class="chart-sub">${L('عدد المواد ونبرتها', 'Item count and tone')}</p>
        <div class="cmp">${countries.map(([c, n]) => { const tn = tonesOf(list.filter((i) => i.country === c)); return `<div class="cmp-row">
          <span>${flag(c)} ${esc(regionName(c))}</span><b>${n}</b>
          <div class="meter thin"><span style="width:${pct(tn.positive, n)}%;background:var(--green)"></span><span style="width:${pct(tn.neutral, n)}%;background:var(--line2)"></span><span style="width:${pct(tn.critical, n)}%;background:var(--amber)"></span></div></div>`; }).join('')}</div>
        <div class="legend-row" style="margin-top:14px"><span><i style="background:var(--green)"></i>${t('tone.positive')}</span><span><i style="background:var(--line2)"></i>${t('tone.neutral')}</span><span><i style="background:var(--amber)"></i>${t('tone.critical')}</span></div>
      </div>
    </div>`;
}

({ source: sourcePage, archive: archivePage, report: reportPage, story: storyPage })[document.body.dataset.page]?.();
