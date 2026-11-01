// يجمع الأخبار والمقالات، يترجمها ويلخصها، ويحدّث ملفات data/
// تشغيل مرة وحدة:      node scripts/fetch.mjs
// تشغيل مستمر (سيرفر):  node scripts/fetch.mjs --watch

import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { FEEDS, TELEGRAM_BREAKING, X_ACCOUNTS, OPINION_HINTS, RELEVANCE, MBS, BREAKING_WORDS, ROUTINE_WORDS } from './sources.mjs';

const DATA = new URL('../data/', import.meta.url);
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const X_TOKEN = process.env.X_BEARER_TOKEN;
const MAX_NEW = Number(process.env.MAX_NEW_PER_RUN || (process.env.ANTHROPIC_API_KEY ? 40 : 200));
const WATCH_SECONDS = Number(process.env.WATCH_SECONDS || 20);
const BREAKING_TTL = 60 * 60 * 1000;       // العاجل يجلس ساعة
const MAX_AGE = 3 * 24 * 60 * 60 * 1000;   // نتجاهل أي شي أقدم من ٣ أيام
const LIMITS = { news: 500, articles: 300, seen: 5000, statsDays: 120 };
const BRIEF_HOURS = Number(process.env.BRIEF_HOURS || 3);   // تحديث الموجز كل ٣ ساعات
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN, TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

// تشخيص: يُحفظ في data/status.json بعد كل تشغيل
const STATUS = { run: new Date().toISOString(), key: !!process.env.ANTHROPIC_API_KEY, model: MODEL, feedsOk: 0, feedsFailed: [], fetched: 0, fresh: 0, world: 0, analyzed: 0, analyzeErrors: 0, lastError: '' };
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const clean = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
// قراءة وسم من XML (يدعم CDATA والنص المرمّز)
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`));
  if (!m) return '';
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
const byDate = (k) => (a, b) => (b[k] || '').localeCompare(a[k] || '');

async function readJSON(name, fallback = []) {
  try { return JSON.parse(await fs.readFile(new URL(name, DATA), 'utf8')); } catch { return fallback; }
}
const writeJSON = (name, data) => fs.writeFile(new URL(name, DATA), JSON.stringify(data, null, 1) + '\n');
const dayOf = (iso) => new Date(iso).toISOString().slice(0, 10);
const subjectOf = (text) => (MBS.test(text) ? 'mbs' : 'saudi');

// ---------- RSS ----------
async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { 'user-agent': 'Mozilla/5.0 (SaudiMonitor RSS reader)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) ?? [];

  return blocks.map((b) => {
    const link = tag(b, 'link') || (b.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? '');
    const source = clean(tag(b, 'source')) || feed.source || feed.name;
    let title = clean(tag(b, 'title'));
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const date = new Date(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || Date.now());
    return {
      title, url: clean(link), source, feed: feed.name, lang: feed.lang, country: feed.country || '', feedKind: feed.kind,
      author: clean(tag(b, 'dc:creator') || tag(tag(b, 'author'), 'name')),
      description: clean(tag(b, 'description') || tag(b, 'summary')).slice(0, 700),
      published: isNaN(date) ? new Date().toISOString() : date.toISOString(),
    };
  }).filter((i) => i.title && i.url);
}

// ---------- الترجمة والتلخيص ----------
function heuristic(it) {
  const isOpinion = it.feedKind === 'article' || OPINION_HINTS.some((r) => r.test(it.url));
  return {
    // مصادر الصحافة العالمية مبحوث فيها أصلًا عن السعودية، فنقبلها. ومصادر العاجل المحلية لازم تذكر السعودية صراحة
    relevant: it.feedKind !== 'breaking' || RELEVANCE.test(`${it.title} ${it.description}`),
    kind: isOpinion ? 'article' : 'news',
    title_ar: it.title,
    summary_ar: [],
    breaking: isBreakingTitle(it.title),
    tone: 'neutral', topic: '', country: '',
    subject: subjectOf(`${it.title} ${it.description}`),
    title_en: it.lang === 'en' ? it.title : '', summary_en: [],
  };
}

async function claudeJSON(prompt, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) { if (res.status === 401 || res.status === 403) KEY_BAD = true; throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`); }
  const out = (await res.json()).content?.[0]?.text ?? '';
  return JSON.parse(out.match(/\{[\s\S]*\}/)[0]);
}

