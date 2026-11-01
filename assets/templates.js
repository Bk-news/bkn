// ================= قوالب الصور والفيديو (Canvas) =================
// drawTemplate(ctx, W, H, { tpl, item, brief, t, lang, host })
//   tpl: news | breaking | article | brief | intro | outro
//   t: تقدّم الحركة من 0 إلى 1 (1 = الصورة الثابتة)

const TPL_FONTS = ['800 60px "Noto Kufi Arabic"', '600 30px "IBM Plex Sans Arabic"', '400 30px "IBM Plex Sans Arabic"', '700 40px "Space Grotesk"'];
async function loadTemplateFonts() { try { await Promise.all(TPL_FONTS.map((f) => document.fonts.load(f))); } catch {} }

const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const seg = (t, a, b) => ease((t - a) / (b - a));   // حركة جزئية بين a و b

function tplWrap(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/), lines = []; let line = '';
  for (const w of words) { const s = line ? line + ' ' + w : w; if (ctx.measureText(s).width > maxW && line) { lines.push(line); line = w; } else line = s; }
  if (line) lines.push(line); return lines;
}
function fitLines(ctx, text, maxW, size, font, maxLines) {
  // يصغّر الخط لين يدخل العنوان في عدد الأسطر المسموح
  let s = size, lines;
  for (; s > size * 0.6; s -= 2) { ctx.font = font.replace('{s}', s); lines = tplWrap(ctx, text, maxW); if (lines.length <= maxLines) break; }
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] += '…'; }
  return { lines, size: s };
}

