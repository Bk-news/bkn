// ================= صفحة التحليلات =================
// خريطة العالم مرسومة كمربعات (كل دولة مربع في مكانها التقريبي) بدون أي مكتبة خارجية
const TILES = {
  CA: [3, 1], US: [3, 2], MX: [3, 3], CO: [5, 5], BR: [6, 6], AR: [5, 7], CL: [4, 7],
  IE: [8, 1], GB: [9, 1], NO: [10, 0], SE: [11, 0], NL: [10, 1], DE: [11, 1], PL: [12, 1], RU: [14, 1],
  FR: [10, 2], CH: [11, 2], AT: [12, 2], UA: [13, 2], ES: [9, 3], IT: [11, 3], GR: [12, 3], TR: [13, 3], KW: [15, 3],
  MA: [9, 4], DZ: [10, 4], EG: [12, 4], IL: [13, 4], IQ: [14, 4], IR: [15, 4], PK: [17, 4],
  SA: [14, 5], QA: [15, 5], AE: [16, 5], IN: [17, 5],
  NG: [10, 6], ET: [13, 6], YE: [14, 6], OM: [16, 6], SG: [19, 6], MY: [18, 6],
  KE: [13, 7], ID: [20, 7], ZA: [11, 8], AU: [21, 8], NZ: [22, 9],
  CN: [19, 3], KR: [20, 2], JP: [21, 2], HK: [19, 4], TW: [20, 4],
};
const STOP = new Set(('من في على إلى الى عن مع أن إن ان ما لا هذا هذه التي الذي الذين و أو او ثم كما بعد قبل حول بين خلال عند كل قد لم لن هل حتى ضد عبر دون منذ أي ذلك تلك هو هي هم كان كانت يكون تكون وفي وعلى ومن بأن لها له فيها عليها إنها انها أنها لماذا كيف ماذا وسط أمام بشأن نحو ضمن جديد جديدة أكثر أول بعض غير '
  + 'السعودية السعودي السعوديين السعوديون المملكة العربية الرياض مع').split(' '));
const L = (ar, en) => (EN ? en : ar);
const STOP_EN = new Set('with from that this have will after over amid into about what says said their than they been were more saudi arabia arabia\'s kingdom riyadh new says'.split(' '));
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const tip = () => document.getElementById('tip');
function showTip(e, html) { const t = tip(); t.innerHTML = html; t.style.opacity = 1; const x = Math.min(e.clientX + 14, innerWidth - t.offsetWidth - 8); t.style.left = x + 'px'; t.style.top = (e.clientY + 14) + 'px'; }
const hideTip = () => { tip().style.opacity = 0; };
const fmtDay = (d) => new Intl.DateTimeFormat(EN ? 'en-GB' : 'ar', { day: 'numeric', month: 'short' }).format(new Date(d + 'T12:00:00Z'));
const num = (n) => new Intl.NumberFormat('en').format(n);

let RANGE = 30, STATS = { days: {} }, ITEMS = [], SEL = null;