// ترجمة مجانية للعناوين (تُستخدم لما يكون مفتاح الذكاء الاصطناعي غير متوفر أو مرفوض)
const mtCache = new Map();
async function translateFree(text, to = 'ar') {
  if (!text) return '';
  const k = to + '|' + text; if (mtCache.has(k)) return mtCache.get(k);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text.slice(0, 500))}`;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`translate ${res.status}`);
  const out = (await res.json())?.[0]?.map((x) => x?.[0] || '').join('').trim();
  if (!out) throw new Error('translate empty');
  mtCache.set(k, out); return out;
}
// ترجمة دفعة عناوين بطلب واحد (كل عنوان في سطر)
async function translateBatch(texts, to = 'ar') {
  const out = [];
  for (let i = 0; i < texts.length;) {
    const chunk = []; let len = 0;
    while (i < texts.length && chunk.length < 25 && len + texts[i].length < 4000) { chunk.push(texts[i].replace(/\s+/g, ' ')); len += texts[i].length + 1; i++; }
    if (!chunk.length) { out.push(''); i++; continue; }
    const res = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + to + '&dt=t', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': 'Mozilla/5.0' },
      body: 'q=' + encodeURIComponent(chunk.join('\n')), signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`translate ${res.status}`);
    const lines = ((await res.json())?.[0] || []).map((x) => x?.[0] || '').join('').split('\n').map((x) => x.trim());
    if (lines.length !== chunk.length) throw new Error(`translate lines ${lines.length}/${chunk.length}`);
    out.push(...lines);
    if (i < texts.length) await new Promise((r) => setTimeout(r, 1200));
  }
  return out;
}
async function withFreeTitle(it, a) {
  if (it.lang === 'ar' || (a.title_ar && a.title_ar !== it.title)) return a;
  try {
    a.title_ar = await translateFree(it.title, 'ar');
    if (it.lang !== 'en' && !a.title_en) a.title_en = await translateFree(it.title, 'en').catch(() => '');
    a.mt = true; STATUS.mt = (STATUS.mt || 0) + 1;
  } catch (e) { STATUS.mtErrors = (STATUS.mtErrors || 0) + 1; STATUS.mtLastError = e.message; }
  return a;
}

// بدون ذكاء اصطناعي: العاجل فقط للكلمات الصريحة، ونستبعد الأخبار البروتوكولية والروتينية
const isBreakingTitle = (t) => BREAKING_WORDS.test(t) && !ROUTINE_WORDS.test(t);

let KEY_BAD = false;   // إذا رفض المفتاح (401) نعرض الأخبار بدون ترجمة ونترجمها لاحقًا
async function analyze(it) {
  if (KEY_BAD) return { ...heuristic(it), pending: true };
  const prompt = `أنت محرر في موقع عربي يرصد ما تنشره الصحافة العالمية عن السعودية وولي العهد.
هذي بيانات مادة صحفية (العنوان والمقتطف فقط):
المصدر: ${it.source}
الرابط: ${it.url}
العنوان: ${it.title}
المقتطف: ${it.description || '—'}

رجّع JSON فقط بهذا الشكل بدون أي كلام ثاني:
{"relevant": true/false, "kind": "news" أو "article", "title_ar": "...", "summary_ar": ["...", "..."], "title_en": "...", "summary_en": ["...", "..."], "breaking": true/false, "tone": "positive" أو "neutral" أو "critical", "topic": "...", "country": "XX", "subject": "saudi" أو "mbs"}

