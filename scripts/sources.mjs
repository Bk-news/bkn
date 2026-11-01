// ===== مصادر الموقع =====
// أغلب المصادر تُجلب عبر خلاصات Google News RSS (مجانية وبدون مفتاح)
// kind: "mixed" = أخبار ومقالات، "article" = مقالات رأي وتحليل، "breaking" = مصدر عاجل

const GN = {
  en: ['en-US', 'US', 'US:en'],
  ar: ['ar', 'SA', 'SA:ar'],
  fr: ['fr', 'FR', 'FR:fr'],
  de: ['de', 'DE', 'DE:de'],
};
const gn = (q, lang = 'en') => {
  const [hl, gl, ceid] = GN[lang];
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
};

const SA = '(Saudi OR "bin Salman" OR Riyadh OR MBS)';
const site = (domain, name, country, kind = 'mixed', q = SA, lang = 'en') => ({
  name, source: name, country, kind, lang, url: gn(`${q} site:${domain} when:2d`, lang),
});

export const FEEDS = [
  // بحث عام في كل الصحافة العالمية
  { name: 'Global – Saudi Arabia', kind: 'mixed', lang: 'en', url: gn('"Saudi Arabia" when:1d') },
  { name: 'Global – Crown Prince', kind: 'mixed', lang: 'en', url: gn('("Mohammed bin Salman" OR "Saudi crown prince") when:1d') },

  // وكالات الأنباء
  site('reuters.com', 'Reuters', 'GB'),
  site('apnews.com', 'AP', 'US'),
  site('bloomberg.com', 'Bloomberg', 'US'),
  site('france24.com', 'France 24', 'FR'),

  // صحف أمريكية
  site('nytimes.com', 'The New York Times', 'US'),
  site('washingtonpost.com', 'The Washington Post', 'US'),
  site('wsj.com', 'The Wall Street Journal', 'US'),
  site('cnn.com', 'CNN', 'US'),

  // صحف بريطانية وأوروبية
  site('ft.com', 'Financial Times', 'GB'),
  site('economist.com', 'The Economist', 'GB', 'article'),
  site('theguardian.com', 'The Guardian', 'GB'),
  site('bbc.com', 'BBC', 'GB'),
  site('lemonde.fr', 'Le Monde', 'FR', 'mixed', '("Arabie saoudite" OR "Ben Salmane")', 'fr'),
  site('spiegel.de', 'Der Spiegel', 'DE', 'mixed', '(Saudi-Arabien OR "bin Salman")', 'de'),

  // مجلات التحليل والرأي
  site('foreignpolicy.com', 'Foreign Policy', 'US', 'article'),
  site('foreignaffairs.com', 'Foreign Affairs', 'US', 'article'),
  site('al-monitor.com', 'Al-Monitor', 'US'),
  site('atlanticcouncil.org', 'Atlantic Council', 'US', 'article'),

  // آسيا
  site('asia.nikkei.com', 'Nikkei Asia', 'JP'),
  site('scmp.com', 'South China Morning Post', 'HK'),

  // مصادر سعودية بالإنجليزي
  site('arabnews.com', 'Arab News', 'SA'),
  site('saudigazette.com.sa', 'Saudi Gazette', 'SA'),

  // مصادر العاجل بالعربي (تشتغل بدون اشتراك X)
  { name: 'واس', source: 'واس', country: 'SA', kind: 'breaking', lang: 'ar', url: gn('site:spa.gov.sa when:1d', 'ar') },
  { name: 'العربية', source: 'العربية', country: 'SA', kind: 'breaking', lang: 'ar', url: 'https://www.alarabiya.net/feed/rss2/ar.xml' },
];

// ===== حسابات X (تويتر) للعاجل =====
// تشتغل فقط إذا أضفت X_BEARER_TOKEN (اشتراك X API مدفوع)
// ⚠️ تأكد من معرّف كل حساب (اللي بعد @) قبل التشغيل وعدّله إذا لزم
export const X_ACCOUNTS = [
  { username: 'spagov', name: 'واس' },
  { username: 'AlArabiya_Brk', name: 'العربية عاجل' },
  { username: 'RoyalCourtKSA', name: 'الديوان الملكي' },     // تأكد من المعرّف
  { username: 'CoalitionSpox', name: 'متحدث التحالف' },      // تأكد من المعرّف
];

// روابط تدل إن المادة مقال رأي أو تحليل
export const OPINION_HINTS = [
  /\/opinion/i, /\/opinions\//i, /\/commentisfree\//i, /\/analysis\//i,
  /\/ideas\//i, /\/argument\//i, /\/columns?\//i, /\/editorial/i, /\/blogs?\//i,
];

// كلمات تحدد إن الخبر يخص السعودية (تُستخدم إذا ما فيه مفتاح ذكاء اصطناعي)
export const RELEVANCE = /saudi|riyadh|jeddah|bin salman|\bmbs\b|aramco|neom|arabie saoudite|saudi-arabien|السعودي|المملكة|ولي العهد|الرياض|جدة|خادم الحرمين/i;

// كلمات تدل إن المادة عن ولي العهد (تُستخدم إذا ما فيه مفتاح ذكاء اصطناعي)
export const MBS = /bin salman|crown prince|\bmbs\b|ben salmane|kronprinz|ولي العهد|محمد بن سلمان/i;

// بدون مفتاح ذكاء اصطناعي: خبر واس أو العربية يصير «عاجل» فقط إذا فيه هذي الكلمات
export const BREAKING_WORDS = /عاجل|ولي العهد|خادم الحرمين|مجلس الوزراء|أمر ملكي|الديوان الملكي/;