function daysInRange() {
  const out = [];
  for (let i = RANGE - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    out.push([d, STATS.days[d] || { total: 0, positive: 0, neutral: 0, critical: 0, countries: {}, topics: {}, sources: {} }]);
  }
  return out;
}
function sumKey(days, key) {
  const m = {};
  days.forEach(([, d]) => Object.entries(d[key] || {}).forEach(([k, v]) => { m[k] = (m[k] || 0) + v; }));
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function kpis(days) {
  const tot = days.reduce((s, [, d]) => s + d.total, 0);
  const pos = days.reduce((s, [, d]) => s + d.positive, 0), crit = days.reduce((s, [, d]) => s + d.critical, 0);
  const p = (n) => tot ? Math.round((n / tot) * 100) : 0;
  return `
    <div class="panel kpi"><span>${L('مادة صحفية', 'Items')}</span><b>${num(tot)}</b><small>${L(`خلال آخر ${RANGE} يوم`, `in the last ${RANGE} days`)}</small></div>
    <div class="panel kpi"><span>${L('دولة كتبت عن السعودية', 'Countries covering Saudi')}</span><b>${sumKey(days, 'countries').length}</b><small>${L('حسب بلد الوسيلة الإعلامية', 'by outlet country')}</small></div>
    <div class="panel kpi"><span>${L('وسيلة إعلامية', 'Outlets')}</span><b>${sumKey(days, 'sources').length}</b><small>${L('صحف ووكالات ومجلات', 'papers, wires, magazines')}</small></div>
    <div class="panel kpi"><span>${L('إيجابي / ناقد', 'Positive / critical')}</span><b><span style="color:var(--green)">${p(pos)}%</span> <span style="color:var(--dim);font-size:22px">/</span> <span style="color:var(--amber)">${p(crit)}%</span></b><small>${L('والباقي محايد', 'the rest neutral')}</small></div>`;
}

function tileMap(days) {
  const counts = Object.fromEntries(sumKey(days, 'countries'));
  const max = Math.max(1, ...Object.values(counts));
  const S = 36, G = 4, cols = 23, rows = 10;
  const green = css('--green'), base = css('--bg2'), line = css('--line');
  const others = Object.keys(counts).filter((c) => !TILES[c]);
  const svg = `<svg class="chart" viewBox="0 0 ${cols * (S + G)} ${rows * (S + G)}" role="img" aria-label="map">
    ${Object.entries(TILES).map(([c, [x, y]]) => {
      const n = counts[c] || 0, t = n ? 0.18 + 0.82 * Math.sqrt(n / max) : 0;
      const px = x * (S + G);
      return `<g class="tile ${n ? '' : 'empty'} ${SEL === c ? 'sel' : ''}" data-c="${c}" data-n="${n}">
        <rect x="${px}" y="${y * (S + G)}" width="${S}" height="${S}" rx="7" fill="${n ? green : base}" fill-opacity="${n ? t : 1}" stroke="${line}"/>
        <text x="${px + S / 2}" y="${y * (S + G) + S / 2 + 4}">${c}</text></g>`;
    }).join('')}</svg>`;
  return svg + `<div class="scale"><span>${L('أقل', 'Less')}</span><div></div><span>${L('أكثر', 'More')}</span>
    ${others.length ? `<span style="margin-inline-start:auto">${L('دول أخرى', 'Others')}: ${others.map((c) => `${esc(regionName(c))} (${counts[c]})`).join(L('، ', ', '))}</span>` : ''}</div>
    <div class="country-list" id="country-list">${countryList()}</div>`;
}
function countryList() {
  if (!SEL) return `<span class="time">${L('اضغط على أي دولة في الخريطة تشوف آخر ما كتبته صحفها.', 'Click a country to see its latest coverage.')}</span>`;
  const rows = ITEMS.filter((i) => i.country === SEL).slice(0, 6);
  return `<b>${flag(SEL)} ${L('آخر ما كتبته صحف', 'Latest from')} ${esc(regionName(SEL))}</b>` + (rows.length
    ? rows.map((i) => `<div><span class="src">${esc(i.source)}</span> · <a href="${safeUrl(i.url)}" target="_blank" rel="noopener">${esc(T_(i))}</a> <span class="time">${ago(i.published)}</span></div>`).join('')
    : `<span class="time">${L('ما فيه مواد محفوظة حاليًا من هذي الدولة.', 'No stored items from this country.')}</span>`);
}

function toneChart(days) {
  const W = Math.max(320, $('#tone').clientWidth || 760), H = 240, padL = 34, padB = 26, padT = 10;
  const max = Math.max(4, ...days.map(([, d]) => d.total));
  const step = Math.ceil(max / 4), top = step * 4;
  const bw = (W - padL) / days.length, barW = Math.max(3, Math.min(26, bw - 3));
  const y = (v) => padT + (H - padT - padB) * (1 - v / top);
  const C = { positive: css('--green'), neutral: css('--line2'), critical: css('--amber') };
  const gap = 2;
  const bars = days.map(([day, d], i) => {
    const x = W - (i + 1) * bw + (bw - barW) / 2;
    let acc = 0, segs = '';
    for (const k of ['positive', 'neutral', 'critical']) {
      if (!d[k]) continue;
      const y1 = y(acc + d[k]), y0 = y(acc), h = Math.max(1, y0 - y1 - (acc ? gap : 0));
      segs += `<rect x="${x}" y="${y1}" width="${barW}" height="${h}" rx="${Math.min(3, barW / 3)}" fill="${C[k]}"/>`;
      acc += d[k];
    }
    return `<g class="tb" data-i="${i}">${segs}<rect x="${W - (i + 1) * bw}" y="${padT}" width="${bw}" height="${H - padT - padB}" fill="transparent"/></g>`;
  }).join('');
  const grid = [0, 1, 2, 3, 4].map((k) => `<line x1="${padL}" x2="${W}" y1="${y(k * step)}" y2="${y(k * step)}"/><text x="${padL - 6}" y="${y(k * step) + 4}" text-anchor="end">${k * step}</text>`).join('');
  const every = Math.ceil(days.length / 7);
  const labels = days.map(([day], i) => (days.length - 1 - i) % every === 0 ? `<text x="${W - (i + 0.5) * bw}" y="${H - 6}" text-anchor="middle">${fmtDay(day)}</text>` : '').join('');
  return `<svg class="chart" id="tone-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="tone"><g class="grid">${grid}</g>${bars}${labels}</svg>`;
}

function hbars(rows, label) {
  if (!rows.length) return `<span class="time">${L('ما فيه بيانات كافية بعد.', 'Not enough data yet.')}</span>`;
  const max = rows[0][1];
  return `<div class="hbars">${rows.slice(0, 10).map(([k, n]) => `<div class="hbar"><span>${label(k)}</span><div class="track"><div class="fill" style="width:${(n / max) * 100}%"></div></div><b>${n}</b></div>`).join('')}</div>`;
}

function words() {
  const since = Date.now() - Math.min(RANGE, 7) * 864e5, m = {};
  ITEMS.filter((i) => new Date(i.published) > since).forEach((i) => {
    if (EN) { (i.title_en || '').toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/\s+/).forEach((w) => { if (w.length > 3 && !STOP_EN.has(w)) m[w] = (m[w] || 0) + 1; }); return; }
    (i.title_ar || '').replace(/(^|\s)و?ولي العهد/g, '$1ولي_العهد').replace(/[^؀-ۿ_\s]/g, ' ').split(/\s+/).forEach((w) => {
      w = w.replace(/^[وفب](?=ال)/, '');
      if (w.length > 2 && !STOP.has(w)) m[w] = (m[w] || 0) + 1;
    });
  });
  const rows = Object.entries(m).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 36);
  if (!rows.length) return `<span class="time">${L('تظهر الكلمات لما تتجمع عناوين كافية.', 'Words appear once enough headlines build up.')}</span>`;
  const max = rows[0][1], min = rows[rows.length - 1][1];
  return `<div class="words">${rows.sort(() => Math.random() - .5).map(([w, n]) => {
    const t = max === min ? .5 : (n - min) / (max - min);
    const word = w.replace('_', ' ');
    return `<a href="news.html?q=${encodeURIComponent(word)}" style="font-size:${14 + t * 22}px;opacity:${.6 + t * .4}">${esc(word)}<sup>${n}</sup></a>`;
  }).join('')}</div>`;
}

