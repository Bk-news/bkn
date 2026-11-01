// ================= إعدادات =================
const SITE = { name: 'BKN' };
const BREAKING_TTL = 60 * 60 * 1000;   // العاجل يجلس ساعة
const BREAKING_POLL = 3000;            // فحص العاجل كل ٣ ثواني
const CONTENT_POLL = 60000;            // تحديث الأخبار والمقالات كل دقيقة
const ROTATE = 7000;                   // تبديل الخبر في الكاشة
const STORY_MS = 7000;                 // مدة كل ستوري
const CLOCKS = [
  ['الرياض', 'Asia/Riyadh', true], ['لندن', 'Europe/London'], ['واشنطن', 'America/New_York'],
  ['باريس', 'Europe/Paris'], ['بكين', 'Asia/Shanghai'], ['طوكيو', 'Asia/Tokyo'],
];
const NAV = [
  ['index.html', 'home'], ['saudi.html', 'saudi'], ['mbs.html', 'mbs'], ['news.html', 'news'], ['articles.html', 'articles'],
  ['analytics.html', 'analytics'], ['archive.html', 'archive'], ['report.html', 'reports'], ['breaking.html', 'breaking', 'red'],
];
const MENU = [['saved.html', 'mine', '★'], ['source.html', 'sources', '📰'], ['video.html', 'video', '🎬'], ['screen.html', 'screen', '📺'], ['#minute', 'minute', '▶']];

// ================= أدوات =================
const $ = (s, el = document) => el.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : '#'; } catch { return '#'; } };
const store = {
  get: (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const rtf = new Intl.RelativeTimeFormat(LANG, { numeric: 'auto' });
const regionName = (() => { try { const d = new Intl.DisplayNames([LANG], { type: 'region' }); return (c) => { try { return d.of(c); } catch { return c; } }; } catch { return (c) => c; } })();
function ago(iso) {
  const s = (new Date(iso) - Date.now()) / 1000, a = Math.abs(s);
  if (a < 60) return EN ? 'just now' : 'الآن';
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}
const fmtDate = (d, opt = { day: 'numeric', month: 'long', year: 'numeric' }) => new Intl.DateTimeFormat(EN ? 'en-GB' : 'ar', opt).format(new Date(d.length === 10 ? d + 'T12:00:00Z' : d));
const flag = (c) => /^[A-Z]{2}$/.test(c || '') ? `<img class="flag" src="https://flagcdn.com/w40/${c.toLowerCase()}.png" alt="" title="${esc(regionName(c))}" loading="lazy" onerror="this.remove()">` : '';
async function load(name, fallback = []) {
  try {
    const r = await fetch(`data/${name}.json?t=${Date.now()}`, { cache: 'no-store' });
    const d = r.ok ? ((await r.json()) ?? fallback) : fallback;
    if (Array.isArray(d) && (name === 'articles' || name === 'breaking')) d.forEach((i) => { i.kind ||= name === 'articles' ? 'article' : 'breaking'; });
    return d;
  } catch { return fallback; }
}
const live = (list) => list.filter((b) => Date.now() - new Date(b.added || b.published) < BREAKING_TTL);
const byNewest = (a, b) => (b.published || '').localeCompare(a.published || '');
const ICON = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 .9c.3.1.5.2.5.3.1.2.1.8-.1 1.5z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  saved: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
};

// ================= الثيم =================
let theme = store.get('bkn-theme', 'dark');
document.documentElement.dataset.theme = theme;

// ================= الإطار =================
function renderShell() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.body.insertAdjacentHTML('afterbegin', `
    <div id="breaking-bar" hidden><div class="wrap bb">
      <span class="bb-label"><span class="bb-dot"></span>${t('breaking')}</span>
      <div class="bb-text"></div><span class="bb-count"></span>
    </div><div class="bb-progress"></div></div>
    <div class="clocks"><div class="wrap">
      ${CLOCKS.map(([n, , home], i) => `<span class="clock ${home ? 'home' : ''}">${cityName(n)} <b id="clk${i}">--:--</b></span>`).join('')}
      <span class="live"><i></i><span id="updated">${t('live')}</span></span>
      <button class="alert-btn" id="alert-btn"></button>
    </div></div>
    <header class="site"><div class="wrap head">
      <a class="brand" href="index.html"><div class="radar"></div>
        <div><h1>${SITE.name}<span>.</span></h1><p>${t('tagline')}</p></div></a>
      <nav class="main">${NAV.map(([h, k, c]) => `<a href="${h}" class="${c || ''} ${h === here ? 'active' : ''}">${t('nav.' + k)}</a>`).join('')}</nav>
      <div class="tools">
        <button class="round lang" id="lang-btn" title="English / عربي">${EN ? 'ع' : 'EN'}</button>
        <button class="round" id="theme-btn"></button>
        <div class="menu-wrap"><button class="round" id="menu-btn" aria-label="menu">☰<span class="dot-badge" id="watch-badge" hidden></span></button>
          <div class="menu" id="menu" hidden>${MENU.map(([h, k, i]) => `<a href="${h}" data-menu="${k}"><span>${i}</span>${t('menu.' + k)}${k === 'mine' ? '<b id="watch-count"></b>' : ''}</a>`).join('')}</div></div>
      </div>
    </div></header>
    <div id="stories" hidden></div>
    <div class="modal" id="img-modal" hidden></div>
    <div id="tip"></div>`);
  document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap">${t('footer')}
    <div class="foot-links">${[...NAV, ...MENU.slice(0, 4)].map(([h, k]) => `<a href="${h}">${t(NAV.some((n) => n[1] === k) ? 'nav.' + k : 'menu.' + k)}</a>`).join('')}</div></div></footer>`);

  const fmt = CLOCKS.map(([, tz]) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
  const tick = () => fmt.forEach((f, i) => { const el = $(`#clk${i}`); if (el) el.textContent = f.format(new Date()); });
  tick(); setInterval(tick, 1000);

  const tb = $('#theme-btn');
  const paintTheme = () => { tb.textContent = theme === 'dark' ? '☀︎' : '☾'; document.documentElement.dataset.theme = theme; };
  paintTheme();
  tb.onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set('bkn-theme', theme); paintTheme(); document.dispatchEvent(new Event('themechange')); };
  $('#lang-btn').onclick = () => { store.set('bkn-lang', EN ? 'ar' : 'en'); location.reload(); };

  const menu = $('#menu');
  $('#menu-btn').onclick = (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu-wrap')) menu.hidden = true; });
  $('[data-menu=minute]').onclick = (e) => { e.preventDefault(); menu.hidden = true; openStories(); };
  setupAlerts();
}