function drawTemplate(ctx, W, H, o) {
  const { tpl = 'news', item = {}, brief = {}, t = 1, lang = 'ar', host = location.host || 'BKN' } = o;
  const rtl = lang !== 'en', P = Math.round(W * 0.075), wide = W > H, u = W / 1080;
  const X0 = rtl ? W - P : P;                         // نقطة بداية النص
  const align = rtl ? 'right' : 'left';
  const title = lang === 'en' ? (item.title_en || item.title_orig || item.title_ar) : item.title_ar;
  const pts = (lang === 'en' ? item.summary_en : item.summary_ar) || [];
  const L = (ar, en) => (lang === 'en' ? en : ar);
  const toneName = { positive: L('إيجابي', 'Positive'), critical: L('ناقد', 'Critical') }[item.tone];
  const topic = lang === 'en' && typeof TOPIC_EN !== 'undefined' ? (TOPIC_EN[item.topic] || item.topic) : item.topic;
  const country = item.country ? (() => { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(item.country); } catch { return ''; } })() : '';
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';

  const text = (s, x, y, font, color, a = 1, al = align) => { ctx.globalAlpha = a; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = al; ctx.fillText(s, x, y); ctx.globalAlpha = 1; };
  const logo = (x, y, size, color = '#fff', dot = '#22c38e', al = rtl ? 'left' : 'right') => {
    ctx.save(); ctx.direction = 'ltr'; ctx.font = `700 ${size}px "Space Grotesk", sans-serif`; ctx.textAlign = 'left';
    const w = ctx.measureText('BKN').width, dw = ctx.measureText('.').width;
    const sx = al === 'left' ? x : x - w - dw;
    ctx.fillStyle = color; ctx.fillText('BKN', sx, y); ctx.fillStyle = dot; ctx.fillText('.', sx + w, y); ctx.restore();
  };
  const grid = (color) => { ctx.strokeStyle = color; ctx.lineWidth = 1; for (let x = 0; x < W; x += 60 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 60 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } };
  const pill = (label, x, y, h, bg, fg, font) => {
    ctx.font = font; const w = ctx.measureText(label).width + h * 0.9;
    const px = rtl ? x - w : x; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(px, y - h * 0.72, w, h, h / 2); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.fillText(label, px + w / 2, y); ctx.textAlign = align; return w;
  };
  const bullets = (list, y, color, dotColor, size, maxW, gap) => {
    ctx.font = `400 ${size}px "IBM Plex Sans Arabic"`;
    list.forEach((p, i) => {
      const a = seg(t, 0.45 + i * 0.12, 0.75 + i * 0.12);
      const lines = tplWrap(ctx, p, maxW - size * 1.2).slice(0, 2);
      ctx.globalAlpha = a; ctx.fillStyle = dotColor;
      ctx.fillRect(rtl ? X0 - size * 0.45 : X0, y + size * 0.15 - size * 0.55, size * 0.4, size * 0.4);
      lines.forEach((l) => { text(l, rtl ? X0 - size * 1.1 : X0 + size * 1.1, y + (1 - a) * 20, `400 ${size}px "IBM Plex Sans Arabic"`, color, a); y += size * 1.5; });
      y += gap;
    });
    ctx.globalAlpha = 1; return y;
  };
  const footer = (color, line, host_color) => {
    ctx.fillStyle = line; ctx.fillRect(P, H - P - 64 * u, W - 2 * P, 2 * u);
    text(L('السعودية في عيون الصحافة العالمية', 'Saudi Arabia in the world press'), X0, H - P, `600 ${28 * u}px "IBM Plex Sans Arabic"`, color);
    ctx.save(); ctx.direction = 'ltr'; text(host, rtl ? P : W - P, H - P, `600 ${26 * u}px "Space Grotesk", sans-serif`, host_color, 1, rtl ? 'left' : 'right'); ctx.restore();
  };

  // ======================= عاجل (أحمر) =======================
  if (tpl === 'breaking') {
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, '#d0102f'); g.addColorStop(1, '#6e0616');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#fff';            // خطوط مائلة
    for (let x = -H; x < W; x += 46 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 20 * u, 0); ctx.lineTo(x + 20 * u + H, H); ctx.lineTo(x + H, H); ctx.fill(); }
    ctx.restore();
    const flash = 0.5 + 0.5 * Math.sin(t * Math.PI * 6);
    logo(rtl ? P : W - P, P + 70 * u, 58 * u);
    const bh = 120 * u, labSize = (wide ? 70 : 104) * u, lh = labSize * 1.55;
    const { lines, size } = fitLines(ctx, title, W - 2 * P, (wide ? 64 : 92) * u, '800 {s}px "Noto Kufi Arabic"', wide ? 4 : 7);
    const blockH = lh + 40 * u + 50 * u + 30 * u + lines.length * size * 1.5;
    let y = Math.max(P + 200 * u, (H - bh - blockH) / 2 + lh * 0.74);
    // شارة عاجل كبيرة
    const a1 = seg(t, 0, 0.25);
    ctx.globalAlpha = a1;
    ctx.font = `800 ${labSize}px "Noto Kufi Arabic"`;
    const lab = L('عاجل', 'BREAKING'), lw = ctx.measureText(lab).width + 130 * u;
    const lx = rtl ? X0 - lw : X0;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(lx, y - lh * 0.74, lw, lh, 22 * u); ctx.fill();
    ctx.fillStyle = '#d0102f'; ctx.beginPath(); ctx.arc(rtl ? lx + lw - 46 * u : lx + 46 * u, y - lh * 0.26, 14 * u, 0, 7); ctx.globalAlpha = a1 * (0.4 + 0.6 * flash); ctx.fill(); ctx.globalAlpha = a1;
    text(lab, rtl ? X0 - 80 * u : X0 + 80 * u, y, `800 ${labSize}px "Noto Kufi Arabic"`, '#c8102e', a1);
    ctx.globalAlpha = 1;
    y += 40 * u + 50 * u;
    text([item.source, country].filter(Boolean).join(' · '), X0, y, `600 ${36 * u}px "IBM Plex Sans Arabic"`, 'rgba(255,255,255,.85)', seg(t, 0.1, 0.35));
    y += 30 * u;
    lines.forEach((l, i) => { const a = seg(t, 0.15 + i * 0.06, 0.45 + i * 0.06); y += size * 1.5; text(l, X0, y + (1 - a) * 40 * u, `800 ${size}px "Noto Kufi Arabic"`, '#fff', a); });
    // شريط أبيض سفلي
    ctx.fillStyle = '#fff'; ctx.fillRect(0, H - bh, W, bh);
    logo(rtl ? P : W - P, H - bh / 2 + 18 * u, 46 * u, '#0b1426', '#d0102f');
    text(L('تابع العاجل لحظة بلحظة', 'Follow breaking news live'), X0, H - bh / 2 + 12 * u, `700 ${30 * u}px "IBM Plex Sans Arabic"`, '#c8102e');
    ctx.restore(); return;
  }

  // ======================= مقال رأي (فاتح) =======================
  if (tpl === 'article') {
    ctx.fillStyle = '#f3eee4'; ctx.fillRect(0, 0, W, H);
    grid('rgba(0,0,0,.035)');
    let y = P + 60 * u;
    logo(rtl ? P : W - P, y, 56 * u, '#0b1426', '#0b9466');
    text(L('مقال رأي', 'OPINION'), X0, y, `700 ${30 * u}px "IBM Plex Sans Arabic"`, '#0b9466');
    ctx.globalAlpha = 0.12 * seg(t, 0, 0.3); ctx.fillStyle = '#0b9466'; ctx.font = `700 ${520 * u}px Georgia, serif`; ctx.textAlign = rtl ? 'right' : 'left';
    ctx.fillText(rtl ? '”' : '“', rtl ? W - P * 0.4 : P * 0.4, H * (wide ? 0.75 : 0.5)); ctx.globalAlpha = 1; ctx.textAlign = align;
    const { lines, size } = fitLines(ctx, title, W - 2 * P, (wide ? 60 : 76) * u, '800 {s}px "Noto Kufi Arabic"', wide ? 4 : 6);
    y = H * (wide ? 0.3 : 0.36);
    lines.forEach((l, i) => { const a = seg(t, 0.1 + i * 0.06, 0.4 + i * 0.06); y += size * 1.5; text(l, X0, y + (1 - a) * 30 * u, `800 ${size}px "Noto Kufi Arabic"`, '#0b1426', a); });
    y += 40 * u; ctx.fillStyle = '#0b9466'; ctx.fillRect(rtl ? X0 - 140 * u : X0, y, 140 * u, 6 * u); y += 70 * u;
    text([item.author, item.source].filter(Boolean).join(' — '), X0, y, `700 ${36 * u}px "IBM Plex Sans Arabic"`, '#0b1426', seg(t, 0.4, 0.6));
    if (!wide && pts.length) bullets(pts.slice(0, 2), y + 80 * u, '#38445c', '#0b9466', 34 * u, W - 2 * P, 14 * u);
    footer('#5b6780', 'rgba(0,0,0,.1)', '#0b9466');
    ctx.restore(); return;
  }

  // ======================= الخلفية الداكنة (خبر/موجز/مقدمة/ختام) =======================
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b1730'); g.addColorStop(1, '#050a15');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(rtl ? W : 0, 0, 0, rtl ? W : 0, 0, W * 1.1); rg.addColorStop(0, 'rgba(34,195,142,.35)'); rg.addColorStop(1, 'rgba(34,195,142,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  const rg2 = ctx.createRadialGradient(rtl ? 0 : W, H, 0, rtl ? 0 : W, H, W); rg2.addColorStop(0, 'rgba(91,140,255,.22)'); rg2.addColorStop(1, 'rgba(91,140,255,0)');
  ctx.fillStyle = rg2; ctx.fillRect(0, 0, W, H);
  grid('rgba(255,255,255,.04)');

  if (tpl === 'intro' || tpl === 'outro') {
    const cx = W / 2, cy = H * 0.42, R = Math.min(W, H) * 0.28 * seg(t, 0, 0.4);
    ctx.strokeStyle = 'rgba(34,195,142,.35)'; ctx.lineWidth = 3 * u;
    [1, 0.66, 0.33].forEach((k) => { ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, 7); ctx.stroke(); });
    const ang = t * Math.PI * 4 - Math.PI / 2;
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(34,195,142,${0.5 * (1 - i / 40)})`; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, ang - (i + 1) * 0.02, ang - i * 0.02); ctx.fill(); }
    // الشعار في المنتصف
    ctx.save(); ctx.globalAlpha = seg(t, 0.2, 0.5); ctx.direction = 'ltr'; ctx.textAlign = 'left';
    ctx.font = `700 ${190 * u}px "Space Grotesk", sans-serif`;
    const lw0 = ctx.measureText('BKN').width, dw0 = ctx.measureText('.').width, sx0 = cx - (lw0 + dw0) / 2;
    ctx.fillStyle = '#fff'; ctx.fillText('BKN', sx0, cy + 65 * u); ctx.fillStyle = '#22c38e'; ctx.fillText('.', sx0 + lw0, cy + 65 * u);
    ctx.restore();
    ctx.textAlign = 'center';
    const l1 = tpl === 'intro' ? L('أهم أخبار السعودية', 'Top Saudi stories') : L('تابعنا لحظة بلحظة', 'Follow us, live');
    const l2 = tpl === 'intro' ? L('في الصحافة العالمية', 'in the world press') : host;
    text(l1, cx, H * 0.7, `800 ${(wide ? 60 : 70) * u}px "Noto Kufi Arabic"`, '#fff', seg(t, 0.35, 0.6), 'center');
    text(l2, cx, H * 0.7 + 90 * u, `600 ${40 * u}px "IBM Plex Sans Arabic"`, '#22c38e', seg(t, 0.45, 0.7), 'center');
    if (tpl === 'intro') {
      const d = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
      text(d, cx, H * 0.7 + 160 * u, `400 ${32 * u}px "IBM Plex Sans Arabic"`, '#8693ad', seg(t, 0.55, 0.8), 'center');
    }
    ctx.restore(); return;
  }

  let y = P + 60 * u;
  logo(rtl ? P : W - P, y, 60 * u);

  if (tpl === 'brief') {
    text(L('موجز BKN', 'BKN BRIEF'), X0, y, `700 ${32 * u}px "IBM Plex Sans Arabic"`, '#22c38e');
    const d = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ar', { day: 'numeric', month: 'long' }).format(new Date(brief.updated || Date.now()));
    text(d, X0, y + 46 * u, `400 ${28 * u}px "IBM Plex Sans Arabic"`, '#8693ad');
    const { lines, size } = fitLines(ctx, brief.headline || '', W - 2 * P, (wide ? 54 : 68) * u, '800 {s}px "Noto Kufi Arabic"', wide ? 2 : 4);
    y += (wide ? 110 : 190) * u;
    lines.forEach((l, i) => { const a = seg(t, 0.1 + i * 0.06, 0.35 + i * 0.06); y += size * 1.5; text(l, X0, y, `800 ${size}px "Noto Kufi Arabic"`, '#fff', a); });
    y += 50 * u;
    const ps = (brief.points || []).slice(0, wide ? 3 : 5), fs = (wide ? 30 : 36) * u;
    ps.forEach((p, i) => {
      const a = seg(t, 0.35 + i * 0.1, 0.6 + i * 0.1); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(34,195,142,.15)'; const bx = rtl ? X0 - 56 * u : X0; ctx.beginPath(); ctx.roundRect(bx, y - 4 * u, 56 * u, 56 * u, 14 * u); ctx.fill();
      text(String(i + 1), bx + 28 * u, y + 38 * u, `700 ${30 * u}px "Space Grotesk"`, '#22c38e', a, 'center');
      const lines2 = (ctx.font = `400 ${fs}px "IBM Plex Sans Arabic"`, tplWrap(ctx, p, W - 2 * P - 90 * u).slice(0, 2));
      lines2.forEach((l, k) => text(l, rtl ? X0 - 84 * u : X0 + 84 * u, y + 38 * u + k * fs * 1.45, `400 ${fs}px "IBM Plex Sans Arabic"`, '#d2d9e6', a));
      y += Math.max(80 * u, lines2.length * fs * 1.45 + 30 * u);
    });
    ctx.globalAlpha = 1;
    footer('#8693ad', 'rgba(255,255,255,.08)', '#22c38e');
    ctx.restore(); return;
  }

  // ======================= خبر =======================
  text([item.source, country].filter(Boolean).join(' · '), X0, y, `600 ${30 * u}px "IBM Plex Sans Arabic"`, '#8693ad', seg(t, 0, 0.3));
  const { lines, size } = fitLines(ctx, title, W - 2 * P, (wide ? 58 : W / H < 0.6 ? 78 : 68) * u, '800 {s}px "Noto Kufi Arabic"', wide ? 4 : 6);
  const ptsShow = pts.slice(0, wide ? 2 : 3);
  const blockH = 70 * u + lines.length * size * 1.5 + (ptsShow.length ? 60 * u + ptsShow.length * (wide ? 80 : 95) * u : 0);
  y = Math.max(P + 150 * u, (H - blockH) / 2);
  let tx = X0; const ph = 50 * u;
  for (const [lab, bg, fg] of [[topic, 'rgba(91,140,255,.2)', '#8fb0ff'], [toneName, item.tone === 'critical' ? 'rgba(246,167,35,.18)' : 'rgba(34,195,142,.18)', item.tone === 'critical' ? '#f6a723' : '#22c38e']]) {
    if (!lab) continue; ctx.globalAlpha = seg(t, 0.05, 0.3);
    const w = pill(lab, tx, y, ph, bg, fg, `600 ${26 * u}px "IBM Plex Sans Arabic"`); tx += rtl ? -(w + 14 * u) : w + 14 * u;
  }
  ctx.globalAlpha = 1;
  y += 40 * u;
  lines.forEach((l, i) => { const a = seg(t, 0.12 + i * 0.06, 0.42 + i * 0.06); y += size * 1.5; text(l, X0, y + (1 - a) * 40 * u, `800 ${size}px "Noto Kufi Arabic"`, '#fff', a); });
  if (ptsShow.length) {
    y += 34 * u; ctx.globalAlpha = seg(t, 0.4, 0.55); ctx.fillStyle = '#22c38e'; ctx.fillRect(rtl ? X0 - 120 * u * seg(t, 0.4, 0.6) : X0, y, 120 * u * seg(t, 0.4, 0.6), 5 * u); ctx.globalAlpha = 1;
    y += 70 * u;
    bullets(ptsShow, y, '#d2d9e6', '#22c38e', (wide ? 30 : 34) * u, W - 2 * P, 16 * u);
  }
  footer('#8693ad', 'rgba(255,255,255,.08)', '#22c38e');
  ctx.restore();
}