function render() {
  const days = daysInRange();
  $('#kpis').innerHTML = kpis(days);
  $('#map').innerHTML = tileMap(days);
  $('#tone').innerHTML = toneChart(days);
  $('#sources').innerHTML = hbars(sumKey(days, 'sources'), esc);
  $('#topics-bars').innerHTML = hbars(sumKey(days, 'topics'), (x) => esc(topicName(x)));
  $('#sources').querySelectorAll('.hbar span').forEach((el) => { el.innerHTML = `<a href="source.html?s=${encodeURIComponent(el.textContent)}">${el.innerHTML}</a>`; });
  $('#words').innerHTML = words();
  $('#map-sub').textContent = L(`عدد المواد حسب بلد الوسيلة الإعلامية · آخر ${RANGE} يوم`, `Items by outlet country · last ${RANGE} days`);

  // تفاعل الخريطة
  $('#map svg').addEventListener('mousemove', (e) => {
    const g = e.target.closest('.tile'); if (!g) return hideTip();
    showTip(e, `${flag(g.dataset.c)} <b style="font-family:inherit">${esc(regionName(g.dataset.c))}</b><br><b>${g.dataset.n}</b> ${L('مادة', 'items')}`);
  });
  $('#map svg').addEventListener('mouseleave', hideTip);
  $('#map svg').addEventListener('click', (e) => {
    const g = e.target.closest('.tile'); if (!g || g.dataset.n === '0') return;
    SEL = SEL === g.dataset.c ? null : g.dataset.c;
    document.querySelectorAll('.tile').forEach((t) => t.classList.toggle('sel', t.dataset.c === SEL));
    $('#country-list').innerHTML = countryList();
  });
  // تفاعل الرسم
  $('#tone-svg').addEventListener('mousemove', (e) => {
    const g = e.target.closest('.tb'); if (!g) return hideTip();
    const [day, d] = days[+g.dataset.i];
    showTip(e, `${fmtDay(day)} · <b>${d.total}</b> ${L('مادة', 'items')}<br><span style="color:${css('--green')}">■</span> ${t('tone.positive')} <b>${d.positive}</b><br><span style="color:${css('--line2')}">■</span> ${t('tone.neutral')} <b>${d.neutral}</b><br><span style="color:${css('--amber')}">■</span> ${t('tone.critical')} <b>${d.critical}</b>`);
  });
  $('#tone-svg').addEventListener('mouseleave', hideTip);
}

(async () => {
  pageHead('analytics');
  const [s, n, a] = await Promise.all([load('stats', { days: {} }), load('news'), load('articles')]);
  STATS = s?.days ? s : { days: {} }; ITEMS = [...n, ...a].sort((x, y) => (y.published || '').localeCompare(x.published || ''));
  $('#range').onclick = (e) => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    RANGE = +b.dataset.r; document.querySelectorAll('#range button').forEach((x) => x.classList.toggle('on', x === b)); render();
  };
  render();
  document.addEventListener('themechange', render);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 200); });
})();