// ================= التنبيهات =================
let alertsOn = store.get('bkn-alerts', false);
function setupAlerts() {
  const btn = $('#alert-btn');
  const paint = () => { btn.classList.toggle('on', alertsOn); btn.textContent = alertsOn ? t('alertOn') : t('alertOff'); };
  paint();
  btn.onclick = async () => {
    alertsOn = !alertsOn;
    if (alertsOn && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    store.set('bkn-alerts', alertsOn); paint();
    if (alertsOn) beep();
  };
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .18].forEach((tt, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = i ? 1046 : 784; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(.0001, ctx.currentTime + tt);
      g.gain.exponentialRampToValueAtTime(.25, ctx.currentTime + tt + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + tt + .16);
      o.start(ctx.currentTime + tt); o.stop(ctx.currentTime + tt + .18);
    });
  } catch {}
}
function notify(title, body) {
  if (!alertsOn) return;
  beep();
  if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(title, { body, icon: 'assets/icon-192.png' }); } catch {} }
}
let titleTimer = null;
const baseTitle = document.title;
function flashTitle(text) {
  clearInterval(titleTimer); let on = false, n = 0;
  titleTimer = setInterval(() => { document.title = (on = !on) ? `🔴 ${t('breaking')}: ${text}` : baseTitle; if (++n > 20) { clearInterval(titleTimer); document.title = baseTitle; } }, 1000);
}

// ================= كاشة العاجل =================
let bItems = [], bIdx = 0, known = null, bSig = '';
function paintBar() {
  const bar = $('#breaking-bar'); if (!bar) return;
  if (!bItems.length) { bar.hidden = true; return; }
  bar.hidden = false;
  const it = bItems[bIdx % bItems.length], tx = $('.bb-text', bar);
  tx.style.animation = 'none'; tx.offsetHeight; tx.style.animation = '';
  tx.innerHTML = `<a href="${safeUrl(it.url)}" target="_blank" rel="noopener">${esc(T_(it))}</a><span class="bb-src"><bdi>${esc(it.source)}</bdi> · ${ago(it.published)}</span>`;
  $('.bb-count', bar).textContent = bItems.length > 1 ? `${(bIdx % bItems.length) + 1}/${bItems.length}` : '';
  const p = $('.bb-progress', bar); p.style.animation = 'none'; p.offsetHeight;
  p.style.animation = bItems.length > 1 ? `bbp ${ROTATE}ms linear forwards` : 'none';
}
async function refreshBreaking() {
  bItems = live(await load('breaking'));
  if (known) {
    const fresh = bItems.filter((b) => !known.has(b.id));
    if (fresh.length) { bIdx = bItems.indexOf(fresh[0]); flashTitle(T_(fresh[0])); notify(`${t('breaking')} | ${fresh[0].source}`, T_(fresh[0])); }
  }
  known = new Set(bItems.map((b) => b.id));
  const sig = bItems.map((b) => b.id).join();
  if (sig !== bSig) { bSig = sig; if (bIdx >= bItems.length) bIdx = 0; paintBar(); }
  document.dispatchEvent(new CustomEvent('breaking', { detail: bItems }));
}