القواعد:
- relevant: true إذا المادة تخص السعودية أو قيادتها أو اقتصادها أو سياستها بشكل مباشر.
- kind: "article" لمقالات الرأي والتحليل والأعمدة، و"news" للأخبار.
- title_ar: ترجمة عربية دقيقة للعنوان بلغة صحفية.
- summary_ar: من 2 إلى 4 نقاط قصيرة بصياغتك أنت، مبنية فقط على المعلومات أعلاه بدون إضافة أو تخمين، وبدون نسخ جمل المصدر.
- title_en و summary_en: نفس العنوان والنقاط بالإنجليزية (إذا العنوان الأصلي إنجليزي انقله كما هو).
- subject: "mbs" إذا المادة تتمحور حول ولي العهد الأمير محمد بن سلمان شخصيًا (تصريحاته، زياراته، قراراته، لقاءاته)، وإلا "saudi".
- breaking: true فقط لخبر عاجل فعلًا يستاهل تنبيه فوري: أمر ملكي أو قرار حكومي كبير، وفاة شخصية رسمية، هجوم أو حادث أمني، إعلان رسمي مهم لأول مرة، أو صفقة/حدث استثنائي.
  وfalse لكل الأخبار الروتينية مثل: التهاني والتعازي والبرقيات، الاستقبالات واللقاءات والزيارات المعتادة، الإحصاءات والتقارير الدورية، المشاريع المحلية والصيانة، الطقس، الفعاليات والمعارض، المقالات والتحليلات. وإذا شكّيت خلها false.
- tone: نبرة المادة تجاه السعودية كما تظهر في العنوان والمقتطف: positive أو neutral أو critical.
- topic: واحد فقط من: سياسة، اقتصاد، طاقة، أمن ودفاع، رياضة، سياحة وترفيه، تقنية، مجتمع وثقافة.
- country: رمز الدولة (حرفين ISO مثل US أو GB) للبلد اللي تصدر منه الوسيلة الإعلامية.
- انقل المحتوى بحياد كما هو، سواء كان إيجابيًا أو ناقدًا.`;

  const json = await claudeJSON(prompt, 700);
  json.summary_ar = Array.isArray(json.summary_ar) ? json.summary_ar.slice(0, 4) : [];
  json.summary_en = Array.isArray(json.summary_en) ? json.summary_en.slice(0, 4) : [];
  return json;
}

// ---------- عاجل من قنوات تلقرام العامة (t.me/s/<channel>) ----------
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
async function fetchTelegramChannel(ch) {
  const res = await fetch(`https://t.me/s/${ch.channel}`, { headers: { 'user-agent': 'Mozilla/5.0', 'accept-language': 'ar' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const out = [];
  for (const part of html.split('data-post="').slice(1)) {
    const post = part.slice(0, part.indexOf('"'));
    const m = part.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const d = part.match(/<time[^>]*datetime="([^"]+)"/);
    if (!m || !d) continue;
    const text = decode(m[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/#\S+/g, '').replace(/\s+/g, ' ').trim();
    if (text.length < 8) continue;
    out.push({ id: hash(`tg:${post}`), origin: 'telegram', source: ch.name, country: ch.country || '', title_ar: text, summary_ar: [],
      url: `https://t.me/${post}`, published: new Date(d[1]).toISOString(), subject: subjectOf(text) });
  }
  return out;
}
async function fetchTelegramBreaking() {
  const all = [];
  for (const ch of TELEGRAM_BREAKING) {
    try { const items = await fetchTelegramChannel(ch); all.push(...items); STATUS.telegram = (STATUS.telegram || 0) + items.length; }
    catch (e) { console.warn(`تلقرام ${ch.channel}: ${e.message}`); STATUS.feedsFailed.push(`تلقرام ${ch.channel}: ${e.message}`); }
  }
  return all;
}

