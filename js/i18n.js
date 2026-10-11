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

  /* Rebuilt 11.10.2026 with the new copy (Moda, Istanbul): every string the
     markup or the scripts show has exactly one entry per language. */
  var DICT = {
    tr: {
      "Nordic Roast — light-roast coffee in Moda, Istanbul": "Nordic Roast — Moda’da açık kavrulmuş kahve, İstanbul",
      "A small-batch roastery and coffee bar in Moda, Kadıköy. Choose your coffee, design the cup it comes in — colour, print, sleeve, your name — live in 3D.":
        "Moda, Kadıköy’de küçük partilerle kavuran bir kahve barı. Kahveni seç, geleceği bardağı tasarla — renk, desen, kolluk, adın — canlı 3B’de.",
      "Skip to content": "İçeriğe geç",
      "Progress": "İlerleme",
      "Primary": "Ana menü",
      "Order": "Sipariş",
      "Design": "Tasarla",
      "Craft": "Zanaat",
      "Visit": "Ziyaret",
      "Sound": "Ses",
      "Language": "Dil",
      "From bean to cup": "Çekirdekten bardağa",
      "Roasted coffee beans cooling in the dark": "Karanlıkta soğuyan kavrulmuş kahve çekirdekleri",
      "The roast": "Kavurma",
      "We roast": "Moda uyurken",
      "while Moda sleeps.": "kavuruyoruz.",
      "Twelve kilos at a time, at four in the morning, before the first ferry leaves.":
        "Sabahın dördünde, on iki kiloluk partilerle — ilk vapur kalkmadan.",
      "Cooling": "Dinlenme",
      "Two minutes": "İki dakikalık",
      "of stillness.": "sessizlik.",
      "The tray turns, the crackle fades. This is where the sweetness sets.":
        "Tepsi döner, çıtırtı diner. Tatlılık tam burada oturur.",
      "The grind": "Öğütme",
      "Ground": "Siparişle",
      "to order.": "öğütülür.",
      "Never in advance. The burrs turn only once your order is in — aroma doesn’t wait.":
        "Asla önceden değil. Bıçaklar ancak siparişin gelince döner — aroma beklemez.",
      "First light": "İlk ışık",
      "Twenty grams.": "Yirmi gram.",
      "One cup.": "Tek bardak.",
      "Weighed for every cup, into a rinsed paper filter, as the first light comes in off the water.":
        "Her bardak için ayrı tartılır, ıslatılmış kâğıt filtreye — denizden ilk ışık vururken.",
      "The bloom": "Ön demleme",
      "Thirty seconds": "Otuz saniyelik",
      "of patience.": "sabır.",
      "The first water wakes the grounds. They rise, breathe out — only then do we pour the rest.":
        "İlk su kahveyi uyandırır. Kabarır, nefes verir — gerisini ancak o zaman dökeriz.",
      "Morning": "Sabah",
      "Slow,": "Yavaş,",
      "by hand.": "elle.",
      "Four minutes, one steady pour. By the time it’s ready, the street outside is awake.":
        "Dört dakika, tek ve sakin bir döküm. Hazır olduğunda sokak çoktan uyanmıştır.",
      "The pour": "Servis",
      "Poured": "Bardağında,",
      "the moment it’s yours.": "istediğin an.",
      "From the server straight into your cup, still steaming.": "Sürahiden doğrudan bardağına, dumanı hâlâ tüterken.",
      "Skip the film": "Filmi geç",
      "Moda, Istanbul · roasting since 2019": "Moda, İstanbul · 2019’dan beri kavuruyoruz",
      "Your coffee,": "Kahven,",
      "your cup.": "senin bardağın.",
      "Choose what you’re drinking. Then design the cup it comes in — colour, print, sleeve, lid, even your name — built in front of you in real 3D.":
        "Ne içeceğini seç. Sonra geleceği bardağı tasarla — renk, desen, kolluk, kapak, hatta adın — gözünün önünde, gerçek 3B’de kurulsun.",
      "Start your order": "Siparişe başla",
      "How we roast": "Nasıl kavuruyoruz",
      "How it works": "Nasıl çalışır",
      "Choose the coffee": "Kahveyi seç",
      "Design the cup": "Bardağı tasarla",
      "Pick it up": "Gel al",
      "Scroll": "Kaydır",
      "01 — The coffee": "01 — Kahve",
      "What are you drinking?": "Ne içiyorsun?",
      "Five drinks done properly, and beans to take home. No syrup wall, no secret menu.":
        "Hakkıyla yapılan beş içecek, bir de eve götürmelik çekirdek. Şurup duvarı yok, gizli menü yok.",
      "Choose your coffee": "Kahveni seç",
      "Filter": "Filtre",
      "This week’s single origin, poured to order.": "Bu haftanın tek yöre kahvesi, siparişle demlenir.",
      "Hot · 350 ml": "Sıcak · 350 ml",
      "Flat white": "Flat white",
      "Double ristretto under silky milk. No foam cap.": "Çift ristretto, ipek gibi süt. Köpük şapkası yok.",
      "Hot · 240 ml": "Sıcak · 240 ml",
      "Cortado": "Cortado",
      "Espresso and milk, half and half. Gone before it cools.": "Yarı espresso, yarı süt. Soğumadan biter.",
      "Hot · 150 ml": "Sıcak · 150 ml",
      "Cold brew": "Cold brew",
      "Eighteen hours in cold water. Sweet without sugar.": "On sekiz saat soğuk suda. Şekersiz tatlı.",
      "Iced · 400 ml": "Soğuk · 400 ml",
      "Espresso": "Espresso",
      "Eighteen grams, thirty seconds, nowhere to hide.": "On sekiz gram, otuz saniye, saklanacak yer yok.",
      "Hot · 60 ml": "Sıcak · 60 ml",
      "Beans, 250 g": "Çekirdek, 250 g",
      "This week’s roast to take home, dated on the bag.": "Bu haftanın kavrumu, eve götürmen için — tarihi paketin üstünde.",
      "Grind": "Öğütme",
      "Whole bean": "Çekirdek hâlinde",
      "Beans": "Çekirdek",
      "Ground for filter": "Filtre için öğütülmüş",
      "Ground for espresso": "Espresso için öğütülmüş",
      "Chosen:": "Seçilen:",
      "02 — The cup": "02 — Bardak",
      "Make it yours": "Kendine göre kur",
      "Cup options": "Bardak seçenekleri",
      "Size": "Ölçü",
      "Colour": "Renk",
      "Finish": "Yüzey",
      "Pattern": "Desen",
      "Sleeve": "Kolluk",
      "Lid": "Kapak",
      "Name": "İsim",
      "Extras": "Ekstralar",
      "Short": "Küçük",
      "Tall": "Orta",
      "Grande": "Büyük",
      "8 oz": "240 ml",
      "12 oz": "350 ml",
      "16 oz": "470 ml",
      "Cup colour": "Bardak rengi",
      "Chalk": "Tebeşir",
      "Bone": "Kemik",
      "Sand": "Kum",
      "Blush": "Pudra",
      "Clay": "Kil",
      "Rust": "Pas",
      "Sage": "Adaçayı",
      "Olive": "Zeytin",
      "Mist": "Sis",
      "Ink": "Mürekkep",
      "Charcoal": "Antrasit",
      "Matte": "Mat",
      "Satin": "Saten",
      "Gloss": "Parlak",
      "Plain": "Düz",
      "Pinstripe": "İnce çizgi",
      "Bands": "Bant",
      "Dots": "Puantiye",
      "Waves": "Dalga",
      "Check": "Kareli",
      "None": "Yok",
      "Kraft": "Kraft",
      "Linen": "Keten",
      "Copper": "Bakır",
      "Open": "Açık",
      "Clear": "Şeffaf",
      "Printed in a shade of your cup’s own colour · any print +0.40":
        "Bardağının kendi renginin bir tonunda basılır · her desen +0.40",
      "Name on the cup": "Bardaktaki isim",
      "Your name": "Adın",
      "Printed under the logo — up to 14 letters, free.": "Logonun altına basılır — en fazla 14 harf, ücretsiz.",
      "Milk": "Süt",
      "No milk": "Sütsüz",
      "Whole": "Tam yağlı",
      "Oat": "Yulaf",
      "Almond": "Badem",
      "Whole milk": "Tam yağlı süt",
      "Oat milk": "Yulaf sütü",
      "Almond milk": "Badem sütü",
      "Espresso shots": "Espresso shot",
      "Single shot": "Tek shot",
      "Double shot": "Çift shot",
      "Your order": "Siparişin",
      "%s cup": "%s bardak",
      "%s sleeve": "%s kolluk",
      "%s lid": "%s kapak",
      "No sleeve": "Kolluksuz",
      "No lid": "Kapaksız",
      "Place order": "Siparişi ver",
      "Drag": "Sürükle",
      "Drink": "İçecek",
      "Cup": "Bardak",
      "Sleeve & lid": "Kolluk, kapak",
      "Printed": "Baskı",
      "03 — The roast": "03 — Kavurma",
      "Never older than twelve days.": "On iki günden eski olmaz.",
      "We buy whole lots from four farms — never blends of leftovers. We roast every Monday at dawn and print the date where most bags hide the best-before.":
        "Dört çiftlikten bütün partiler alıyoruz — asla artıkların harmanını değil. Her pazartesi şafakta kavuruyor, tarihi çoğu paketin son kullanma tarihini sakladığı yere basıyoruz.",
      "So it still tastes of where it grew: bright in the morning, round by the afternoon.":
        "Bu yüzden hâlâ yetiştiği yerin tadını taşır: sabah parlak, öğleden sonra yuvarlak.",
      "Freshness": "Tazelik",
      "Today’s beans: day %s": "Bugünkü çekirdek: %s. gün",
      "How fresh the beans are, day by day: roasted on day 0, resting for three days, at their best from day 4 to day 12.":
        "Çekirdeğin gün gün tazeliği: 0. gün kavrulur, üç gün dinlenir, 4. günden 12. güne kadar en lezzetli hâlindedir.",
      "Today": "Bugün",
      "Day 0": "0. gün",
      "Roasted at dawn": "Şafakta kavrulur",
      "Days 1–3": "1–3. gün",
      "Resting — the gas settles": "Dinlenme — gazı çıkar",
      "Days 4–12": "4–12. gün",
      "At its best": "En lezzetli hâli",
      "After day 12, whatever is left goes into the cold brew.": "12. günden sonra kalan ne varsa cold brew’a gider.",
      "Roasted": "Kavurma",
      "Mondays, 12 kg at a time": "Pazartesileri, 12 kg’lık partiler",
      "Sourcing": "Tedarik",
      "Single lots, four farms": "Bütün partiler, dört çiftlik",
      "Cups": "Bardaklar",
      "Plant-lined, compostable at home": "Bitkisel kaplama, evde kompostlanır",
      "04 — Visit": "04 — Ziyaret",
      "Open from seven, every day.": "Her gün sabah yediden itibaren açığız.",
      "Come in, design your cup on the screen by the counter, and watch it being made.":
        "Gel, tezgâhın yanındaki ekranda bardağını tasarla ve hazırlanışını izle.",
      "Address": "Adres",
      "Moda, Kadıköy — İstanbul": "Moda, Kadıköy — İstanbul",
      "Hours": "Saatler",
      "Mon–Fri 07:00–20:00": "Pzt–Cum 07:00–20:00",
      "Sat–Sun 08:00–21:00": "Cmt–Paz 08:00–21:00",
      "Say hello": "Merhaba de",
      "Open now — closes %s": "Şu an açık — %s’de kapanır",
      "Closed — opens %s": "Şu an kapalı — %s’de açılır",
      "Nordic Roast is a fictional brand — a 3D web demo.": "Nordic Roast kurgusal bir marka — bir 3B web demosu.",
      "Built by": "Yapan:",
      "03 — Pick it up": "03 — Gel al",
      "Your cup is on its way.": "Bardağın hazırlanıyor.",
      "Ready at": "Hazır olacağı saat",
      "Your cup, as you designed it": "Tasarladığın bardak",
      "Total": "Toplam",
      "Preparing": "Hazırlanıyor",
      "Grinding": "Öğütülüyor",
      "Brewing": "Demleniyor",
      "Pouring": "Dökülüyor",
      "Ready": "Hazır",
      "Pick it up at the counter — Moda Cad. 112": "Tezgâhtan teslim al — Moda Cad. 112",
      "A demo — nothing is charged.": "Bu bir demo — ücret alınmaz.",
      "Done": "Tamam"
    },

    ru: {
      "Nordic Roast — light-roast coffee in Moda, Istanbul": "Nordic Roast — кофе светлой обжарки в Моде, Стамбул",
      "A small-batch roastery and coffee bar in Moda, Kadıköy. Choose your coffee, design the cup it comes in — colour, print, sleeve, your name — live in 3D.":
        "Небольшая обжарочная и кофейня в Моде, Кадыкёй. Выберите кофе и соберите стакан — цвет, узор, манжету, своё имя — вживую, в 3D.",
      "Skip to content": "Перейти к содержанию",
      "Progress": "Прогресс",
      "Primary": "Основное меню",
      "Order": "Заказ",
      "Design": "Дизайн",
      "Craft": "Ремесло",
      "Visit": "Визит",
      "Sound": "Звук",
      "Language": "Язык",
      "From bean to cup": "От зерна до чашки",
      "Roasted coffee beans cooling in the dark": "Обжаренные кофейные зёрна остывают в темноте",
      "The roast": "Обжарка",
      "We roast": "Обжариваем,",
      "while Moda sleeps.": "пока Мода спит.",
      "Twelve kilos at a time, at four in the morning, before the first ferry leaves.":
        "По двенадцать килограммов, в четыре утра — до первого парома.",
      "Cooling": "Остывание",
      "Two minutes": "Две минуты",
      "of stillness.": "тишины.",
      "The tray turns, the crackle fades. This is where the sweetness sets.":
        "Поднос вращается, треск стихает. Именно здесь закрепляется сладость.",
      "The grind": "Помол",
      "Ground": "Мелем",
      "to order.": "под заказ.",
      "Never in advance. The burrs turn only once your order is in — aroma doesn’t wait.":
        "Никогда заранее. Жернова вращаются, только когда пришёл ваш заказ, — аромат не ждёт.",
      "First light": "Первый свет",
      "Twenty grams.": "Двадцать граммов.",
      "One cup.": "Одна чашка.",
      "Weighed for every cup, into a rinsed paper filter, as the first light comes in off the water.":
        "Взвешиваем для каждой чашки, в промытый бумажный фильтр — пока с моря приходит первый свет.",
      "The bloom": "Цветение",
      "Thirty seconds": "Тридцать секунд",
      "of patience.": "терпения.",
      "The first water wakes the grounds. They rise, breathe out — only then do we pour the rest.":
        "Первая вода будит кофе. Он поднимается, выдыхает — и только тогда мы льём остальное.",
      "Morning": "Утро",
      "Slow,": "Медленно,",
      "by hand.": "вручную.",
      "Four minutes, one steady pour. By the time it’s ready, the street outside is awake.":
        "Четыре минуты, одна ровная струя. Когда кофе готов, улица уже проснулась.",
      "The pour": "Подача",
      "Poured": "Наливаем",
      "the moment it’s yours.": "в ту же минуту.",
      "From the server straight into your cup, still steaming.": "Из сервера прямо в ваш стакан — ещё горячий.",
      "Skip the film": "Пропустить фильм",
      "Moda, Istanbul · roasting since 2019": "Мода, Стамбул · обжариваем с 2019",
      "Your coffee,": "Ваш кофе,",
      "your cup.": "ваш стакан.",
      "Choose what you’re drinking. Then design the cup it comes in — colour, print, sleeve, lid, even your name — built in front of you in real 3D.":
        "Выберите напиток — и соберите для него стакан: цвет, узор, манжету, крышку, даже имя. Прямо на глазах, в настоящем 3D.",
      "Start your order": "Начать заказ",
      "How we roast": "Как мы обжариваем",
      "How it works": "Как это работает",
      "Choose the coffee": "Выберите кофе",
      "Design the cup": "Соберите стакан",
      "Pick it up": "Заберите",
      "Scroll": "Листайте",
      "01 — The coffee": "01 — Кофе",
      "What are you drinking?": "Что будете пить?",
      "Five drinks done properly, and beans to take home. No syrup wall, no secret menu.":
        "Пять напитков, сделанных как надо, и зерно с собой. Без стены сиропов и тайного меню.",
      "Choose your coffee": "Выберите кофе",
      "Filter": "Фильтр",
      "This week’s single origin, poured to order.": "Моносорт этой недели, завариваем под заказ.",
      "Hot · 350 ml": "Горячий · 350 мл",
      "Flat white": "Флэт уайт",
      "Double ristretto under silky milk. No foam cap.": "Двойной ристретто под шелковистым молоком. Без шапки пены.",
      "Hot · 240 ml": "Горячий · 240 мл",
      "Cortado": "Кортадо",
      "Espresso and milk, half and half. Gone before it cools.": "Эспрессо и молоко поровну. Выпивается раньше, чем остынет.",
      "Hot · 150 ml": "Горячий · 150 мл",
      "Cold brew": "Колд брю",
      "Eighteen hours in cold water. Sweet without sugar.": "Восемнадцать часов в холодной воде. Сладкий без сахара.",
      "Iced · 400 ml": "Холодный · 400 мл",
      "Espresso": "Эспрессо",
      "Eighteen grams, thirty seconds, nowhere to hide.": "Восемнадцать граммов, тридцать секунд — и негде спрятаться.",
      "Hot · 60 ml": "Горячий · 60 мл",
      "Beans, 250 g": "Зерно, 250 г",
      "This week’s roast to take home, dated on the bag.": "Обжарка этой недели — домой, с датой на пакете.",
      "Grind": "Помол",
      "Whole bean": "В зёрнах",
      "Beans": "Зерно",
      "Ground for filter": "Помол под фильтр",
      "Ground for espresso": "Помол под эспрессо",
      "Chosen:": "Выбрано:",
      "02 — The cup": "02 — Стакан",
      "Make it yours": "Соберите свой",
      "Cup options": "Параметры стакана",
      "Size": "Размер",
      "Colour": "Цвет",
      "Finish": "Покрытие",
      "Pattern": "Узор",
      "Sleeve": "Манжета",
      "Lid": "Крышка",
      "Name": "Имя",
      "Extras": "Добавки",
      "Short": "Маленький",
      "Tall": "Средний",
      "Grande": "Большой",
      "8 oz": "240 мл",
      "12 oz": "350 мл",
      "16 oz": "470 мл",
      "Cup colour": "Цвет стакана",
      "Chalk": "Мел",
      "Bone": "Кость",
      "Sand": "Песок",
      "Blush": "Пудра",
      "Clay": "Глина",
      "Rust": "Ржавчина",
      "Sage": "Шалфей",
      "Olive": "Олива",
      "Mist": "Туман",
      "Ink": "Чернила",
      "Charcoal": "Уголь",
      "Matte": "Матовое",
      "Satin": "Сатин",
      "Gloss": "Глянец",
      "Plain": "Без узора",
      "Pinstripe": "Тонкая полоска",
      "Bands": "Полосы",
      "Dots": "Горошек",
      "Waves": "Волны",
      "Check": "Клетка",
      "None": "Без",
      "Kraft": "Крафт",
      "Linen": "Лён",
      "Copper": "Медь",
      "Open": "Без крышки",
      "Clear": "Прозрачная",
      "Printed in a shade of your cup’s own colour · any print +0.40":
        "Печатается оттенком цвета стакана · любой узор +0.40",
      "Name on the cup": "Имя на стакане",
      "Your name": "Ваше имя",
      "Printed under the logo — up to 14 letters, free.": "Печатаем под логотипом — до 14 букв, бесплатно.",
      "Milk": "Молоко",
      "No milk": "Без молока",
      "Whole": "Цельное",
      "Oat": "Овсяное",
      "Almond": "Миндальное",
      "Whole milk": "Цельное молоко",
      "Oat milk": "Овсяное молоко",
      "Almond milk": "Миндальное молоко",
      "Espresso shots": "Порции эспрессо",
      "Single shot": "Одинарный",
      "Double shot": "Двойной",
      "Your order": "Ваш заказ",
      "%s cup": "Стакан: %s",
      "%s sleeve": "Манжета: %s",
      "%s lid": "Крышка: %s",
      "No sleeve": "Без манжеты",
      "No lid": "Без крышки",
      "Place order": "Оформить заказ",
      "Drag": "Вращайте",
      "Drink": "Напиток",
      "Cup": "Стакан",
      "Sleeve & lid": "Аксессуары",
      "Printed": "Печать",
      "03 — The roast": "03 — Обжарка",
      "Never older than twelve days.": "Не старше двенадцати дней.",
      "We buy whole lots from four farms — never blends of leftovers. We roast every Monday at dawn and print the date where most bags hide the best-before.":
        "Мы покупаем целые лоты с четырёх ферм — никаких смесей из остатков. Обжариваем каждый понедельник на рассвете и печатаем дату там, где другие прячут срок годности.",
      "So it still tastes of where it grew: bright in the morning, round by the afternoon.":
        "Поэтому он всё ещё на вкус как место, где вырос: яркий утром, округлый к полудню.",
      "Freshness": "Свежесть",
      "Today’s beans: day %s": "Сегодняшнее зерно: день %s",
      "How fresh the beans are, day by day: roasted on day 0, resting for three days, at their best from day 4 to day 12.":
        "Свежесть зерна по дням: обжарка в день 0, три дня отдыха, лучшая пора — с 4-го по 12-й день.",
      "Today": "Сегодня",
      "Day 0": "День 0",
      "Roasted at dawn": "Обжарка на рассвете",
      "Days 1–3": "Дни 1–3",
      "Resting — the gas settles": "Отдых — уходит газ",
      "Days 4–12": "Дни 4–12",
      "At its best": "Лучшая пора",
      "After day 12, whatever is left goes into the cold brew.": "После двенадцатого дня всё, что осталось, уходит в колд брю.",
      "Roasted": "Обжарка",
      "Mondays, 12 kg at a time": "По понедельникам, по 12 кг",
      "Sourcing": "Закупка",
      "Single lots, four farms": "Целые лоты, четыре фермы",
      "Cups": "Стаканы",
      "Plant-lined, compostable at home": "Растительное покрытие, компостируется дома",
      "04 — Visit": "04 — Визит",
      "Open from seven, every day.": "Открыты каждый день с семи утра.",
      "Come in, design your cup on the screen by the counter, and watch it being made.":
        "Заходите, соберите стакан на экране у стойки — и смотрите, как его готовят.",
      "Address": "Адрес",
      "Moda, Kadıköy — İstanbul": "Мода, Кадыкёй — Стамбул",
      "Hours": "Часы",
      "Mon–Fri 07:00–20:00": "Пн–Пт 07:00–20:00",
      "Sat–Sun 08:00–21:00": "Сб–Вс 08:00–21:00",
      "Say hello": "Напишите нам",
      "Open now — closes %s": "Сейчас открыто — до %s",
      "Closed — opens %s": "Сейчас закрыто — откроемся в %s",
      "Nordic Roast is a fictional brand — a 3D web demo.": "Nordic Roast — вымышленный бренд, 3D веб-демо.",
      "Built by": "Сделал:",
      "03 — Pick it up": "03 — Заберите",
      "Your cup is on its way.": "Ваш стакан уже готовят.",
      "Ready at": "Будет готов в",
      "Your cup, as you designed it": "Ваш стакан — таким, каким вы его собрали",
      "Total": "Итого",
      "Preparing": "Готовим",
      "Grinding": "Мелем",
      "Brewing": "Завариваем",
      "Pouring": "Наливаем",
      "Ready": "Готово",
      "Pick it up at the counter — Moda Cad. 112": "Заберите у стойки — Moda Cad. 112",
      "A demo — nothing is charged.": "Это демо — оплата не взимается.",
      "Done": "Хорошо"
    }
  };

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }

  /* First visit: the reader's own language if we have it. The page opts out
     of browser translation (translate="no"), so without this a Turkish or
     Russian browser would simply get English. A choice made on the switcher
     is remembered and wins from then on. */
  var lang = "en";
  var prefs = navigator.languages || [navigator.language || ""];
  for (var i = 0; i < prefs.length; i++) {
    var code = String(prefs[i]).slice(0, 2).toLowerCase();
    if (code === "en") break;
    if (LANGS.indexOf(code) !== -1) { lang = code; break; }
  }
  try {
    var saved = localStorage.getItem(STORE);
    if (LANGS.indexOf(saved) !== -1) lang = saved;
  } catch (e) { /* private mode: the browser's language it is */ }

  /* ?lang=tr wins over the remembered choice, so a link can be sent in the
     language the recipient reads. */
  var asked = new URLSearchParams(location.search).get("lang");
  if (LANGS.indexOf(asked) !== -1) lang = asked;

  function t(src) {
    if (lang === "en" || !src) return src;
    var hit = DICT[lang][norm(src)];
    if (hit === undefined) return src;
    /* keep the text node's own edge whitespace: "Chosen: " before <strong>
       came back as "Seçilen:" and the words ran together ("Seçilen:Filtre") */
    return src.match(/^\s*/)[0] + hit + src.match(/\s*$/)[0];
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
       so the attribute has to be translated as well as the text — and an
       image's alt is read aloud in place of the picture (the film's poster),
       and the name field's placeholder is the only label it shows inside. */
    ["aria-label", "title", "alt", "placeholder"].forEach(function (a) {
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