// ================= المحفوظات =================
let saved = store.get('bkn-saved', []);
const isSaved = (id) => saved.some((s) => s.id === id);
function toggleSave(it) {
  saved = isSaved(it.id) ? saved.filter((s) => s.id !== it.id) : [{ ...it, savedAt: new Date().toISOString() }, ...saved].slice(0, 300);
  store.set('bkn-saved', saved);
  document.dispatchEvent(new Event('savedchange'));
}

// ================= قائمة المتابعة =================
let watch = store.get('bkn-watch', []);
const norm = (s) => String(s || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
function watchHit(it) {
  if (!watch.length) return null;
  const hay = norm([it.title_ar, it.title_en, it.title_orig, ...(it.summary_ar || []), ...(it.summary_en || [])].join(' '));
  return watch.find((w) => hay.includes(norm(w))) || null;
}
async function checkWatch(items) {
  if (!watch.length) { paintWatchBadge(0); return; }
  const seen = new Set(store.get('bkn-watch-seen', []));
  const hits = items.filter((i) => watchHit(i));
  const fresh = hits.filter((i) => !seen.has(i.id));
  const first = store.get('bkn-watch-init', false);
  if (first && fresh.length) notify(t('watchNew', { w: watchHit(fresh[0]) }), T_(fresh[0]));
  if (!first) { store.set('bkn-watch-init', true); store.set('bkn-watch-seen', hits.map((i) => i.id)); paintWatchBadge(0); return; }
  paintWatchBadge(fresh.length);
}
function markWatchSeen(items) { store.set('bkn-watch-seen', [...new Set([...store.get('bkn-watch-seen', []), ...items.map((i) => i.id)])].slice(-3000)); paintWatchBadge(0); }
function paintWatchBadge(n) {
  const b = $('#watch-badge'), c = $('#watch-count');
  if (b) b.hidden = !n; if (c) c.textContent = n ? n : '';
}

// ================= البطاقة =================
const cache = new Map();
function card(it, cls = '') {
  cache.set(it.id, it);
  const pts = S_(it).map((p) => `<li>${esc(p)}</li>`).join('');
  const tone = it.tone || 'neutral', sv = isSaved(it.id), w = watchHit(it), sub = SUB_(it);
  return `<article class="card ${cls} ${w ? 'watched' : ''}" data-tone="${tone}">
    ${cls === 'lead' ? `<div class="kicker">${t('kicker')}</div>` : ''}
    <div class="top"><a class="src" href="source.html?s=${encodeURIComponent(it.source)}">${flag(it.country)}${esc(it.source)}</a>
      ${it.tone && it.tone !== 'neutral' ? `<span class="tone ${tone}">${t('tone.' + tone)}</span>` : ''}
      ${it.topic ? `<span class="topic">${esc(topicName(it.topic))}</span>` : ''}
      ${w ? `<span class="watch-tag">👁 ${esc(w)}</span>` : ''}
      <span class="time">${ago(it.published)}</span></div>
    <h3><a href="${safeUrl(it.url)}" target="_blank" rel="noopener">${esc(T_(it))}</a></h3>
    ${sub ? `<p class="en">${esc(sub)}</p>` : ''}
    ${pts ? `<ul>${pts}</ul>` : ''}
    <div class="actions">
      <a class="read" href="${safeUrl(it.url)}" target="_blank" rel="noopener">${t('read')}</a>
      <button class="icon ${sv ? 'on' : ''}" data-act="save" data-id="${esc(it.id)}" title="${t(sv ? 'saved' : 'save')}">${sv ? ICON.saved : ICON.save}</button>
      <button class="icon" data-act="listen" data-id="${esc(it.id)}" title="${t('listen')}">${ICON.play}</button>
      <button class="icon" data-act="img" data-id="${esc(it.id)}" title="${t('img')}">${ICON.img}</button>
      <button class="icon" data-act="wa" data-id="${esc(it.id)}" title="${t('wa')}">${ICON.wa}</button>
      <button class="icon" data-act="copy" data-id="${esc(it.id)}" title="${t('copy')}">${ICON.copy}</button>
    </div>
  </article>`;
}
const shareText = (it) => `${T_(it)}\n${S_(it).map((p) => '• ' + p).join('\n')}\n\n${EN ? 'Source' : 'المصدر'}: ${it.source}\n${it.url}\n\n📡 ${EN ? 'via' : 'عبر'} BKN`;

// ================= الصوت =================
let speakingKey = null;
function speak(key, parts, btn) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  document.querySelectorAll('[data-speak]').forEach((x) => { x.classList.remove('on'); x.removeAttribute('data-speak'); });
  if (speakingKey === key) { speakingKey = null; return; }
  speakingKey = key; btn?.classList.add('on'); btn?.setAttribute('data-speak', '1');
  const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith(EN ? 'en' : 'ar'));
  parts.filter(Boolean).forEach((text, i, arr) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = EN ? 'en-GB' : 'ar-SA'; if (voice) u.voice = voice;
    if (i === arr.length - 1) u.onend = () => { if (speakingKey === key) { speakingKey = null; btn?.classList.remove('on'); btn?.removeAttribute('data-speak'); } };
    speechSynthesis.speak(u);
  });
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const it = cache.get(b.dataset.id); if (!it) return;
  const act = b.dataset.act;
  if (act === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(shareText(it)), '_blank', 'noopener');
  if (act === 'copy') { try { await navigator.clipboard.writeText(shareText(it)); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 1200); } catch {} }
  if (act === 'listen') speak(it.id, [T_(it), ...S_(it)], b);
  if (act === 'img') openImage({ item: it });
  if (act === 'save') {
    toggleSave(it); const sv = isSaved(it.id);
    b.classList.toggle('on', sv); b.innerHTML = sv ? ICON.saved : ICON.save; b.title = t(sv ? 'saved' : 'save');
  }
});
const empty = (msg = t('gathering')) => `<div class="empty">${msg}</div>`;