// ---------- حسابات X ----------
const xIds = new Map();
async function fetchX() {
  if (!X_TOKEN) return [];
  const headers = { authorization: `Bearer ${X_TOKEN}` };
  const out = [];
  for (const acc of X_ACCOUNTS) {
    try {
      if (!xIds.has(acc.username)) {
        const u = await (await fetch(`https://api.x.com/2/users/by/username/${acc.username}`, { headers })).json();
        if (!u.data?.id) { console.warn(`X: ما لقيت الحساب @${acc.username}`); continue; }
        xIds.set(acc.username, u.data.id);
      }
      const t = await (await fetch(
        `https://api.x.com/2/users/${xIds.get(acc.username)}/tweets?max_results=5&exclude=replies,retweets&tweet.fields=created_at`,
        { headers })).json();
      for (const tw of t.data ?? []) {
        out.push({
          id: hash(`x:${tw.id}`), origin: 'x', source: acc.name, country: 'SA',
          title_ar: tw.text.replace(/https:\/\/t\.co\/\S+/g, '').trim(),
          summary_ar: [], url: `https://x.com/${acc.username}/status/${tw.id}`, subject: subjectOf(tw.text),
          published: tw.created_at,
        });
      }
    } catch (e) { console.warn(`X @${acc.username}: ${e.message}`); }
  }
  return out;
}

// ---------- الإحصاءات اليومية (تُحفظ ١٢٠ يوم) ----------
function countIn(stats, rec, kind) {
  const day = rec.published.slice(0, 10);
  const d = (stats.days[day] ||= { total: 0, news: 0, articles: 0, positive: 0, neutral: 0, critical: 0, mbs: 0, countries: {}, topics: {}, sources: {}, sourceTone: {} });
  d.total++; d[kind]++; d[rec.tone || 'neutral']++;
  if (rec.subject === 'mbs') d.mbs = (d.mbs || 0) + 1;
  const st = ((d.sourceTone ||= {})[rec.source] ||= [0, 0, 0]);
  st[['positive', 'neutral', 'critical'].indexOf(rec.tone || 'neutral')]++;
  if (rec.country) d.countries[rec.country] = (d.countries[rec.country] || 0) + 1;
  if (rec.topic) d.topics[rec.topic] = (d.topics[rec.topic] || 0) + 1;
  d.sources[rec.source] = (d.sources[rec.source] || 0) + 1;
}

// ---------- موجز BKN والقصص الكبرى ----------
async function makeBrief(news, articles, old) {
  if (!KEY || KEY_BAD) return null;
  if (old?.updated && Date.now() - new Date(old.updated) < BRIEF_HOURS * 3600e3 && !process.env.FORCE_BRIEF) return null;
  const day = [...news, ...articles].filter((i) => Date.now() - new Date(i.published) < 864e5).slice(0, 90);
  if (day.length < 3) return null;
  const list = day.map((i) => `${i.id} | ${i.source} | ${i.title_ar}`).join('\n');
  const b = await claudeJSON(`أنت رئيس تحرير موقع BKN اللي يرصد ما تكتبه الصحافة العالمية عن السعودية.
هذي عناوين آخر ٢٤ ساعة (المعرّف | المصدر | العنوان):
${list}

رجّع JSON فقط بهذا الشكل:
{"headline": "عنوان واحد يلخص يوم السعودية في الصحافة العالمية",
 "points": ["٤ إلى ٦ نقاط تلخص أهم ما كُتب، كل نقطة جملة واحدة"],
 "mood": "جملة واحدة تصف نبرة التغطية العالمية اليوم بحياد",
 "headline_en": "...", "points_en": ["..."], "mood_en": "...",
 "stories": [{"title": "عنوان القصة", "summary": "جملتين عن القصة وكيف تناولتها الصحف", "title_en": "...", "summary_en": "...", "ids": ["المعرّفات اللي تخص نفس القصة"]}]}

القواعد:
- stories: من ٣ إلى ٦ قصص، كل قصة تجمع العناوين اللي تتكلم عن نفس الحدث أو الموضوع، ورتبها من الأكثر تغطية.
- الحقول المنتهية بـ _en هي نفس المحتوى بالإنجليزية.
- استخدم المعرّفات كما هي بالضبط.
- اعتمد فقط على العناوين أعلاه، وكن محايدًا.`, 2500);
  const ids = new Set(day.map((i) => i.id));
  const stories = (b.stories || []).map((st) => ({ id: hash(`story:${st.title}`), ...st, ids: (st.ids || []).filter((x) => ids.has(x)) })).filter((st) => st.ids.length);
  return { updated: new Date().toISOString(), headline: b.headline || '', points: (b.points || []).slice(0, 6), mood: b.mood || '',
    headline_en: b.headline_en || '', points_en: (b.points_en || []).slice(0, 6), mood_en: b.mood_en || '', stories: stories.slice(0, 6) };
}

