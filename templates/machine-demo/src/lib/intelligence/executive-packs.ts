import type {
  ConcernDomain,
  DashboardBlueprint,
  DashboardWidget,
} from "@/types/intelligence";

export interface ExecutiveDashboardPack {
  aiBrief: string;
  rootCause: string[];
  financialImpact: string;
  operationalImpact: string;
  relatedRisks: string[];
  recommendedAction: string;
  historicalTrend: string;
  widgets: DashboardWidget[];
  keyKpis: string[];
}

function pack(
  partial: ExecutiveDashboardPack
): ExecutiveDashboardPack {
  return partial;
}

const packs: Record<ConcernDomain, ExecutiveDashboardPack> = {
  "risk-portfolio": pack({
    aiBrief:
      "ریسک پورتفویو امروز در برج آریا متمرکز است. بدون مداخله تا پایان هفته، احتمال جریمه و افت حاشیه فصل بالا می‌رود.",
    rootCause: [
      "شکستن شناوری مسیر بحرانی آریا",
      "قفل صورت‌وضعیت فاز ۲ نزد کارفرما",
      "ظرفیت پیمانکار سازه زیر آستانه",
    ],
    financialImpact:
      "۱۸.۴ میلیارد تومان درآمد در معرض ریسک این هفته · جریمه محتمل یک‌هفته‌ای ۴.۲ میلیارد",
    operationalImpact:
      "خواب نسبی جبهه سازه · فشار بازتخصیص از پروژه‌های سبز به آریا",
    relatedRisks: [
      "از دست رفتن نقطه عطف تیرماه",
      "تضعیف موضع ادعا در مذاکره با کارفرما",
      "تمرکز زیان در یک پروژه",
    ],
    recommendedAction:
      "اولویت وصول فاز ۲ را تأیید کنید و جلسه بازیابی پیمانکار سازه را امروز برگزار کنید.",
    historicalTrend:
      "طی هفت هفته گذشته، شمار پروژه‌های قرمز از صفر به یک رسیده و میانگین اطمینان برنامه از ۷۴٪ به ۶۱٪ افت کرده است.",
    keyKpis: ["پروژه‌های قرمز", "تمرکز ریسک", "تغییر از دیروز", "اثر ریال"],
    widgets: [
      { id: "r1", title: "شاخص‌های ریسک امروز", kind: "kpi-row", why: "چهار عدد تصمیم فوری", span: 2 },
      { id: "r2", title: "ماتریس احتمال × اثر", kind: "heatmap", why: "کدام تهدید بیشترین توجه را می‌طلبد؟", span: 1 },
      { id: "r3", title: "سهم ریسک بین پروژه‌ها", kind: "treemap", why: "تمرکز زیان کجاست؟", span: 1 },
      { id: "r4", title: "روند پروژه‌های قرمز", kind: "line", why: "آیا ریسک در حال گسترش است؟", span: 2 },
      { id: "r5", title: "مقایسه اطمینان برنامه", kind: "bar", why: "کدام پروژه از مسیر خارج شده؟", span: 1 },
      { id: "r6", title: "سلامت پورتفویو", kind: "gauge", why: "وضعیت کلی در یک نگاه", span: 1 },
      { id: "r7", title: "زمان‌بندی تهدیدها", kind: "timeline", why: "ترتیب مداخله ۷ روزه", span: 2 },
    ],
  }),
  cashflow: pack({
    aiBrief:
      "فشار نقد از قفل مطالبات است، نه کمبود درآمد. آزادی ۱۲.۱ میلیارد از آریا پایدارترین مسیر این هفته است.",
    rootCause: [
      "تأخیر تأیید کارفرمای آریا",
      "عدم‌تراز وصول و تعهدات پرداخت",
      "حسن‌انجام و کار در جریان قفل‌شده",
    ],
    financialImpact:
      "موقعیت نقد تحت فشار ۱۴روزه · ۱۲.۱ میلیارد قابل آزادی با اولویت وصول",
    operationalImpact:
      "تأخیر پرداخت پیمانکاران اهرم کیفیت را ضعیف و خواب تجهیزات را گران می‌کند",
    relatedRisks: ["توقف پرداخت پروژه‌های کلیدی", "افزایش هزینه اجاره اضطراری"],
    recommendedAction:
      "اولویت وصول صورت‌وضعیت فاز ۲ آریا را ثبت و پیگیری کارفرما را از فردا صبح فعال کنید.",
    historicalTrend:
      "رودخانه نقد هشت هفته اخیر نوسان داشته؛ حوضچه مطالبات از هفته پنجم بزرگ‌تر شده است.",
    keyKpis: ["موقعیت نقد", "پیش‌بینی ۱۴روزه", "معوق قابل آزادی", "تعهدات هفته"],
    widgets: [
      { id: "c1", title: "KPI نقدینگی", kind: "kpi-row", why: "وضعیت نقد برای تصمیم امروز", span: 2 },
      { id: "c2", title: "رودخانه نقد ۱۲ هفته", kind: "area", why: "روند و نقاط فشار کجاست؟", span: 2 },
      { id: "c3", title: "آبشار اثر مطالبات", kind: "waterfall", why: "از درآمد تا نقد آزاد چه کم می‌شود؟", span: 1 },
      { id: "c4", title: "ترکیب قفل سرمایه", kind: "donut", why: "مطالبات، حسن‌انجام یا موجودی؟", span: 1 },
      { id: "c5", title: "مقایسه تعهدات پرداخت", kind: "bar", why: "کدام پرداخت اولویت اجرایی دارد؟", span: 1 },
      { id: "c6", title: "دوام نقد", kind: "gauge", why: "تا چند هفته بدون وصول دوام داریم؟", span: 1 },
      { id: "c7", title: "صف پرداخت هفته", kind: "list", why: "اقدام‌های مالی امروز", span: 2 },
    ],
  }),
  collection: pack({
    aiBrief:
      "متوسط وصول ۲۱ روز است. سه صورت‌وضعیت بالای ۱۰ روز، بیشترین اثر را روی نقد دارند — تمرکز تماس‌ها باید اینجا باشد.",
    rootCause: [
      "اسناد ناقص قبل از ارسال",
      "تأخیر تأیید کارفرما",
      "عدم اولویت‌بندی بر اساس مبلغ و عمر",
    ],
    financialImpact: "۱۲.۱ میلیارد معوق آریا · فرصت آزادی سرمایه در ۷ روز",
    operationalImpact: "تأخیر وصول، برنامه پرداخت پیمانکار را ناپایدار می‌کند",
    relatedRisks: ["انباشت مطالبات فصل", "فشار نقد عملیاتی"],
    recommendedAction:
      "تکمیل اسناد صورت‌وضعیت فاز ۲ و پیگیری روزانه کارفرما تا آزادسازی.",
    historicalTrend: "DSO از ۱۶ روز در سه ماه پیش به ۲۱ روز رسیده است.",
    keyKpis: ["متوسط وصول", "معوق بالای ۱۰ روز", "مبلغ قابل آزادی", "نرخ وصول هفته"],
    widgets: [
      { id: "a1", title: "KPI وصول", kind: "kpi-row", why: "اندازه و فوریت مسئله", span: 2 },
      { id: "a2", title: "روند متوسط وصول", kind: "line", why: "آیا دوره وصول در حال بدتر شدن است؟", span: 2 },
      { id: "a3", title: "عمر مطالبات", kind: "bar", why: "کدام سبد معوق بیشترین وزن را دارد؟", span: 1 },
      { id: "a4", title: "سهم کارفرمایان", kind: "donut", why: "تمرکز وصول روی کدام کارفرما؟", span: 1 },
      { id: "a5", title: "آبشار آزادی سرمایه", kind: "waterfall", why: "از معوق تا نقد آزاد", span: 2 },
      { id: "a6", title: "اولویت تماس‌ها", kind: "list", why: "صف اقدام وصول", span: 2 },
    ],
  }),
  delay: pack({
    aiBrief:
      "شناوری مسیر بحرانی آریا صفر است. بدون بازیابی هم‌زمان تدارکات و پیمانکار، نقطه عطف تیرماه در خطر است.",
    rootCause: [
      "تأخیر تأمین فولاد بلندمدت",
      "بهره‌وری پیمانکار سازه ۶۲٪ هدف",
      "ضعف هماهنگی برنامه و تدارکات",
    ],
    financialImpact: "جریمه محتمل ۴.۲ میلیارد برای یک هفته لغزش بیشتر",
    operationalImpact: "خواب جبهه سازه و وابستگی بازتخصیص از خط ۷",
    relatedRisks: ["از دست رفتن نقطه عطف", "ادعاهای متقابل کارفرما"],
    recommendedAction:
      "جلسه بازیابی امروز با پیمانکار سازه و تسریع قلم فولاد مسیر بحرانی.",
    historicalTrend: "اطمینان برنامه آریا طی ماه گذشته از ۷۲٪ به ۳۸٪ افت کرده است.",
    keyKpis: ["شناوری باقی‌مانده", "اطمینان برنامه", "نقاط عطف ۳۰روزه", "روز تا موعد"],
    widgets: [
      { id: "d1", title: "KPI زمان‌بندی", kind: "kpi-row", why: "سلامت زمان در یک نگاه", span: 2 },
      { id: "d2", title: "اطمینان برنامه پروژه‌ها", kind: "rings", why: "کدام پروژه از مسیر خارج است؟", span: 1 },
      { id: "d3", title: "روند اطمینان آریا", kind: "line", why: "جهت بهبود یا افت؟", span: 1 },
      { id: "d4", title: "علل تأخیر", kind: "bar", why: "ریشه غالب کدام است؟", span: 1 },
      { id: "d5", title: "گرمای مسیر بحرانی", kind: "heatmap", why: "کدام فعالیت‌ها داغ‌ترند؟", span: 1 },
      { id: "d6", title: "محور بازیابی ۷روزه", kind: "timeline", why: "ترتیب اقدامات بازیابی", span: 2 },
      { id: "d7", title: "نقاط عطف در خطر", kind: "list", why: "صف تصمیم قراردادی", span: 2 },
    ],
  }),
  margin: pack({
    aiBrief:
      "حاشیه پورتفویو از ۱۲٪ به سمت ۸٪ فشرده شده. نشتی اصلی از تأخیر هزینه‌زا و دستور تغییر بدون تحلیل حاشیه است.",
    rootCause: [
      "دستور تغییر تأییدنشده",
      "تأخیر هزینه‌زا روی مسیر بحرانی",
      "نشتی سود در پروژه آریا",
    ],
    financialImpact: "چند درصد حاشیه فصل در معرض از دست رفتن",
    operationalImpact: "اولویت‌بندی نادرست اقدام‌ها بدون دید سود",
    relatedRisks: ["عدم تحقق سود فصل", "فشار هیئت‌مدیره"],
    recommendedAction:
      "نشتی حاشیه آریا را به صف تصمیم بیاورید و دستورهای تغییر باز را با اثر حاشیه رتبه‌بندی کنید.",
    historicalTrend: "حاشیه پیش‌بینی طی سه ماه اخیر روند نزولی داشته است.",
    keyKpis: ["حاشیه پورتفویو", "حاشیه آریا", "اثر دستور تغییر", "نشتی هفته"],
    widgets: [
      { id: "m1", title: "KPI حاشیه", kind: "kpi-row", why: "وضعیت سودآوری کلان", span: 2 },
      { id: "m2", title: "روند حاشیه فصل", kind: "area", why: "آیا نشتی در حال رشد است؟", span: 2 },
      { id: "m3", title: "آبشار نشتی سود", kind: "waterfall", why: "سود کجا از بین می‌رود؟", span: 1 },
      { id: "m4", title: "سهم پروژه‌ها از فشار حاشیه", kind: "treemap", why: "کدام پروژه حاشیه را می‌خورد؟", span: 1 },
      { id: "m5", title: "مقایسه حاشیه پروژه‌ها", kind: "bar", why: "رتبه‌بندی سودآوری", span: 2 },
    ],
  }),
  equipment: pack({
    aiBrief:
      "بهره‌برداری بچینگ پارس ۴۱٪ است. خواب ناوگان هزینه اجاره پنهان می‌سازد و جبهه‌های کلیدی را تهدید می‌کند.",
    rootCause: ["خرابی تکراری", "تخصیص غیربهینه بین پروژه‌ها", "نگهداری دیرهنگام"],
    financialImpact: "رشد هزینه اجاره اضطراری و خواب سرمایه تجهیزاتی",
    operationalImpact: "تهدید توقف بتن‌ریزی و تأخیر وابسته",
    relatedRisks: ["توقف جبهه", "افزایش هزینه عملیاتی"],
    recommendedAction:
      "بازتخصیص جرثقیل/بچینگ از پروژه‌های کم‌فشار و فعال‌سازی نگهداری پیشگیرانه.",
    historicalTrend: "بهره‌برداری ناوگان در شش هفته اخیر زیر هدف مانده است.",
    keyKpis: ["بهره‌برداری", "ساعت خواب", "هزینه اجاره", "تجهیزات بحرانی"],
    widgets: [
      { id: "e1", title: "KPI ناوگان", kind: "kpi-row", why: "سلامت بهره‌برداری", span: 2 },
      { id: "e2", title: "بهره‌برداری تجهیزات", kind: "gauge", why: "فاصله تا هدف", span: 1 },
      { id: "e3", title: "روند خواب ناوگان", kind: "line", why: "آیا خواب در حال رشد است؟", span: 1 },
      { id: "e4", title: "مقایسه بهره‌برداری", kind: "bar", why: "کدام تجهیز مشکل‌ساز است؟", span: 1 },
      { id: "e5", title: "سهم هزینه اجاره", kind: "donut", why: "هزینه کجا متمرکز است؟", span: 1 },
      { id: "e6", title: "خواب بحرانی", kind: "list", why: "صف اقدام عملیات", span: 2 },
    ],
  }),
  contractor: pack({
    aiBrief:
      "یک پیمانکار پرریسک (سازه آریا) ظرفیت زیر آستانه دارد. پرداخت مشروط و ارزیابی ماهانه جلوی خواب جبهه را می‌گیرد.",
    rootCause: ["ظرفیت ناکافی", "کیفیت ناپایدار", "وابستگی تک‌منبع"],
    financialImpact: "هزینه تأخیر ناشی از پیمانکار ضعیف روی حاشیه پروژه",
    operationalImpact: "خواب جبهه و نیاز به جایگزین اضطراری",
    relatedRisks: ["توقف اجرا", "کیفیت پایین و عدم‌انطباق"],
    recommendedAction:
      "پرداخت مشروط فعال شود و ارزیابی ظرفیت این ماه ثبت گردد.",
    historicalTrend: "امتیاز پیمانکار سازه طی سه ماه نزولی بوده است.",
    keyKpis: ["امتیاز ظرفیت", "خواب جبهه", "عدم‌انطباق مرتبط", "پرداخت مشروط"],
    widgets: [
      { id: "s1", title: "KPI پیمانکاران", kind: "kpi-row", why: "وضعیت شبکه پیمانکاران", span: 2 },
      { id: "s2", title: "رتبه‌بندی ظرفیت", kind: "bar", why: "چه کسی زیر آستانه است؟", span: 1 },
      { id: "s3", title: "روند بهره‌وری", kind: "line", why: "جهت عملکرد", span: 1 },
      { id: "s4", title: "ماتریس ریسک پیمانکار", kind: "heatmap", why: "احتمال × اثر عملیاتی", span: 2 },
      { id: "s5", title: "اولویت مداخله", kind: "list", why: "صف اقدام عملیات", span: 2 },
    ],
  }),
  procurement: pack({
    aiBrief:
      "چهار قلم بلندمدت مسیر بحرانی را تهدید می‌کنند. مداخله قبل از توقف جبهه، ارزان‌تر از بازیابی پس از توقف است.",
    rootCause: ["تأخیر تأمین‌کننده", "عدم هم‌ترازی سفارش با شناوری", "کمبود جایگزین"],
    financialImpact: "ریسک افزایش قیمت و هزینه توقف جبهه",
    operationalImpact: "تهدید توقف تولید روی مسیر بحرانی",
    relatedRisks: ["توقف جبهه", "لغزش برنامه"],
    recommendedAction:
      "تسریع سفارش فولاد مسیر بحرانی و فعال‌سازی تأمین جایگزین.",
    historicalTrend: "شمار اقلام در خطر طی ماه اخیر افزایش یافته است.",
    keyKpis: ["اقلام در خطر", "روز تا نیاز", "وضعیت سفارش", "هم‌ترازی برنامه"],
    widgets: [
      { id: "p1", title: "KPI تدارکات", kind: "kpi-row", why: "تهدید تأمین امروز", span: 2 },
      { id: "p2", title: "روز تا نیاز اقلام", kind: "bar", why: "کدام قلم فوری است؟", span: 1 },
      { id: "p3", title: "هم‌ترازی با برنامه", kind: "timeline", why: "فاصله تأمین تا نیاز", span: 1 },
      { id: "p4", title: "گرمای کمبود", kind: "heatmap", why: "کجا کمبود داغ است؟", span: 2 },
      { id: "p5", title: "اقلام بحرانی", kind: "list", why: "صف تهدید تأمین", span: 2 },
    ],
  }),
  budget: pack({
    aiBrief:
      "انحراف بودجه در سه پروژه تجمع کرده. بدون کنترل تغییر و قفل هزینه، سقف فصل شکسته می‌شود.",
    rootCause: ["دستور تغییر بدون بودجه", "برآورد اولیه ضعیف", "نشتی هزینه اجرا"],
    financialImpact: "انحراف تجمعی چند میلیارد تومانی روی سقف فصل",
    operationalImpact: "اولویت‌بندی نادرست تخصیص منابع",
    relatedRisks: ["شکست سقف بودجه", "توقف تأمین مالی"],
    recommendedAction: "قفل هزینه پروژه‌های قرمز و بازنگری دستورهای تغییر باز.",
    historicalTrend: "انحراف بودجه طی دو ماه اخیر شیب صعودی داشته است.",
    keyKpis: ["انحراف کل", "پروژه‌های قرمز", "دستور تغییر باز", "سقف باقی‌مانده"],
    widgets: [
      { id: "b1", title: "KPI بودجه", kind: "kpi-row", why: "سلامت مالی برنامه‌ای", span: 2 },
      { id: "b2", title: "روند انحراف", kind: "area", why: "جهت فشار بودجه", span: 2 },
      { id: "b3", title: "آبشار انحراف", kind: "waterfall", why: "از کجا بودجه می‌رود؟", span: 1 },
      { id: "b4", title: "سهم پروژه‌ها", kind: "treemap", why: "تمرکز انحراف", span: 1 },
      { id: "b5", title: "مقایسه پروژه‌ها", kind: "bar", why: "رتبه انحراف", span: 2 },
    ],
  }),
  workforce: pack({
    aiBrief:
      "کمبود نیروی ماهر در دو جبهه، بهره‌وری را پایین آورده. بازتخصیص از پروژه‌های کم‌فشار ضروری است.",
    rootCause: ["کمبود مهارت", "تخصیص نامتوازن", "غیبت تکراری"],
    financialImpact: "هزینه اضافه‌کاری و تأخیر وابسته",
    operationalImpact: "افت تولید روزانه و خواب تجهیزات وابسته",
    relatedRisks: ["افت کیفیت", "لغزش برنامه"],
    recommendedAction: "بازتخصیص خدمه ماهر به جبهه‌های بحرانی تا پایان هفته.",
    historicalTrend: "نرخ پر شدن پست‌های کلیدی در ماه اخیر نزولی بوده است.",
    keyKpis: ["پر بودن پست", "اضافه‌کاری", "بهره‌وری نفر", "جبهه‌های کمبود"],
    widgets: [
      { id: "w1", title: "KPI نیروی انسانی", kind: "kpi-row", why: "ظرفیت اجرایی امروز", span: 2 },
      { id: "w2", title: "روند بهره‌وری", kind: "line", why: "آیا ظرفیت در حال افت است؟", span: 1 },
      { id: "w3", title: "تخصیص بین پروژه‌ها", kind: "bar", why: "کجا کمبود است؟", span: 1 },
      { id: "w4", title: "گرمای کمبود مهارت", kind: "heatmap", why: "کدام مهارت داغ است؟", span: 2 },
      { id: "w5", title: "صف بازتخصیص", kind: "list", why: "اقدام منابع انسانی", span: 2 },
    ],
  }),
  reporting: pack({
    aiBrief:
      "گزارش هیئت‌مدیره به داده زنده وابسته است. سه شاخص حیاتی هنوز از منابع پراکنده جمع می‌شوند.",
    rootCause: ["پراکندگی منبع حقیقت", "تأخیر به‌روزرسانی", "تعریف ناهمگون شاخص"],
    financialImpact: "تصمیم دیرهنگام با هزینه فرصت بالا",
    operationalImpact: "هم‌ترازی ضعیف بین واحدها",
    relatedRisks: ["گزارش ناقص به هیئت", "تصمیم بر اساس داده کهنه"],
    recommendedAction: "این داشبورد را منبع حقیقت هفتگی هیئت قرار دهید.",
    historicalTrend: "زمان آماده‌سازی گزارش طی فصل کاهش یافته ولی هنوز دستی است.",
    keyKpis: ["آمادگی گزارش", "شاخص‌های حیاتی", "تأخیر داده", "پوشش واحدها"],
    widgets: [
      { id: "rp1", title: "KPI گزارش‌دهی", kind: "kpi-row", why: "آمادگی هیئت", span: 2 },
      { id: "rp2", title: "روند شاخص‌های حیاتی", kind: "line", why: "داستان فصل برای هیئت", span: 2 },
      { id: "rp3", title: "ترکیب پوشش داده", kind: "donut", why: "کدام واحد هنوز ضعیف است؟", span: 1 },
      { id: "rp4", title: "مقایسه واحدها", kind: "bar", why: "کیفیت گزارش‌دهی", span: 1 },
      { id: "rp5", title: "محور آماده‌سازی", kind: "timeline", why: "مسیر تا جلسه هیئت", span: 2 },
    ],
  }),
  "contract-approval": pack({
    aiBrief:
      "چند قرارداد در صف تأیید مانده‌اند. تأخیر تصویب، شروع کار و تعهدات نقد را جابه‌جا می‌کند.",
    rootCause: ["بازبینی حقوقی طولانی", "ابهام دامنه", "اولویت‌بندی ضعیف"],
    financialImpact: "از دست رفتن پنجره قیمت و هزینه فرصت شروع",
    operationalImpact: "تأخیر بسیج کارگاه",
    relatedRisks: ["لغزش شروع", "ادعاهای بعدی"],
    recommendedAction: "اولویت تصویب قراردادهای مسیر بحرانی را امروز تعیین کنید.",
    historicalTrend: "متوسط زمان تصویب در دو ماه اخیر افزایش یافته است.",
    keyKpis: ["صف تصویب", "عمر میانگین", "قراردادهای بحرانی", "ارزش در انتظار"],
    widgets: [
      { id: "ca1", title: "KPI تصویب", kind: "kpi-row", why: "فشار صف قرارداد", span: 2 },
      { id: "ca2", title: "عمر صف", kind: "bar", why: "کدام قرارداد گیر کرده؟", span: 1 },
      { id: "ca3", title: "روند زمان تصویب", kind: "line", why: "آیا صف کندتر شده؟", span: 1 },
      { id: "ca4", title: "محور تصویب", kind: "timeline", why: "ترتیب تصمیم", span: 2 },
      { id: "ca5", title: "اولویت‌ها", kind: "list", why: "صف اقدام حقوقی", span: 2 },
    ],
  }),
  hse: pack({
    aiBrief:
      "دو حادثه نزدیک در دو هفته اخیر هشدار می‌دهد. تمرکز روی جبهه‌های پرفشار جلوی حادثه واقعی را می‌گیرد.",
    rootCause: ["فشار زمانی روی ایمنی", "آموزش ناقص", "کنترل سست تجهیزات"],
    financialImpact: "ریسک توقف کار و جریمه بیمه/قانونی",
    operationalImpact: "تهدید توقف جبهه و افت روحیه",
    relatedRisks: ["حادثه جدی", "توقف پروژه"],
    recommendedAction: "بازرسی فوری جبهه‌های پرریسک و توقف کار ناایمن تا اصلاح.",
    historicalTrend: "شاخص نزدیک‌به‌حادثه در ماه اخیر صعودی بوده است.",
    keyKpis: ["نزدیک‌به‌حادثه", "روز بدون حادثه", "بازرسی‌های باز", "جبهه‌های پرریسک"],
    widgets: [
      { id: "h1", title: "KPI ایمنی", kind: "kpi-row", why: "وضعیت ایمنی امروز", span: 2 },
      { id: "h2", title: "روند نزدیک‌به‌حادثه", kind: "line", why: "آیا خطر در حال رشد است؟", span: 2 },
      { id: "h3", title: "گرمای جبهه‌ها", kind: "heatmap", why: "کجا بیشترین خطر است؟", span: 1 },
      { id: "h4", title: "سلامت ایمنی", kind: "gauge", why: "فاصله تا هدف ایمنی", span: 1 },
      { id: "h5", title: "اقدام‌های باز", kind: "list", why: "صف اصلاح ایمنی", span: 2 },
    ],
  }),
  quality: pack({
    aiBrief:
      "نرخ عدم‌انطباق در سازه آریا بالاست. اصلاح دیرهنگام هزینه دوباره‌کاری و تأخیر را چند برابر می‌کند.",
    rootCause: ["کنترل کیفیت دیرهنگام", "پیمانکار ضعیف", "مشخصات مبهم"],
    financialImpact: "هزینه دوباره‌کاری و ادعای کارفرما",
    operationalImpact: "خواب جبهه تا تأیید اصلاح",
    relatedRisks: ["رد کار", "لغزش برنامه"],
    recommendedAction: "بازرسی فوری مقاطع پرریسک و پرداخت مشروط به اصلاح.",
    historicalTrend: "عدم‌انطباق‌ها طی شش هفته اخیر تجمع کرده‌اند.",
    keyKpis: ["نرخ عدم‌انطباق", "دوباره‌کاری باز", "هزینه کیفیت", "مقاطع پرریسک"],
    widgets: [
      { id: "q1", title: "KPI کیفیت", kind: "kpi-row", why: "سلامت کیفیت اجرا", span: 2 },
      { id: "q2", title: "روند عدم‌انطباق", kind: "line", why: "جهت کیفیت", span: 1 },
      { id: "q3", title: "علل غالب", kind: "bar", why: "ریشه تکرار کجاست؟", span: 1 },
      { id: "q4", title: "سهم پروژه‌ها", kind: "donut", why: "تمرکز مشکل کیفیت", span: 1 },
      { id: "q5", title: "آبشار هزینه کیفیت", kind: "waterfall", why: "هزینه از کجا می‌آید؟", span: 1 },
      { id: "q6", title: "صف اصلاح", kind: "list", why: "اقدام کیفیت", span: 2 },
    ],
  }),
};

export function getExecutivePack(domain: ConcernDomain): ExecutiveDashboardPack {
  return packs[domain];
}

export function mergeDashboardBlueprint(
  base: DashboardBlueprint,
  domain: ConcernDomain
): DashboardBlueprint {
  const p = getExecutivePack(domain);
  return {
    ...base,
    keyKpis: p.keyKpis,
    widgets: p.widgets,
    aiBrief: p.aiBrief,
    rootCause: p.rootCause,
    financialImpact: p.financialImpact,
    operationalImpact: p.operationalImpact,
    relatedRisks: p.relatedRisks,
    recommendedAction: p.recommendedAction,
    historicalTrend: p.historicalTrend,
    departments: base.departments.map((x) =>
      x === "PMO" ? "دفتر مدیریت پروژه" : x === "HSE" ? "ایمنی" : x
    ),
  };
}