async function updatedLine() {
  const m = await load('meta', {});
  const el = $('#updated');
  if (el && m?.updated) el.textContent = `${t('live')} · ${t('updated')} ${ago(m.updated)}`;
}

// ================= مصمم القوالب =================
let imgState = { item: null, brief: null, tpl: 'news', size: 'story' };
const SIZES = { story: [1080, 1920], post: [1080, 1350], x: [1600, 900] };
function openImage({ item = null, brief = null }) {
  const tpl = brief ? 'brief' : item.kind === 'breaking' || bItems.some((b) => b.id === item.id) ? 'breaking' : item.kind === 'article' ? 'article' : 'news';
  imgState = { item, brief, tpl, size: 'story' };
  const tpls = brief ? ['brief'] : ['news', 'breaking', 'article'];
  const m = $('#img-modal');
  m.innerHTML = `<div class="modal-box">
    <div class="modal-head"><h3>${t('imgTitle')}</h3><button class="round" data-close>×</button></div>
    <div class="seg" id="tpl-seg">${tpls.map((k) => `<button data-tpl="${k}" class="${k === tpl ? 'on' : ''} ${k === 'breaking' ? 'red' : ''}">${t('tpl.' + k)}</button>`).join('')}</div>
    <div class="seg" id="size-seg">${Object.keys(SIZES).map((k) => `<button data-size="${k}" class="${k === 'story' ? 'on' : ''}">${t('size.' + k)}</button>`).join('')}</div>
    <canvas id="img-canvas"></canvas>
    <div class="btns"><button class="btn primary" id="img-dl">${t('download')}</button><button class="btn" id="img-share">${t('share')}</button></div>
  </div>`;
  m.hidden = false;
  m.onclick = (e) => {
    if (e.target === m || e.target.closest('[data-close]')) { m.hidden = true; return; }
    const s = e.target.closest('[data-size]'); if (s) { imgState.size = s.dataset.size; m.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('on', x === s)); drawImage(); }
    const p = e.target.closest('[data-tpl]'); if (p) { imgState.tpl = p.dataset.tpl; m.querySelectorAll('[data-tpl]').forEach((x) => x.classList.toggle('on', x === p)); drawImage(); }
  };
  const name = () => `BKN-${imgState.tpl}-${imgState.size}.png`;
  $('#img-dl').onclick = () => { const a = document.createElement('a'); a.download = name(); a.href = $('#img-canvas').toDataURL('image/png'); a.click(); };
  $('#img-share').onclick = () => $('#img-canvas').toBlob(async (blob) => {
    const file = new File([blob], name(), { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch {} } else $('#img-dl').click();
  });
  drawImage();
}
async function drawImage() {
  await loadTemplateFonts();
  const [W, H] = SIZES[imgState.size], c = $('#img-canvas');
  c.width = W; c.height = H;
  drawTemplate(c.getContext('2d'), W, H, { tpl: imgState.tpl, item: imgState.item || {}, brief: imgState.brief || {}, lang: LANG });
}