// ---------- الأرشيف اليومي ----------
async function archive(recs, brief) {
  await fs.mkdir(new URL('archive/', DATA), { recursive: true });
  const index = await readJSON('archive/index.json', {});
  const byDay = {};
  for (const r of recs) (byDay[dayOf(r.published)] ||= []).push(r);
  if (brief) byDay[dayOf(brief.updated)] ||= [];
  for (const [day, list] of Object.entries(byDay)) {
    const file = `archive/${day}.json`;
    const cur = await readJSON(file, { day, items: [], brief: null });
    const have = new Set(cur.items.map((i) => i.id));
    cur.items = [...list.filter((i) => !have.has(i.id)), ...cur.items].sort(byDate('published'));
    if (brief && dayOf(brief.updated) === day) cur.brief = brief;
    index[day] = cur.items.length;
    await writeJSON(file, cur);
  }
  await writeJSON('archive/index.json', Object.fromEntries(Object.entries(index).sort()));
}

// ---------- التقرير الأسبوعي ----------
async function weeklyReport(stats) {
  if (!KEY || KEY_BAD) return null;
  await fs.mkdir(new URL('weekly/', DATA), { recursive: true });
  const index = await readJSON('weekly/index.json', []);
  if (index[0] && Date.now() - new Date(index[0].date + 'T00:00:00Z') < 7 * 864e5 && !process.env.FORCE_WEEKLY) return null;
  const days = [...Array(7)].map((_, i) => dayOf(new Date(Date.now() - (6 - i) * 864e5).toISOString()));
  const ds = days.map((d) => [d, stats.days[d]]).filter(([, v]) => v);
  if (ds.length < 3) return null;

  const sum = (k) => ds.reduce((s, [, v]) => s + (v[k] || 0), 0);
  const top = (k) => Object.entries(ds.reduce((m, [, v]) => { for (const [a, n] of Object.entries(v[k] || {})) m[a] = (m[a] || 0) + n; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const numbers = {
    total: sum('total'), positive: sum('positive'), neutral: sum('neutral'), critical: sum('critical'), mbs: sum('mbs'),
    countries: top('countries'), sources: top('sources'), topics: top('topics'),
    daily: days.map((d) => [d, stats.days[d]?.total || 0]),
  };
  const titles = [];
  for (const d of days) { const a = await readJSON(`archive/${d}.json`, { items: [] }); titles.push(...a.items.map((i) => `${d} | ${i.source} | ${i.title_ar}`)); }
  const r = await claudeJSON(`أنت رئيس تحرير موقع BKN. اكتب التقرير الأسبوعي عن تغطية الصحافة العالمية للسعودية.
الأرقام: ${JSON.stringify(numbers)}
العناوين (التاريخ | المصدر | العنوان):
${titles.slice(0, 150).join('\n')}

رجّع JSON فقط:
{"title": "عنوان التقرير", "intro": "فقرة افتتاحية من ٣ جمل",
 "highlights": ["٤ إلى ٦ نقاط بأهم ما ميّز الأسبوع"],
 "stories": [{"title": "...", "summary": "جملتين"}],
 "mbs": "فقرة عن تغطية ولي العهد هذا الأسبوع (أو فاضي إذا ما فيه)",
 "outlook": "جملتين عن المواضيع المتوقع استمرارها"}
القواعد: من ٣ إلى ٥ قصص، اعتمد فقط على المعطيات أعلاه، وكن محايدًا.`, 3000);
  const date = days[6];
  const report = { date, from: days[0], to: days[6], generated: new Date().toISOString(), numbers, ...r };
  await writeJSON(`weekly/${date}.json`, report);
  await writeJSON('weekly/index.json', [{ date, title: r.title || '' }, ...index.filter((x) => x.date !== date)]);
  return report;
}

// ---------- تلقرام ----------
async function telegram(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: false }),
    });
    if (!r.ok) console.warn('Telegram:', r.status, (await r.text()).slice(0, 150));
  } catch (e) { console.warn('Telegram:', e.message); }
}
const h = (s = '') => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---------- التشغيل ----------
async function run() {
  const started = Date.now();
  let [news, articles, breaking, seenList] = await Promise.all(
    ['news.json', 'articles.json', 'breaking.json', 'seen.json'].map((n) => readJSON(n)));
  const seen = new Set(seenList);
  const stats = await readJSON('stats.json', { days: {} });
  const oldBrief = await readJSON('brief.json', null);
  const newBreaking = [], newRecs = [];
  let added = { news: 0, articles: 0, breaking: 0 };
  const now = new Date().toISOString();

  // 1) X أولًا لأنه الأسرع
  for (const tw of await fetchX()) {
    if (seen.has(tw.id)) continue;
    seen.add(tw.id);
    if (Date.now() - new Date(tw.published) > BREAKING_TTL) continue;
    breaking.unshift({ ...tw, added: now });
    newBreaking.push(tw);
    added.breaking++;
  }

  // 1ب) عاجل تلقرام: كل منشور خلال آخر ساعة
  for (const tg of await fetchTelegramBreaking()) {
    if (seen.has(tg.id)) continue;
    if (Date.now() - new Date(tg.published) > BREAKING_TTL) { seen.add(tg.id); continue; }
    seen.add(tg.id);
    breaking.unshift({ ...tg, added: tg.published });   // يبقى ساعة من وقت نشره
    newBreaking.push(tg); added.breaking++;
  }

  // 2) RSS
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const raw = results.flatMap((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    console.warn(`تعذر جلب ${FEEDS[i].name}: ${r.reason?.message}`);
    STATUS.feedsFailed.push(`${FEEDS[i].name}: ${r.reason?.message}`);
    return [];
  });

  STATUS.feedsOk = results.filter((r) => r.status === 'fulfilled').length; STATUS.fetched = raw.length;
  // نستبعد المكرر والقديم والعناوين القصيرة (مثل «الوسائط»)
  const fresh = [], local = new Set();
  for (const it of raw.sort(byDate('published'))) {
    const id = hash(it.url), tid = hash(it.title.toLowerCase());
    if (seen.has(id) || seen.has(tid) || local.has(id) || local.has(tid)) continue;
    local.add(id); local.add(tid);
    if (Date.now() - new Date(it.published) > MAX_AGE || it.title.split(/\s+/).length < 4) { seen.add(id); seen.add(tid); continue; }
    fresh.push({ ...it, id, tid });
  }

  // مصادر العاجل المحلية (واس، العربية) تروح للعاجل فقط، مو لقائمة الأخبار العالمية
  const brkFresh = fresh.filter((i) => i.feedKind === 'breaking');
  const world = fresh.filter((i) => i.feedKind !== 'breaking');

  // توزيع عادل: خبر من كل مصدر بالدور، عشان ما يستحوذ مصدر واحد على الدفعة
  const byFeed = new Map();
  for (const it of world) { if (!byFeed.has(it.feed)) byFeed.set(it.feed, []); byFeed.get(it.feed).push(it); }
  STATUS.fresh = fresh.length; STATUS.world = world.length;
  const queue = [];
  for (let more = true; more;) { more = false; for (const list of byFeed.values()) { if (list.length) { queue.push(list.shift()); more = true; } } }

  const markSeen = (it) => { seen.add(it.id); seen.add(it.tid); };
  const toRec = (it, a) => ({
    id: it.id, origin: 'rss', source: it.source, author: it.author,
    title_ar: a.title_ar || it.title, title_orig: it.lang === 'ar' ? '' : it.title,
    title_en: a.title_en || (it.lang === 'en' ? it.title : ''),
    summary_ar: a.summary_ar || [], summary_en: a.summary_en || [], url: it.url, published: it.published,
    subject: a.subject === 'mbs' ? 'mbs' : 'saudi',
    tone: ['positive', 'neutral', 'critical'].includes(a.tone) ? a.tone : 'neutral',
    topic: a.topic || '', country: (it.country || a.country || '').toUpperCase().slice(0, 2),
    ...(a.pending || !KEY ? { pending: true, desc: it.description || '', lang: it.lang } : {}),
  });
  const addBreaking = (rec) => { breaking.unshift({ ...rec, added: now }); newBreaking.push(rec); added.breaking++; };

  // أ) العاجل المحلي: الأحدث فقط (آخر ساعة)، وبحد أقصى ٣ في كل تشغيل
  let brkCount = 0;
  for (const it of brkFresh) {
    markSeen(it);
    if (brkCount >= 3 || Date.now() - new Date(it.published) > BREAKING_TTL) continue;
    let a;
    if (KEY) { try { a = await analyze(it); } catch (e) { console.warn(`تحليل: ${e.message}`); STATUS.analyzeErrors++; STATUS.lastError = String(e.message).slice(0, 300); continue; } }
    else a = { ...heuristic(it), breaking: BREAKING_WORDS.test(it.title) };
    if (!a.relevant || !a.breaking || ROUTINE_WORDS.test(it.title)) continue;
    addBreaking(toRec(it, a)); brkCount++;
  }

  // ب) الصحافة العالمية
  for (const it of queue.slice(0, MAX_NEW)) {
    let a;
    try { a = KEY ? await analyze(it) : heuristic(it); STATUS.analyzed++; }
    catch (e) {
      console.warn(`تحليل: ${e.message}`); STATUS.analyzeErrors++; STATUS.lastError = String(e.message).slice(0, 300);
      if (!KEY_BAD) continue;                 // خطأ مؤقت: نعيد المحاولة في التشغيل الجاي
      a = { ...heuristic(it), pending: true }; // المفتاح مرفوض: نعرضه الحين ونترجمه لاحقًا
    }
    markSeen(it);
    if (!a.relevant) continue;
    const rec = toRec(it, a);
    newRecs.push(rec);
    if (a.mt) rec.mt = true;
    if (a.kind === 'article') { articles.unshift(rec); added.articles++; countIn(stats, rec, 'articles'); }
    else { news.unshift(rec); added.news++; countIn(stats, rec, 'news'); }
  }
  if (queue.length > MAX_NEW) console.log(`باقي ${queue.length - MAX_NEW} خبر للتشغيل الجاي`);

  // ج) ترجمة الأخبار اللي انعرضت بدون ترجمة (لما يصير المفتاح صالح)
  if (KEY && !KEY_BAD) {
    const pend = [...news, ...articles].filter((r) => r.pending).slice(0, Number(process.env.RETRANSLATE_PER_RUN || 20));
    for (const r of pend) {
      try {
        const a = await analyze({ title: r.title_orig || r.title_ar, description: r.desc || '', source: r.source, url: r.url, lang: r.lang || 'en' });
        if (KEY_BAD) break;
        if (a.relevant === false) { r.drop = true; continue; }   // الذكاء الاصطناعي قرر إنه ما يخص السعودية
        Object.assign(r, {
          title_ar: a.title_ar || r.title_ar, title_en: a.title_en || r.title_en, summary_ar: a.summary_ar || [], summary_en: a.summary_en || [],
          tone: ['positive', 'neutral', 'critical'].includes(a.tone) ? a.tone : 'neutral', topic: a.topic || '', subject: a.subject === 'mbs' ? 'mbs' : 'saudi',
          country: r.country || (a.country || '').toUpperCase().slice(0, 2),
        });
        delete r.pending; delete r.desc; delete r.lang; delete r.mt; STATUS.retranslated = (STATUS.retranslated || 0) + 1;
        if (a.kind === 'article' && news.includes(r)) { news.splice(news.indexOf(r), 1); articles.unshift(r); }
      } catch (e) { STATUS.lastError = String(e.message).slice(0, 300); if (KEY_BAD) break; }
    }
  }
  // د) ترجمة مجانية لعناوين الأخبار اللي للحين بلغتها الأصلية (دفعات، بحد ١٠٠ عنوان لكل تشغيل)
  if (!KEY || KEY_BAD) {
    const todo = [...news, ...articles, ...breaking].filter((r) => r.title_orig && r.title_ar === r.title_orig && !r.mt).slice(0, 100);
    if (todo.length) {
      try {
        const ar = await translateBatch(todo.map((r) => r.title_orig));
        todo.forEach((r, i) => { if (ar[i]) { r.title_ar = ar[i]; r.mt = true; } });
        STATUS.mt = (STATUS.mt || 0) + ar.filter(Boolean).length;
      } catch (e) { STATUS.mtErrors = (STATUS.mtErrors || 0) + 1; STATUS.mtLastError = e.message; }
    }
  }
  news = news.filter((r) => !r.drop); articles = articles.filter((r) => !r.drop);
  STATUS.keyRejected = KEY_BAD;
  STATUS.pending = [...news, ...articles].filter((r) => r.pending).length;

  // 3) تنظيف: العاجل يختفي بعد ساعة من ظهوره
  breaking = breaking.filter((b) => Date.now() - new Date(b.added || b.published) < BREAKING_TTL).sort(byDate('published'));
  news = news.sort(byDate('published')).slice(0, LIMITS.news);
  articles = articles.sort(byDate('published')).slice(0, LIMITS.articles);

  // 4) الموجز والقصص
  let brief = null;
  try { brief = await makeBrief(news, articles, oldBrief); } catch (e) { console.warn('موجز:', e.message); }

  // 5) الأرشيف والتقرير الأسبوعي
  try { await archive(newRecs, brief); } catch (e) { console.warn('أرشيف:', e.message); }
  let weekly = null;
  try { weekly = await weeklyReport(stats); } catch (e) { console.warn('تقرير أسبوعي:', e.message); }

  // 6) تلقرام: العاجل الجديد + الموجز + التقرير
  for (const b of newBreaking.slice(0, 5)) {
    await telegram(`🔴 <b>عاجل | ${h(b.source)}</b>\n\n${h(b.title_ar)}\n\n${h(b.url)}${SITE_URL ? `\n\n📡 BKN: ${SITE_URL}` : ''}`);
  }
  if (brief) {
    await telegram(`📰 <b>موجز BKN</b>\n<b>${h(brief.headline)}</b>\n\n${brief.points.map((p) => '• ' + h(p)).join('\n')}\n\n<i>${h(brief.mood)}</i>${SITE_URL ? `\n\n${SITE_URL}` : ''}`);
  }

  if (weekly) {
    await telegram(`📊 <b>تقرير BKN الأسبوعي</b>\n<b>${h(weekly.title)}</b>\n\n${h(weekly.intro)}\n\n${(weekly.highlights || []).map((p) => '• ' + h(p)).join('\n')}${SITE_URL ? `\n\n${SITE_URL}/report.html?d=${weekly.date}` : ''}`);
  }

  const keepDays = Object.keys(stats.days).sort().slice(-LIMITS.statsDays);
  stats.days = Object.fromEntries(keepDays.map((d) => [d, stats.days[d]]));

  await Promise.all([
    writeJSON('status.json', { ...STATUS, added }),
    writeJSON('stats.json', stats),
    ...(brief ? [writeJSON('brief.json', brief)] : []),
    writeJSON('news.json', news),
    writeJSON('articles.json', articles),
    writeJSON('breaking.json', breaking),
    writeJSON('seen.json', [...seen].slice(-LIMITS.seen)),
    ...(added.news + added.articles + added.breaking || brief || STATUS.retranslated || STATUS.mt ? [writeJSON('meta.json', { updated: new Date().toISOString() })] : []),
  ]);
  console.log(`✓ أخبار +${added.news} | مقالات +${added.articles} | عاجل +${added.breaking} | ${((Date.now() - started) / 1000).toFixed(1)}ث`);
}

if (process.argv.includes('--watch')) {
  console.log(`تشغيل مستمر كل ${WATCH_SECONDS} ثانية…`);
  for (;;) {
    try { await run(); } catch (e) { console.error(e); }
    await new Promise((r) => setTimeout(r, WATCH_SECONDS * 1000));
  }
} else {
  await run();
}
