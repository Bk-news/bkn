// ================= وضع الشاشة الكبيرة =================
(() => {
  const L = (ar, en) => (EN ? en : ar);
  const ROT = 12000;
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="scr">
    <div id="breaking-bar" hidden><div class="bb">
      <span class="bb-label"><span class="bb-dot"></span>${t('breaking')}</span><div class="bb-text"></div><span class="bb-count"></span>
    </div><div class="bb-progress"></div></div>
    <header class="scr-head">
      <div class="brand"><div class="radar"></div><div><h1>BKN<span>.</span></h1><p>${t('tagline')}</p></div></div>
      <div class="scr-clock"><b id="s-clock">--:--</b><span id="s-date"></span></div>
      <div class="scr-clocks" id="s-clocks"></div>
      <button class="round" id="s-fs" title="Fullscreen">⛶</button>
    </header>
    <main class="scr-main">
      <section class="scr-lead"><div class="scr-prog"><i id="s-prog"></i></div><div id="s-lead"></div></section>
      <aside class="scr-side">
        <div class="panel pulse" id="s-mood"></div>
        <div class="panel pulse" id="s-who"></div>
        <div class="panel pulse" id="s-stories"></div>
      </aside>
    </main>
    <footer class="scr-ticker"><span class="scr-tl">${L('آخر الأخبار', 'Latest')}</span><div class="scr-track"><div id="s-track"></div></div></footer>
    <div id="tip"></div>
  </div>`);

  const fmtC = (tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const riy = fmtC('Asia/Riyadh'), others = CLOCKS.slice(1).map(([n, tz]) => [n, new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })]);
  const tick = () => {
    $('#s-clock').textContent = riy.format(new Date());
    $('#s-date').textContent = new Intl.DateTimeFormat(EN ? 'en-GB' : 'ar', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Riyadh' }).format(new Date()) + ' · ' + cityName('الرياض');
    $('#s-clocks').innerHTML = others.map(([n, f]) => `<span>${cityName(n)} <b>${f.format(new Date())}</b></span>`).join('');
  };
  tick(); setInterval(tick, 1000);

  $('#s-fs').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  let idle; const wake = () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add('idle'), 3000); };
  addEventListener('mousemove', wake); wake();

  let news = [], idx = 0, timer;
  function showLead() {
    if (!news.length) { $('#s-lead').innerHTML = empty(); return; }
    const it = news[idx % news.length];
    $('#s-lead').innerHTML = `<div class="scr-card" data-tone="${it.tone || 'neutral'}">
      <div class="scr-meta"><span class="scr-n">${String((idx % news.length) + 1).padStart(2, '0')}<small>/${news.length}</small></span>
        <span class="src">${flag(it.country)}${esc(it.source)}</span>
        ${it.topic ? `<span class="topic">${esc(topicName(it.topic))}</span>` : ''}
        ${it.tone && it.tone !== 'neutral' ? `<span class="tone ${it.tone}">${t('tone.' + it.tone)}</span>` : ''}
        <span class="time">${ago(it.published)}</span></div>
      <h2>${esc(T_(it))}</h2>
      ${SUB_(it) ? `<p class="en">${esc(SUB_(it))}</p>` : ''}
      <ul>${S_(it).map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`;
    const p = $('#s-prog'); p.style.animation = 'none'; p.offsetHeight; p.style.animation = `bbp ${ROT}ms linear forwards`;
  }
  async function refresh() {
    const [n, a, brief] = await Promise.all([load('news'), load('articles'), load('brief', null)]);
    news = n.slice(0, 10);
    const s = quickStats([...n, ...a]);
    $('#s-mood').innerHTML = `<h4>${t('mood')} <small>${s.label}</small></h4>${toneMeter(s.tones, s.pool.length)}`;
    $('#s-who').innerHTML = `<h4>${t('who')}</h4>${countryBars(s.countries, 5)}`;
    const st = storiesOf(brief, [...n, ...a]).slice(0, 3);
    $('#s-stories').innerHTML = `<h4>${t('bigStories')}</h4>` + (st.length ? st.map((x) => `<div class="scr-story"><b>${x.items.length}</b><div><h5>${esc(x.title)}</h5><div class="flags">${[...new Set(x.items.map((i) => i.country).filter(Boolean))].map(flag).join('')}</div></div></div>`).join('') : `<span class="time">${t('storiesEmpty')}</span>`);
    const heads = n.slice(0, 20).map((i) => `<span>${flag(i.country)}<b>${esc(i.source)}</b> ${esc(T_(i))}</span>`).join('<i>◆</i>');
    $('#s-track').innerHTML = heads + '<i>◆</i>' + heads;
    $('#s-track').style.animationDuration = `${Math.max(40, n.slice(0, 20).length * 9)}s`;
    if (!timer) { showLead(); timer = setInterval(() => { idx++; showLead(); }, ROT); }
  }
  refresh(); setInterval(refresh, 60000);
})();