// ================= الإحصاءات السريعة =================
function quickStats(items) {
  const day = items.filter((i) => Date.now() - new Date(i.published) < 864e5);
  const pool = day.length >= 10 ? day : items.slice(0, 80);
  const count = (key) => Object.entries(pool.reduce((m, i) => { if (i[key]) m[i[key]] = (m[i[key]] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const tones = { positive: 0, neutral: 0, critical: 0 }; pool.forEach((i) => tones[i.tone || 'neutral']++);
  return { pool, tones, countries: count('country'), label: day.length >= 10 ? t('last24') : t('lastN', { n: pool.length }) };
}
function toneMeter(tones, total) {
  const pct = (n) => Math.round((n / (total || 1)) * 100);
  return `<div class="meter">
      <span style="width:${pct(tones.positive)}%;background:var(--green)"></span>
      <span style="width:${pct(tones.neutral)}%;background:var(--line2)"></span>
      <span style="width:${pct(tones.critical)}%;background:var(--amber)"></span></div>
    <div class="legend">
      <div style="color:var(--green)"><b>${pct(tones.positive)}%</b>${t('tone.positive')}</div>
      <div style="color:var(--muted)"><b>${pct(tones.neutral)}%</b>${t('tone.neutral')}</div>
      <div style="color:var(--amber)"><b>${pct(tones.critical)}%</b>${t('tone.critical')}</div></div>`;
}
function countryBars(countries, n = 6) {
  const maxC = countries[0]?.[1] || 1;
  return `<div class="bars">${countries.slice(0, n).map(([c, k]) => `
    <div class="bar"><span>${flag(c)} ${esc(regionName(c))}</span><div class="track"><div class="fill" style="width:${(k / maxC) * 100}%"></div></div><b>${k}</b></div>`).join('') || '<span class="time">—</span>'}</div>`;
}
function pulsePanel(s) {
  return `<section><h4>${t('mood')} <small>${s.label}</small></h4>${toneMeter(s.tones, s.pool.length)}</section>
    <section><h4>${t('who')} <small><a href="analytics.html" style="color:var(--green)">${t('toAnalytics')}</a></small></h4>${countryBars(s.countries)}</section>`;
}

// ================= الستوري =================
let stItems = [], stI = 0, stTimer = null;
async function openStories() {
  stItems = (await load('news')).slice(0, 10).map((i) => (cache.set(i.id, i), i));
  if (!stItems.length) return;
  stI = 0; $('#stories').hidden = false; document.body.style.overflow = 'hidden'; showStory();
}
function closeStories() { clearTimeout(stTimer); $('#stories').hidden = true; document.body.style.overflow = ''; }
function showStory() {
  clearTimeout(stTimer);
  if (stI >= stItems.length) return closeStories();
  if (stI < 0) stI = 0;
  const it = stItems[stI];
  $('#stories').innerHTML = `<div class="st" style="--d:${STORY_MS}ms">
    <div class="st-bars">${stItems.map((_, i) => `<span class="${i < stI ? 'done' : i === stI ? 'now' : ''}"><i></i></span>`).join('')}</div>
    <div class="st-head"><span class="src">${flag(it.country)}${esc(it.source)}</span><span class="time">${ago(it.published)}</span><button class="x" aria-label="close">×</button></div>
    <div class="st-num">${String(stI + 1).padStart(2, '0')}</div>
    <div class="top">${it.topic ? `<span class="topic">${esc(topicName(it.topic))}</span>` : ''}${it.tone && it.tone !== 'neutral' ? `<span class="tone ${it.tone}">${t('tone.' + it.tone)}</span>` : ''}</div>
    <h3>${esc(T_(it))}</h3>
    ${S_(it).length ? `<ul>${S_(it).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    <button class="st-tap prev" aria-label="prev"></button><button class="st-tap next" aria-label="next"></button>
    <a class="read" href="${safeUrl(it.url)}" target="_blank" rel="noopener">${t('readShort')}</a>
  </div>`;
  $('.st .x').onclick = closeStories;
  $('.st-tap.next').onclick = () => { stI++; showStory(); };
  $('.st-tap.prev').onclick = () => { stI--; showStory(); };
  stTimer = setTimeout(() => { stI++; showStory(); }, STORY_MS);
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { const m = $('#img-modal'); if (m) m.hidden = true; }
  const st = $('#stories'); if (!st || st.hidden) return;
  if (e.key === 'Escape') closeStories();
  const fwd = EN ? 'ArrowRight' : 'ArrowLeft', back = EN ? 'ArrowLeft' : 'ArrowRight';
  if (e.key === fwd) { stI++; showStory(); }
  if (e.key === back) { stI--; showStory(); }
});

// ================= موجز BKN والقصص =================
function storiesOf(brief, all) {
  const byId = new Map(all.map((i) => [i.id, i]));
  return (brief?.stories || []).map((st) => ({ ...st, items: (st.ids || []).map((x) => byId.get(x)).filter(Boolean) })).filter((st) => st.items.length);
}
const B_ = (b) => (EN && b?.headline_en ? { ...b, headline: b.headline_en, points: b.points_en || b.points, mood: b.mood_en || b.mood,
  stories: (b.stories || []).map((s) => ({ ...s, title: s.title_en || s.title, summary: s.summary_en || s.summary })) } : b);
function briefPanel(brief, all) {
  brief = B_(brief);
  if (!brief?.headline) return '';
  const stories = storiesOf(brief, all);
  stories.forEach((st) => st.items.forEach((i) => cache.set(i.id, i)));
  return `<section class="brief panel">
    <div>
      <div class="tag">BKN BRIEF <i>· ${t('briefAgo', { t: ago(brief.updated) })}</i></div>
      <h2>${esc(brief.headline)}</h2>
      <ol>${(brief.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      ${brief.mood ? `<div class="mood">${esc(brief.mood)}</div>` : ''}
      <div class="btns">
        <button class="btn" id="play-brief">${t('playBrief')}</button>
        <button class="btn" id="play-bulletin">${t('playBulletin')}</button>
        <button class="btn" id="brief-img">🖼 ${t('tpl.brief')} 9:16</button>
      </div>
    </div>
    <div>
      <div class="h2"><h2>${t('bigStories')} <small>${stories.length}</small></h2></div>
      <div class="stories-list">${stories.map((st) => {
        const countries = [...new Set(st.items.map((i) => i.country).filter(Boolean))];
        return `<details class="story"><summary>
          <div class="n"><b>${st.items.length}</b><span>${t('outlets')}</span></div>
          <div><h4>${esc(st.title)}</h4><p>${esc(st.summary || '')}</p>
          <div class="flags">${countries.map(flag).join('')}</div></div></summary>
          <ul>${st.items.map((i) => `<li><span class="src">${flag(i.country)}${esc(i.source)}</span><a href="${safeUrl(i.url)}" target="_blank" rel="noopener">${esc(T_(i))}</a></li>`).join('')}</ul>
          ${st.id ? `<a class="story-link" href="story.html?id=${encodeURIComponent(st.id)}">${t('timeline')}</a>` : ''}
        </details>`;
      }).join('') || `<span class="time">${t('storiesEmpty')}</span>`}</div>
    </div>
  </section>`;
}
function bindBrief(brief, news) {
  brief = B_(brief);
  const a = $('#play-brief'), b = $('#play-bulletin'), c = $('#brief-img');
  const intro = EN ? 'BKN brief.' : 'موجز بي كي إن.';
  if (a) a.onclick = () => speak('brief', [intro, brief.headline, ...(brief.points || []), brief.mood], a);
  if (b) b.onclick = () => speak('bulletin', [EN ? 'The BKN audio bulletin.' : 'نشرة بي كي إن الصوتية.', brief.headline, ...(brief.points || []), EN ? 'Now the top headlines.' : 'وإليكم أبرز العناوين.',
    ...news.slice(0, 10).flatMap((n, i) => [`${i + 1}. ${EN ? 'From' : 'من'} ${n.source}.`, T_(n)]), EN ? 'That was the bulletin.' : 'انتهت النشرة.'], b);
  if (c) c.onclick = () => openImage({ brief });
}

// ================= أدوات الصفحات =================
function topicChips(items, active, onPick, el) {
  const topics = Object.entries(items.reduce((m, i) => { if (i.topic) m[i.topic] = (m[i.topic] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  el.innerHTML = topics.length ? `<button class="chip ${!active ? 'active' : ''}" data-t="">${t('all')}</button>` +
    topics.map(([tp, n]) => `<button class="chip ${tp === active ? 'active' : ''}" data-t="${esc(tp)}">${esc(topicName(tp))}<b>${n}</b></button>`).join('') : '';
  el.onclick = (e) => { const c = e.target.closest('.chip'); if (c) onPick(c.dataset.t); };
}
function pageHead(key, extra = '') {
  const el = $('#page-head'); if (!el) return;
  el.innerHTML = `<h2>${t('h.' + key)}</h2><p>${t('d.' + key)}${extra}</p>`;
}
function filtersBar() {
  return `<div class="filters">
    <input id="q" type="search" placeholder="${t('search')}">
    <select id="src"><option value="">${t('allSources')}</option></select>
    <select id="tone"><option value="">${t('allTones')}</option>${['positive', 'neutral', 'critical'].map((x) => `<option value="${x}">${t('tone.' + x)}</option>`).join('')}</select>
  </div><div class="chips" id="topics"></div><div class="page-grid" id="items"></div>`;
}

// ================= الصفحات =================
const pages = {
  home() {
    let news = [], articles = [], brief = null, topic = '', briefSig = '';
    const paint = () => {
      const rows = topic ? news.filter((n) => n.topic === topic) : news;
      const sig = brief?.updated + news.length;
      if (sig !== briefSig) { briefSig = sig; $('#brief').innerHTML = briefPanel(brief, [...news, ...articles]); if (brief) bindBrief(brief, news); }
      $('#lead').innerHTML = news[0] ? card(news[0], 'lead') : empty();
      $('#pulse').innerHTML = pulsePanel(quickStats([...news, ...articles]));
      topicChips(news, topic, (x) => { topic = x; paint(); }, $('#topics'));
      $('#latest').innerHTML = rows.slice(topic ? 0 : 1, 13).map((n) => card(n)).join('') || empty(t('noTopic'));
      $('#side-articles').innerHTML = articles.slice(0, 8).map((a) => card(a)).join('') || empty(t('noArticles'));
      checkWatch([...news, ...articles]);
    };
    applyI18n();
    return async () => { [news, articles, brief] = await Promise.all([load('news'), load('articles'), load('brief', null)]); paint(); };
  },

  // قائمة عامة: الأخبار، المقالات، قسم السعودية، قسم ولي العهد
  list(name) {
    const isSection = name === 'saudi' || name === 'mbs';
    pageHead(name);
    $('#list-root').innerHTML = (isSection ? '<div class="section-hero" id="section-hero"></div>' : '') + filtersBar();
    let all = [], topic = '';
    const q = $('#q'), src = $('#src'), tone = $('#tone'), out = $('#items');
    q.value = new URLSearchParams(location.search).get('q') || '';
    const paint = () => {
      const term = norm(q.value.trim());
      const rows = all.filter((i) => (!src.value || i.source === src.value) && (!tone.value || (i.tone || 'neutral') === tone.value) &&
        (!topic || i.topic === topic) &&
        (!term || norm(`${i.title_ar} ${i.title_en} ${i.title_orig} ${(i.summary_ar || []).join(' ')} ${(i.summary_en || []).join(' ')}`).includes(term)));
      out.innerHTML = rows.length ? rows.slice(0, 150).map((i) => card(i)).join('') : empty(t('noResults'));
      const ph = $('#page-head p'); if (ph) ph.dataset.count = t('items', { n: rows.length });
      topicChips(all, topic, (x) => { topic = x; paint(); }, $('#topics'));
    };
    q.oninput = paint; src.onchange = paint; tone.onchange = paint;
    return async () => {
      if (isSection) {
        const [n, a] = await Promise.all([load('news'), load('articles')]);
        const every = [...n, ...a].sort(byNewest);
        all = every.filter((i) => (name === 'mbs' ? i.subject === 'mbs' : i.subject !== 'mbs'));
        const wk = (l) => l.filter((i) => Date.now() - new Date(i.published) < 7 * 864e5);
        const mine = wk(all), tones = { positive: 0, neutral: 0, critical: 0 }; mine.forEach((i) => tones[i.tone || 'neutral']++);
        const cs = Object.entries(mine.reduce((m, i) => { if (i.country) m[i.country] = (m[i.country] || 0) + 1; return m; }, {})).sort((x, y) => y[1] - x[1]);
        $('#section-hero').innerHTML = `
          <div class="panel kpi"><span>${t('sectionCount')}</span><b>${mine.length}</b><small>${Math.round((mine.length / (wk(every).length || 1)) * 100)}% ${t('sectionShare')}</small></div>
          <div class="panel pulse"><h4>${t('sectionTone')}</h4>${toneMeter(tones, mine.length)}</div>
          <div class="panel pulse"><h4>${t('who')}</h4>${countryBars(cs, 3)}</div>`;
        checkWatch(every);
      } else { all = await load(name); checkWatch(all); }
      const keep = src.value, sources = [...new Set(all.map((i) => i.source))].sort();
      src.innerHTML = `<option value="">${t('allSources')}</option>` + sources.map((s) => `<option ${s === keep ? 'selected' : ''}>${esc(s)}</option>`).join('');
      paint();
    };
  },

  breaking() {
    pageHead('breaking');
    document.addEventListener('breaking', ({ detail }) => {
      $('#items').innerHTML = detail.length ? detail.map((b) => {
        cache.set(b.id, b);
        const left = Math.max(0, BREAKING_TTL - (Date.now() - new Date(b.added || b.published)));
        return `<div class="b-item">
          <div class="b-ring" style="--p:${(left / BREAKING_TTL) * 100}"><div><b>${Math.ceil(left / 60000)}</b><span>${t('minute')}</span></div></div>
          <div style="flex:1"><div class="top"><span class="src">${flag(b.country)}${esc(b.source)}</span><span class="time">${ago(b.published)}</span></div>
          <h3><a href="${safeUrl(b.url)}" target="_blank" rel="noopener">${esc(T_(b))}</a></h3>
          ${SUB_(b) ? `<p class="en">${esc(SUB_(b))}</p>` : ''}</div>
          <button class="btn red-btn" data-act="img" data-id="${esc(b.id)}">🖼 ${t('tpl.breaking')} 9:16</button></div>`;
      }).join('') : empty(t('breakingEmpty'));
    });
  },

  mine() {
    pageHead('mine');
    const root = $('#list-root');
    root.innerHTML = `
      <div class="panel watch-box">
        <h3>${t('watchTitle')}</h3>
        <form id="watch-form" class="filters" style="margin:0"><input id="watch-in" placeholder="${t('watchPh')}"><button class="btn primary">${t('add')}</button></form>
        <div class="chips" id="watch-chips"></div>
      </div>
      <div class="h2" style="margin-top:26px"><h2>${t('watchItems')}</h2></div><div class="page-grid" id="watch-items"></div>
      <div class="h2" style="margin-top:30px"><h2>${t('savedTitle')}</h2></div><div class="page-grid" id="saved-items"></div>`;
    let pool = [];
    const paint = () => {
      $('#watch-chips').innerHTML = watch.map((w, i) => `<span class="chip active">${esc(w)} <button data-rm="${i}" aria-label="remove">×</button></span>`).join('');
      const hits = pool.filter((i) => watchHit(i));
      $('#watch-items').innerHTML = !watch.length ? empty(t('watchEmpty')) : hits.length ? hits.slice(0, 60).map((i) => card(i)).join('') : empty(t('noResults'));
      $('#saved-items').innerHTML = saved.length ? saved.map((i) => card(i)).join('') : empty(t('savedEmpty'));
      markWatchSeen(hits);
    };
    $('#watch-form').onsubmit = (e) => {
      e.preventDefault(); const v = $('#watch-in').value.trim();
      if (v && !watch.includes(v)) { watch = [...watch, v]; store.set('bkn-watch', watch); }
      $('#watch-in').value = ''; paint();
    };
    $('#watch-chips').onclick = (e) => { const b = e.target.closest('[data-rm]'); if (b) { watch = watch.filter((_, i) => i !== +b.dataset.rm); store.set('bkn-watch', watch); paint(); } };
    document.addEventListener('savedchange', paint);
    return async () => { const [n, a] = await Promise.all([load('news'), load('articles')]); pool = [...n, ...a].sort(byNewest); paint(); };
  },
};

// ================= التشغيل =================
const page = document.body.dataset.page;
if (page !== 'screen') {
  renderShell();
  setInterval(() => { if (bItems.length > 1) { bIdx++; paintBar(); } }, ROTATE);
  updatedLine(); setInterval(updatedLine, 30000);
}
refreshBreaking(); setInterval(refreshBreaking, BREAKING_POLL);

const refresh = {
  home: () => pages.home(), news: () => pages.list('news'), articles: () => pages.list('articles'),
  saudi: () => pages.list('saudi'), mbs: () => pages.list('mbs'), saved: () => pages.mine(),
}[page]?.();
if (page === 'breaking') pages.breaking();
if (refresh) { refresh(); setInterval(refresh, CONTENT_POLL); }
else if (page !== 'screen') { Promise.all([load('news'), load('articles')]).then(([n, a]) => checkWatch([...n, ...a])); }
applyI18n();

// تطبيق على الجوال (PWA)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
