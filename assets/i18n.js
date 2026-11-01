// ================= الترجمة: عربي / English =================
const LANG = (() => { try { return JSON.parse(localStorage.getItem('bkn-lang')) || 'ar'; } catch { return 'ar'; } })();
const EN = LANG === 'en';
document.documentElement.lang = LANG;
document.documentElement.dir = EN ? 'ltr' : 'rtl';

const I18N = {
  ar: {
    tagline: 'السعودية في عيون الصحافة العالمية… مترجمة لحظة بلحظة',
    'nav.home': 'الرئيسية', 'nav.saudi': 'السعودية', 'nav.mbs': 'ولي العهد', 'nav.news': 'الأخبار', 'nav.articles': 'المقالات',
    'nav.analytics': 'التحليلات', 'nav.archive': 'الأرشيف', 'nav.reports': 'التقارير', 'nav.breaking': 'العاجل',
    'menu.mine': 'متابعاتي ومحفوظاتي', 'menu.sources': 'ملفات الصحف', 'menu.video': 'منتج الفيديو', 'menu.screen': 'وضع الشاشة الكبيرة', 'menu.minute': 'الخلاصة في دقيقة',
    live: 'يرصد الآن', updated: 'آخر تحديث', alertOn: '🔔 التنبيه مفعّل', alertOff: '🔕 نبّهني بالعاجل', breaking: 'عاجل',
    read: 'اقرأ في المصدر ←', readShort: 'اقرأ في المصدر', kicker: 'الأبرز الآن', latest: 'آخر الأخبار', allNews: 'كل الأخبار ←', opinion: 'مقالات ورأي', all: 'الكل', more: 'الكل ←',
    gathering: 'الرادار يجمع الأخبار الآن… أول تحديث يوصل خلال دقائق.', noTopic: 'ما فيه أخبار في هذا التصنيف.', noArticles: 'ما فيه مقالات بعد.',
    mood: 'مزاج الصحافة العالمية', last24: 'آخر ٢٤ ساعة', lastN: 'آخر {n} مادة', who: 'مين يكتب عن السعودية؟', toAnalytics: 'التحليلات ←',
    briefAgo: 'موجز {t}', playBrief: '🔊 استمع للموجز', playBulletin: '📻 النشرة الصوتية الكاملة', bigStories: 'القصص الكبرى', outlets: 'صحيفة', storiesEmpty: 'تظهر القصص لما تتجمع أخبار كافية.', timeline: 'الخط الزمني ←',
    footer: 'العناوين مترجمة والملخصات بصياغة BKN، والنبرة والتصنيف تقدير آلي. حقوق المواد الأصلية محفوظة لمصادرها، اضغط «اقرأ في المصدر» للنص الكامل.',
    search: 'ابحث في العناوين والملخصات…', allSources: 'كل المصادر', allTones: 'كل النبرات', items: '{n} مادة', noResults: 'ما فيه نتائج مطابقة.',
    breakingEmpty: 'الأجواء هادئة… ما فيه أخبار عاجلة خلال الساعة الأخيرة.', minute: 'دقيقة',
    'tone.positive': 'إيجابي', 'tone.neutral': 'محايد', 'tone.critical': 'ناقد',
    save: 'احفظ', saved: 'محفوظ', listen: 'استمع', img: 'صمّم صورة للنشر', wa: 'شارك في واتساب', copy: 'انسخ',
    imgTitle: 'قوالب جاهزة للنشر', download: '⬇ تحميل الصورة', share: 'مشاركة',
    'size.story': 'سناب وستوري ٩:١٦', 'size.post': 'منشور ٤:٥', 'size.x': 'تويتر ١٦:٩',
    'tpl.news': 'خبر', 'tpl.breaking': 'عاجل', 'tpl.article': 'مقال', 'tpl.brief': 'موجز',
    watching: 'متابَع', watchNew: 'أخبار جديدة عن «{w}»',
    // رؤوس الصفحات
    'h.news': 'الأخبار', 'd.news': 'ما تنقله وكالات الأنباء والصحف العالمية عن المملكة',
    'h.articles': 'المقالات', 'd.articles': 'أقلام العالم: مقالات الرأي والتحليل عن السعودية',
    'h.breaking': 'العاجل', 'd.breaking': 'كل خبر عاجل يبقى ساعة واحدة، والدائرة تعدّ الدقائق المتبقية له',
    'h.saudi': 'السعودية', 'd.saudi': 'كل ما تكتبه الصحافة العالمية عن المملكة: سياسة واقتصاد وطاقة ورياضة ومجتمع',
    'h.mbs': 'ولي العهد الأمير محمد بن سلمان', 'd.mbs': 'كيف تكتب الصحافة العالمية عن ولي العهد: تصريحاته وزياراته وقراراته',
    'h.mine': 'متابعاتي ومحفوظاتي', 'd.mine': 'أضف كلمات تهمك والموقع يجمع لك أخبارها وينبهك أول ما تنذكر',
    'h.analytics': 'التحليلات', 'd.analytics': 'كيف يكتب العالم عن السعودية: من يكتب، وبأي نبرة، وعن ماذا',
    'h.sources': 'ملفات الصحف', 'd.sources': 'كل صحيفة: كم كتبت عن السعودية، وبأي نبرة، وعن أي مواضيع',
    'h.archive': 'الأرشيف', 'd.archive': 'اختر أي يوم وشوف موجزه وكل ما انكتب فيه عن السعودية',
    'h.reports': 'التقرير الأسبوعي', 'd.reports': 'تقرير يُكتب تلقائيًا كل أسبوع بأهم القصص والأرقام',
    'h.story': 'الخط الزمني للقصة', 'd.story': 'مين كتب أول، ومين لحقه، وكيف غطّتها كل دولة',
    'h.video': 'منتج الفيديو', 'd.video': 'حوّل أهم الأخبار لفيديو عمودي ٩:١٦ جاهز للسناب والريلز والتيك توك',
    // الأقسام
    sectionCount: 'مادة خلال ٧ أيام', sectionShare: 'من كل التغطية', sectionTone: 'نبرة التغطية',
    // متابعاتي
    watchTitle: 'قائمة المتابعة', watchPh: 'أضف كلمة… مثل: أرامكو، نيوم، رؤية 2030', add: 'أضف', watchEmpty: 'أضف كلمات تهمك وتظهر أخبارها هنا.',
    'an.map': 'خريطة الاهتمام العالمي', 'an.words': 'الكلمات الأكثر تداولًا', 'an.wordsSub': 'من عناوين آخر ٧ أيام · اضغط أي كلمة تشوف أخبارها',
    'an.tone': 'نبرة التغطية يومًا بيوم', 'an.toneSub': 'عدد المواد يوميًا مقسّمة حسب نبرتها تجاه السعودية', 'an.sources': 'أكثر الصحف كتابة', 'an.sourcesSub': 'اضغط أي صحيفة تشوف ملفها',
    'an.topics': 'أكثر المواضيع', 'an.topicsSub': 'عدد المواد لكل موضوع', 'r.7': '٧ أيام', 'r.30': '٣٠ يوم', 'r.90': '٩٠ يوم',
    watchItems: 'أخبار متابعاتك', savedTitle: 'المحفوظات', savedEmpty: 'ما حفظت أي خبر بعد. اضغط علامة الحفظ تحت أي خبر.',
  },
  en: {
    tagline: 'Saudi Arabia through the eyes of the world press, live',
    'nav.home': 'Home', 'nav.saudi': 'Saudi Arabia', 'nav.mbs': 'Crown Prince', 'nav.news': 'News', 'nav.articles': 'Opinion',
    'nav.analytics': 'Analytics', 'nav.archive': 'Archive', 'nav.reports': 'Reports', 'nav.breaking': 'Breaking',
    'menu.mine': 'Watchlist & saved', 'menu.sources': 'Outlet profiles', 'menu.video': 'Video maker', 'menu.screen': 'Big screen mode', 'menu.minute': 'One-minute recap',
    live: 'Live', updated: 'Updated', alertOn: '🔔 Alerts on', alertOff: '🔕 Breaking alerts', breaking: 'BREAKING',
    read: 'Read at source →', readShort: 'Read at source', kicker: 'Top story', latest: 'Latest news', allNews: 'All news →', opinion: 'Opinion & analysis', all: 'All', more: 'All →',
    gathering: 'Radar is collecting news… first update arrives within minutes.', noTopic: 'No news in this topic.', noArticles: 'No articles yet.',
    mood: 'World press mood', last24: 'Last 24 hours', lastN: 'Last {n} items', who: 'Who writes about Saudi Arabia?', toAnalytics: 'Analytics →',
    briefAgo: 'Brief · {t}', playBrief: '🔊 Listen to the brief', playBulletin: '📻 Full audio bulletin', bigStories: 'Big stories', outlets: 'outlets', storiesEmpty: 'Stories appear once enough coverage builds up.', timeline: 'Timeline →',
    footer: 'Headlines are translated and summaries written by BKN; tone and topics are automated estimates. Original content belongs to its publishers — use "Read at source" for the full text.',
    search: 'Search headlines and summaries…', allSources: 'All outlets', allTones: 'All tones', items: '{n} items', noResults: 'No matching results.',
    breakingEmpty: 'All quiet… no breaking news in the last hour.', minute: 'min',
    'tone.positive': 'Positive', 'tone.neutral': 'Neutral', 'tone.critical': 'Critical',
    save: 'Save', saved: 'Saved', listen: 'Listen', img: 'Make a share image', wa: 'Share on WhatsApp', copy: 'Copy',
    imgTitle: 'Ready-to-post templates', download: '⬇ Download image', share: 'Share',
    'size.story': 'Snap & Story 9:16', 'size.post': 'Post 4:5', 'size.x': 'X 16:9',
    'tpl.news': 'News', 'tpl.breaking': 'Breaking', 'tpl.article': 'Opinion', 'tpl.brief': 'Brief',
    watching: 'Watching', watchNew: 'New coverage of "{w}"',
    'h.news': 'News', 'd.news': 'What wire services and world papers report about the Kingdom',
    'h.articles': 'Opinion', 'd.articles': 'World voices: opinion and analysis about Saudi Arabia',
    'h.breaking': 'Breaking', 'd.breaking': 'Each breaking item stays for one hour; the ring counts down the minutes left',
    'h.saudi': 'Saudi Arabia', 'd.saudi': 'Everything the world press writes about the Kingdom: politics, economy, energy, sport and society',
    'h.mbs': 'Crown Prince Mohammed bin Salman', 'd.mbs': 'How the world press covers the Crown Prince: statements, visits and decisions',
    'h.mine': 'Watchlist & saved', 'd.mine': 'Add keywords you care about — BKN collects their coverage and alerts you',
    'h.analytics': 'Analytics', 'd.analytics': 'How the world writes about Saudi Arabia: who, in what tone, about what',
    'h.sources': 'Outlet profiles', 'd.sources': 'Every outlet: how much it writes about Saudi Arabia, in what tone, on which topics',
    'h.archive': 'Archive', 'd.archive': 'Pick any day to see its brief and everything written about Saudi Arabia',
    'h.reports': 'Weekly report', 'd.reports': 'An automatic weekly report on the top stories and numbers',
    'h.story': 'Story timeline', 'd.story': 'Who broke it, who followed, and how each country covered it',
    'h.video': 'Video maker', 'd.video': 'Turn the top news into a 9:16 vertical video for Snap, Reels and TikTok',
    sectionCount: 'items in 7 days', sectionShare: 'of all coverage', sectionTone: 'Coverage tone',
    watchTitle: 'Watchlist', watchPh: 'Add a keyword… e.g. Aramco, NEOM, Vision 2030', add: 'Add', watchEmpty: 'Add keywords and their coverage shows up here.',
    'an.map': 'World attention map', 'an.words': 'Trending words', 'an.wordsSub': 'From the last 7 days of headlines · click a word to see its stories',
    'an.tone': 'Coverage tone, day by day', 'an.toneSub': 'Daily items split by tone toward Saudi Arabia', 'an.sources': 'Most active outlets', 'an.sourcesSub': 'Click an outlet to see its profile',
    'an.topics': 'Top topics', 'an.topicsSub': 'Items per topic', 'r.7': '7 days', 'r.30': '30 days', 'r.90': '90 days',
    watchItems: 'Watchlist coverage', savedTitle: 'Saved', savedEmpty: 'Nothing saved yet. Tap the bookmark under any story.',
  },
};
const TOPIC_EN = { 'سياسة': 'Politics', 'اقتصاد': 'Economy', 'طاقة': 'Energy', 'أمن ودفاع': 'Security & defense', 'رياضة': 'Sport', 'سياحة وترفيه': 'Tourism & entertainment', 'تقنية': 'Technology', 'مجتمع وثقافة': 'Society & culture' };
const CITY_EN = { 'الرياض': 'Riyadh', 'لندن': 'London', 'واشنطن': 'Washington', 'باريس': 'Paris', 'بكين': 'Beijing', 'طوكيو': 'Tokyo' };

function t(key, vars = {}) {
  let s = I18N[LANG][key] ?? I18N.ar[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
const topicName = (x) => (EN ? TOPIC_EN[x] || x : x);
const cityName = (x) => (EN ? CITY_EN[x] || x : x);
// نص الخبر حسب اللغة
const T_ = (it) => (EN ? it.title_en || it.title_orig || it.title_ar : it.title_ar);
const S_ = (it) => (EN ? (it.summary_en?.length ? it.summary_en : []) : it.summary_ar || []);
const SUB_ = (it) => (EN ? '' : it.title_orig || it.title_en || '');

function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}
