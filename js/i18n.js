/* ==========================================================================
   Language: English (source) · Türkçe · Русский
   --------------------------------------------------------------------------
   The HTML stays English, so a crawler and a JS-less visitor get the page as
   written. Other languages are applied at the text-node level: any string
   with an entry in the dictionary is swapped, anything without one (a brand
   name, an email address, a price) is left exactly as it is.

   One dictionary, keyed by the English string — and the SAME dictionary
   answers for text the scene builds in JavaScript (option names, the order
   summary). Two mechanisms would mean two places for a translation to go
   missing; here "Bone" is one entry whether it arrives from the markup or
   from cup.js.

   The original English is parked on the node itself (__src) rather than in a
   parallel array, so switching TR → RU still translates from English and not
   from the Turkish currently on screen.
   ========================================================================== */
(function () {
  "use strict";

  var STORE = "nr-lang";
  var LANGS = ["en", "tr", "ru"];

  var DICT = {
    tr: {
      /* head */
      "Nordic Roast — order your coffee, then design the cup":
        "Nordic Roast — kahveni seç, sonra bardağını tasarla",
      "An interactive 3D coffee experience: choose your coffee, then design the cup it comes in — size, colour, sleeve and lid — rendered live in the browser.":
        "İnteraktif 3B kahve deneyimi: kahveni seç, sonra geldiği bardağı tasarla — ölçü, renk, kolluk ve kapak — tarayıcıda canlı olarak çiziliyor.",

      /* chrome */
      "Skip to content": "İçeriğe geç",
      "Order": "Sipariş",
      "Design": "Tasarla",
      "Craft": "Zanaat",
      "Visit": "Ziyaret",
      "Progress": "İlerleme",
      "Primary": "Ana menü",
      "Language": "Dil",

      /* hero */
      "Small-batch roastery · since 2019": "Küçük parti kavurma · 2019'dan beri",
      "Your coffee,": "Kahven,",
      "your cup.": "senin bardağın.",
      "Choose what you are drinking. Then design the cup it arrives in — size, colour, sleeve, lid — built in front of you in real 3D.":
        "Ne içeceğini seç. Sonra geleceği bardağı tasarla — ölçü, renk, kolluk, kapak — gözünün önünde, gerçek 3B'de kurulsun.",
      "Start your order": "Siparişe başla",
      "How we roast": "Nasıl kavuruyoruz",
      "How it works": "Nasıl çalışır",
      "Choose the coffee": "Kahveyi seç",
      "Design the cup": "Bardağı tasarla",
      "Pick it up": "Gel al",
      "Scroll": "Kaydır",

      /* 01 — the coffee */
      "01 — The coffee": "01 — Kahve",
      "What are you drinking?": "Ne içiyorsun?",
      "Six things, done properly. No syrup wall, no secret menu.":
        "Altı şey, hakkıyla. Şurup duvarı yok, gizli menü yok.",
      "Choose your coffee": "Kahveni seç",
      "Filter": "Filtre",
      "Single origin, changed weekly. Poured on the minute.":
        "Tek yöre, her hafta değişir. Dakikasında doldurulur.",
      "Hot · 350 ml": "Sıcak · 350 ml",
      "Flat white": "Flat white",
      "Double ristretto, steamed milk, no foam cap.":
        "Çift ristretto, buharlanmış süt, köpük yok.",
      "Hot · 240 ml": "Sıcak · 240 ml",
      "Cortado": "Cortado",
      "Equal parts espresso and milk. Gone before it cools.":
        "Yarı espresso yarı süt. Soğumadan biter.",
      "Hot · 150 ml": "Sıcak · 150 ml",
      "Cold brew": "Cold brew",
      "Eighteen hours in cold water. Sweet without sugar.":
        "On sekiz saat soğuk suda. Şekersiz tatlı.",
      "Iced · 400 ml": "Soğuk · 400 ml",
      "Espresso": "Espresso",
      "Two ounces, thirty seconds, no compromise.":
        "Altmış mililitre, otuz saniye, taviz yok.",
      "Hot · 60 ml": "Sıcak · 60 ml",
      "Beans, 250 g": "Çekirdek, 250 g",
      "Whole bean, roast date on the bag. Ground on request.":
        "Çekirdek hâlinde, kavurma tarihi paketin üstünde. İstersen öğütülür.",
      "At the counter": "Tezgâhta",
      "Chosen:": "Seçilen:",

      /* 02 — the cup */
      "02 — The cup": "02 — Bardak",
      "Make it yours": "Kendine göre kur",
      "Size": "Ölçü",
      "Short": "Küçük",
      "Tall": "Orta",
      "Grande": "Büyük",
      "8 oz": "240 ml",
      "12 oz": "350 ml",
      "16 oz": "470 ml",
      "Cup colour": "Bardak rengi",
      "Bone": "Kemik",
      "Sand": "Kum",
      "Clay": "Kil",
      "Sage": "Adaçayı",
      "Ink": "Mürekkep",
      "Sleeve": "Kolluk",
      "None": "Yok",
      "Kraft": "Kraft",
      "Charcoal": "Antrasit",
      "Copper": "Bakır",
      "Lid": "Kapak",
      "Open": "Açık",
      "Your order": "Siparişin",
      "%s cup": "%s bardak",
      "%s sleeve": "%s kolluk",
      "%s lid": "%s kapak",
      "No sleeve": "Kolluk yok",
      "No lid": "Kapak yok",

      /* 03 — the roast */
      "03 — The roast": "03 — Kavurma",
      "Twelve days from tree to cup.": "Ağaçtan bardağa on iki gün.",
      "We buy whole lots, not blends of leftovers. Every bag is roasted the week it ships, and the roast date is printed where the best-before date usually hides.":
        "Artıkların harmanını değil, bütün partiyi alıyoruz. Her paket sevk edildiği hafta kavruluyor; kavurma tarihi de son kullanma tarihinin saklandığı yere basılıyor.",
      "The result is coffee that still tastes like where it came from — bright in the morning, round in the afternoon.":
        "Sonuç: hâlâ geldiği yerin tadını taşıyan bir kahve — sabah parlak, öğleden sonra yuvarlak.",
      "Roasted": "Kavurma",
      "Weekly, in 12 kg batches": "Haftalık, 12 kg'lık partiler",
      "Sourcing": "Tedarik",
      "Single lots, four origins": "Tek parti, dört yöre",
      "Cups": "Bardaklar",
      "Plant-lined, home compostable": "Bitkisel kaplama, evde kompostlanabilir",

      /* footer */
      "04 — Visit": "04 — Ziyaret",
      "Open from seven, every day.": "Her gün yediden itibaren açığız.",
      "Come in, design your cup on the screen by the counter, and we will make it while you wait.":
        "Gel, tezgâhın yanındaki ekranda bardağını tasarla; sen beklerken hazırlayalım.",
      "Address": "Adres",
      "Hours": "Saatler",
      "Mon–Fri 07:00–20:00": "Pzt–Cum 07:00–20:00",
      "Sat–Sun 08:00–21:00": "Cmt–Paz 08:00–21:00",
      "Say hello": "Merhaba de",
      "Nordic Roast — a fictional brand, built as a 3D web demo.":
        "Nordic Roast — kurgusal bir marka, 3B web demosu olarak yapıldı.",
      "Built by": "Yapan:"
    },

    ru: {
      "Nordic Roast — order your coffee, then design the cup":
        "Nordic Roast — выберите кофе, потом соберите стакан",
      "An interactive 3D coffee experience: choose your coffee, then design the cup it comes in — size, colour, sleeve and lid — rendered live in the browser.":
        "Интерактивный 3D-опыт: выберите кофе, затем соберите стакан — размер, цвет, манжета и крышка — всё рисуется вживую в браузере.",

      "Skip to content": "Перейти к содержимому",
      "Order": "Заказ",
      "Design": "Дизайн",
      "Craft": "Ремесло",
      "Visit": "Визит",
      "Progress": "Прогресс",
      "Primary": "Главное меню",
      "Language": "Язык",

      "Small-batch roastery · since 2019": "Обжарка малыми партиями · с 2019",
      "Your coffee,": "Твой кофе,",
      "your cup.": "твой стакан.",
      "Choose what you are drinking. Then design the cup it arrives in — size, colour, sleeve, lid — built in front of you in real 3D.":
        "Выберите, что пьёте. Потом соберите стакан, в котором он приедет — размер, цвет, манжета, крышка — прямо на глазах, в настоящем 3D.",
      "Start your order": "Начать заказ",
      "How we roast": "Как мы обжариваем",
      "How it works": "Как это работает",
      "Choose the coffee": "Выбрать кофе",
      "Design the cup": "Собрать стакан",
      "Pick it up": "Забрать",
      "Scroll": "Листайте",

      "01 — The coffee": "01 — Кофе",
      "What are you drinking?": "Что будете пить?",
      "Six things, done properly. No syrup wall, no secret menu.":
        "Шесть позиций, сделанных как надо. Без стены сиропов и тайного меню.",
      "Choose your coffee": "Выберите кофе",
      "Filter": "Фильтр",
      "Single origin, changed weekly. Poured on the minute.":
        "Моносорт, меняется каждую неделю. Наливаем в ту же минуту.",
      "Hot · 350 ml": "Горячий · 350 мл",
      "Flat white": "Флэт уайт",
      "Double ristretto, steamed milk, no foam cap.":
        "Двойной ристретто, парное молоко, без шапки пены.",
      "Hot · 240 ml": "Горячий · 240 мл",
      "Cortado": "Кортадо",
      "Equal parts espresso and milk. Gone before it cools.":
        "Поровну эспрессо и молока. Выпивается раньше, чем остынет.",
      "Hot · 150 ml": "Горячий · 150 мл",
      "Cold brew": "Колд брю",
      "Eighteen hours in cold water. Sweet without sugar.":
        "Восемнадцать часов в холодной воде. Сладкий без сахара.",
      "Iced · 400 ml": "Холодный · 400 мл",
      "Espresso": "Эспрессо",
      "Two ounces, thirty seconds, no compromise.":
        "Шестьдесят миллилитров, тридцать секунд, без компромиссов.",
      "Hot · 60 ml": "Горячий · 60 мл",
      "Beans, 250 g": "Зерно, 250 г",
      "Whole bean, roast date on the bag. Ground on request.":
        "В зёрнах, дата обжарки на пакете. Смелем по просьбе.",
      "At the counter": "На кассе",
      "Chosen:": "Выбрано:",

      "02 — The cup": "02 — Стакан",
      "Make it yours": "Соберите свой",
      "Size": "Размер",
      "Short": "Маленький",
      "Tall": "Средний",
      "Grande": "Большой",
      "8 oz": "240 мл",
      "12 oz": "350 мл",
      "16 oz": "470 мл",
      "Cup colour": "Цвет стакана",
      "Bone": "Кость",
      "Sand": "Песок",
      "Clay": "Глина",
      "Sage": "Шалфей",
      "Ink": "Чернила",
      "Sleeve": "Манжета",
      "None": "Без",
      "Kraft": "Крафт",
      "Charcoal": "Уголь",
      "Copper": "Медь",
      "Lid": "Крышка",
      "Open": "Открытый",
      "Your order": "Ваш заказ",
      "%s cup": "Стакан: %s",
      "%s sleeve": "Манжета: %s",
      "%s lid": "Крышка: %s",
      "No sleeve": "Без манжеты",
      "No lid": "Без крышки",

      "03 — The roast": "03 — Обжарка",
      "Twelve days from tree to cup.": "Двенадцать дней от дерева до стакана.",
      "We buy whole lots, not blends of leftovers. Every bag is roasted the week it ships, and the roast date is printed where the best-before date usually hides.":
        "Мы покупаем целые лоты, а не смеси из остатков. Каждый пакет обжарен на той неделе, когда уходит, а дата обжарки напечатана там, где обычно прячут срок годности.",
      "The result is coffee that still tastes like where it came from — bright in the morning, round in the afternoon.":
        "В итоге кофе на вкус всё ещё как место, откуда он приехал — яркий утром, округлый днём.",
      "Roasted": "Обжарка",
      "Weekly, in 12 kg batches": "Еженедельно, партиями по 12 кг",
      "Sourcing": "Закуп",
      "Single lots, four origins": "Моно-лоты, четыре страны",
      "Cups": "Стаканы",
      "Plant-lined, home compostable": "Растительное покрытие, компостируется дома",

      "04 — Visit": "04 — Визит",
      "Open from seven, every day.": "Открыто с семи, каждый день.",
      "Come in, design your cup on the screen by the counter, and we will make it while you wait.":
        "Заходите, соберите свой стакан на экране у стойки — сделаем, пока вы ждёте.",
      "Address": "Адрес",
      "Hours": "Часы",
      "Mon–Fri 07:00–20:00": "Пн–Пт 07:00–20:00",
      "Sat–Sun 08:00–21:00": "Сб–Вс 08:00–21:00",
      "Say hello": "Напишите",
      "Nordic Roast — a fictional brand, built as a 3D web demo.":
        "Nordic Roast — вымышленный бренд, сделан как 3D веб-демо.",
      "Built by": "Сделал:"
    }
  };

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }

  var lang = "en";
  try {
    var saved = localStorage.getItem(STORE);
    if (LANGS.indexOf(saved) !== -1) lang = saved;
  } catch (e) { /* private mode: English it is */ }

  /* ?lang=tr wins over the remembered choice, so a link can be sent in the
     language the recipient reads. */
  var asked = new URLSearchParams(location.search).get("lang");
  if (LANGS.indexOf(asked) !== -1) lang = asked;

  function t(src) {
    if (lang === "en" || !src) return src;
    var hit = DICT[lang][norm(src)];
    return hit === undefined ? src : hit;
  }

  /* The scene builds its own strings; it asks the same dictionary. */
  window.NR = {
    lang: lang,
    t: t,
    /* Anything that renders text from JS registers here to be redrawn. */
    onChange: []
  };

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CANVAS: 1 };

  function walk(node) {
    if (node.nodeType === 3) {
      if (node.__src === undefined) node.__src = node.nodeValue;
      var out = t(node.__src);
      if (node.nodeValue !== out) node.nodeValue = out;
      return;
    }
    if (node.nodeType !== 1 || SKIP[node.tagName]) return;

    /* The colour swatches show their name through content: attr(aria-label),
       so the attribute has to be translated as well as the text. */
    ["aria-label", "title"].forEach(function (a) {
      if (!node.hasAttribute(a)) return;
      var key = "__" + a;
      if (node[key] === undefined) node[key] = node.getAttribute(a);
      node.setAttribute(a, t(node[key]));
    });

    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  function apply(next) {
    lang = window.NR.lang = next;
    document.documentElement.lang = next;

    if (document.title) {
      if (!document.__title) document.__title = document.title;
      document.title = t(document.__title);
    }
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      if (!meta.__src) meta.__src = meta.getAttribute("content");
      meta.setAttribute("content", t(meta.__src));
    }

    walk(document.body);

    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === next));
    });

    window.NR.onChange.forEach(function (fn) { fn(); });

    try { localStorage.setItem(STORE, next); } catch (e) { /* private mode */ }
  }

  function start() {
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { apply(b.dataset.lang); });
    });
    apply(lang);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
