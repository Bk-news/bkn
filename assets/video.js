// ================= منتج الفيديو ٩:١٦ =================
(() => {
  const L = (ar, en) => (EN ? en : ar);
  const W = 1080, H = 1920, FPS = 30, INTRO = 2.6, OUTRO = 2.6;
  pageHead('video');
  $('#list-root').innerHTML = `
  <div class="video-ui">
    <div class="panel vctl">
      <label>${L('المحتوى', 'Content')}<select id="v-src">
        <option value="top">${L('أهم الأخبار', 'Top news')}</option>
        <option value="brief">${L('الموجز + أهم الأخبار', 'Brief + top news')}</option>
        <option value="breaking">${L('العاجل الحالي', 'Current breaking')}</option>
        <option value="mbs">${L('أخبار ولي العهد', 'Crown Prince news')}</option></select></label>
      <label>${L('عدد الأخبار', 'Number of stories')}<select id="v-n"><option>5</option><option selected>8</option><option>10</option></select></label>
      <label>${L('ثواني لكل خبر', 'Seconds per story')}<select id="v-s"><option>3</option><option selected>4</option><option>5</option><option>6</option></select></label>
      <label>${L('شكل الأخبار', 'Story style')}<select id="v-tpl">
        <option value="auto">${L('تلقائي (العاجل بالأحمر)', 'Auto (breaking in red)')}</option>
        <option value="news">${L('خبر (داكن)', 'News (dark)')}</option><option value="breaking">${L('عاجل (أحمر) للكل', 'Breaking (red) for all')}</option></select></label>
      <label>${L('اللغة', 'Language')}<select id="v-lang"><option value="ar" ${EN ? '' : 'selected'}>العربية</option><option value="en" ${EN ? 'selected' : ''}>English</option></select></label>
      <div class="btns"><button class="btn" id="v-preview">▶ ${L('معاينة', 'Preview')}</button><button class="btn primary" id="v-make">🎬 ${L('أنشئ الفيديو', 'Create video')}</button></div>
      <div class="vprog" hidden><div><i id="v-bar"></i></div><span id="v-status"></span></div>
      <p class="time" id="v-info"></p>
      <div id="v-out"></div>
      <p class="time">${L('خلّ هذي الصفحة مفتوحة وظاهرة أثناء الإنشاء. الفيديو بدون صوت، وتقدر تضيف موسيقى من سناب أو انستقرام أو كاب كت.', 'Keep this tab open and visible while recording. The video is silent — add music in Snap, Instagram or CapCut.')}</p>
    </div>
    <div class="vstage"><canvas id="v-canvas" width="${W}" height="${H}"></canvas></div>
  </div>`;
  const cv = $('#v-canvas'), ctx = cv.getContext('2d');
  let slides = [], total = 0, playing = false;

  async function build() {
    const src = $('#v-src').value, n = +$('#v-n').value, sec = +$('#v-s').value, style = $('#v-tpl').value;
    const [news, brk, brief, arts] = await Promise.all([load('news'), load('breaking'), load('brief', null), load('articles')]);
    const liveB = live(brk), bIds = new Set(liveB.map((b) => b.id));
    let items = src === 'breaking' ? liveB : src === 'mbs' ? [...news, ...arts].filter((i) => i.subject === 'mbs').sort(byNewest) : news;
    items = items.slice(0, n);
    const tplOf = (it) => (style !== 'auto' ? style : src === 'breaking' || bIds.has(it.id) ? 'breaking' : 'news');
    slides = [{ tpl: 'intro', dur: INTRO }];
    if (src === 'brief' && brief?.headline) slides.push({ tpl: 'brief', brief, dur: Math.max(6, sec + 2) });
    items.forEach((it) => slides.push({ tpl: tplOf(it), item: it, dur: sec, content: true }));
    slides.push({ tpl: 'outro', dur: OUTRO });
    total = slides.reduce((s, x) => s + x.dur, 0);
    $('#v-info').textContent = items.length ? L(`${items.length} خبر · مدة الفيديو ${Math.round(total)} ثانية`, `${items.length} stories · ${Math.round(total)} seconds`) : L('ما فيه أخبار كافية لهذا الاختيار.', 'Not enough stories for this choice.');
    return items.length > 0;
  }

  function frame(T) {
    const lang = $('#v-lang').value;
    let acc = 0, i = 0;
    while (i < slides.length - 1 && T >= acc + slides[i].dur) { acc += slides[i].dur; i++; }
    const s = slides[i], local = T - acc;
    drawTemplate(ctx, W, H, { tpl: s.tpl, item: s.item || {}, brief: s.brief || {}, t: Math.min(1, local / 1.5), lang });
    // تلاشي بين الشرائح
    if (local < 0.25) { ctx.fillStyle = `rgba(5,10,21,${1 - local / 0.25})`; ctx.fillRect(0, 0, W, H); }
    // أشرطة التقدّم مثل الستوري
    const content = slides.filter((x) => x.content);
    if (s.content && content.length > 1) {
      const k = content.indexOf(s), gap = 8, pad = 40, bw = (W - pad * 2 - gap * (content.length - 1)) / content.length;
      content.forEach((_, j) => {
        const x = lang === 'en' ? pad + j * (bw + gap) : W - pad - (j + 1) * bw - j * gap;
        ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x, 26, bw, 6);
        const f = j < k ? 1 : j === k ? Math.min(1, local / s.dur) : 0;
        ctx.fillStyle = '#fff'; ctx.fillRect(lang === 'en' ? x : x + bw * (1 - f), 26, bw * f, 6);
      });
    }
  }

  async function run(record) {
    if (playing) return; playing = true;
    await loadTemplateFonts();
    if (!(await build())) { playing = false; return; }
    let rec, chunks = [], mime = '';
    if (record) {
      mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';
      if (!mime) { alert(L('متصفحك ما يدعم تسجيل الفيديو. جرّب كروم أو إيدج.', 'Your browser cannot record video. Try Chrome or Edge.')); playing = false; return; }
      rec = new MediaRecorder(cv.captureStream(FPS), { mimeType: mime, videoBitsPerSecond: 8e6 });
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start(250);
      $('.vprog').hidden = false; $('#v-out').innerHTML = '';
    }
    const t0 = performance.now();
    await new Promise((done) => {
      const step = () => {
        const T = (performance.now() - t0) / 1000;
        frame(Math.min(T, total - 0.001));
        if (record) { $('#v-bar').style.width = `${Math.min(100, (T / total) * 100)}%`; $('#v-status').textContent = `${Math.min(100, Math.round((T / total) * 100))}%`; }
        if (T < total) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
    if (record) {
      await new Promise((r) => { rec.onstop = r; rec.stop(); });
      const blob = new Blob(chunks, { type: mime.split(';')[0] });
      const url = URL.createObjectURL(blob), ext = mime.includes('mp4') ? 'mp4' : 'webm';
      $('#v-status').textContent = L('جاهز ✓', 'Ready ✓');
      $('#v-out').innerHTML = `<video src="${url}" controls playsinline></video>
        <a class="btn primary" download="BKN-${new Date().toISOString().slice(0, 10)}.${ext}" href="${url}">⬇ ${L('تحميل الفيديو', 'Download video')} (.${ext})</a>
        ${ext === 'webm' ? `<p class="time">${L('ملاحظة: متصفحك صدّر بصيغة WebM. لرفعه على سناب وانستقرام حوّله لـ MP4، أو استخدم كروم/إيدج الحديث.', 'Note: your browser exported WebM. Convert to MP4 for Snap/Instagram, or use a recent Chrome/Edge.')}</p>` : ''}`;
    }
    playing = false;
  }
  $('#v-preview').onclick = () => run(false);
  $('#v-make').onclick = () => run(true);
  ['#v-src', '#v-n', '#v-s', '#v-tpl', '#v-lang'].forEach((s) => { $(s).onchange = async () => { await build(); frame(INTRO + 1.6); }; });
  loadTemplateFonts().then(build).then(() => frame(INTRO + 1.6));
})();
