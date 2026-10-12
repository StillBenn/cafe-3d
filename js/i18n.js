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
      "Larisel — light-roast coffee in Moda, Istanbul": "Larisel — Moda’da açık kavrulmuş kahve, İstanbul",
      "A coffee shop in Moda, Kadıköy that roasts its own beans. Choose your coffee and design its cup — colour, print, sleeve, your name — in live 3D.":
        "Moda, Kadıköy’de kendi kahvesini kavuran bir kahve dükkânı. Kahveni seç, bardağını tasarla: renk, desen, kolluk, adın — canlı 3B’de.",
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
      "The secret is": "Tadın sırrı",
      "in the roast.": "kavrumda.",
      "At 4 a.m., 12 kg at a time — small batches stay fresh.": "Sabah 04:00’te, her seferinde 12 kilo; küçük partiler taze kalır.",
      "Cooling": "Soğutma",
      "The beans cool": "İki dakikada",
      "in two minutes.": "soğutulur.",
      "Straight out of the roaster onto the cooling tray. Stopping the heat fast keeps the beans sweet, not bitter.":
        "Kavurucudan çıkar çıkmaz soğutma tepsisine. Isıyı hızla kesmek çekirdeği acı değil, tatlı tutar.",
      "The grind": "Öğütme",
      "Ground": "Sipariş gelince",
      "when you order.": "öğütülür.",
      "Ground coffee loses its aroma within minutes, so we never grind in advance.":
        "Öğütülmüş kahve kokusunu dakikalar içinde kaybeder; bu yüzden asla önceden öğütmüyoruz.",
      "Weighing": "Tartım",
      "20 grams": "Her bardağa",
      "for each cup.": "20 gram.",
      "Every cup is weighed on its own and goes into a rinsed paper filter — so it tastes of coffee, not of paper.":
        "Her bardak ayrı tartılır ve ıslatılmış kâğıt filtreye konur; kahve kâğıt değil, kahve tadında olsun diye.",
      "First pour": "İlk su",
      "A little water,": "Önce biraz su,",
      "then 30 seconds.": "sonra 30 saniye.",
      "The coffee swells and lets out its gas. Then the rest of the water goes in, evenly.":
        "Kahve kabarır ve içindeki gazı bırakır. Sonra kalan su eşit şekilde dökülür.",
      "The brew": "Demleme",
      "Brewed by hand": "Elle demlenir:",
      "in four minutes.": "dört dakika.",
      "One slow, steady pour from a kettle. No machine.": "İnce ağızlı bir demlikten yavaş ve düzenli dökülür. Makine kullanmıyoruz.",
      "The pour": "Servis",
      "Poured fresh": "Sen gelince",
      "when you arrive.": "dökülür.",
      "From the server straight into your cup, still steaming — never kept on a hot plate.":
        "Sürahiden doğrudan bardağına, dumanı tüterken. Ocak üstünde asla bekletilmez.",
      "Skip the film": "Filmi geç",
      "Chapters": "Bölümler",
      "Moda, Istanbul · roasting since 2019": "Moda, İstanbul · 2019’dan beri kavuruyoruz",
      "Pick a coffee,": "Kahveni seç,",
      "design the cup.": "bardağı tasarla.",
      "Choose from five drinks, then the colour, print, sleeve and lid of your cup — even your name on it. You see every choice in 3D as you make it.":
        "Beş içecekten birini, sonra bardağının rengini, desenini, kolluğunu ve kapağını seç; istersen adını da bastır. Her seçimini anında 3B görürsün.",
      "Start your order": "Siparişe başla",
      "How we roast": "Nasıl kavuruyoruz",
      "How it works": "Nasıl çalışır",
      "Choose the coffee": "Kahveyi seç",
      "Design the cup": "Bardağı tasarla",
      "Pick it up": "Teslim al",
      "Scroll": "Kaydır",
      "01 — The coffee": "01 — Kahve",
      "What are you drinking?": "Ne içmek istersin?",
      "Five drinks to choose from — and fresh beans to take home, if you like.":
        "Beş içecekten birini seç. İstersen eve götürmek için taze çekirdek de ekle.",
      "Choose your coffee": "Kahveni seç",
      "Filter": "Filtre",
      "This week’s single origin, brewed by hand to order.": "Bu haftanın tek kökenli kahvesi, siparişle elde demlenir.",
      "Hot · 350 ml": "Sıcak · 350 ml",
      "Flat white": "Flat white",
      "A double ristretto under silky steamed milk, without a foam cap.":
        "Çift ristretto ve ipek gibi buharlanmış süt; üstünde köpük tepesi yok.",
      "Hot · 240 ml": "Sıcak · 240 ml",
      "Cortado": "Cortado",
      "Espresso and warm milk in equal parts. Small, strong, and quickly finished.":
        "Eşit ölçüde espresso ve ılık süt. Küçük, sert ve çabuk biter.",
      "Hot · 150 ml": "Sıcak · 150 ml",
      "Cold brew": "Cold brew",
      "Steeped eighteen hours in cold water — naturally sweet, no sugar needed.":
        "On sekiz saat soğuk suda demlenir; şekere gerek kalmadan doğal olarak tatlı.",
      "Iced · 400 ml": "Soğuk · 400 ml",
      "Espresso": "Espresso",
      "Eighteen grams, thirty seconds. Nothing added — so the coffee itself has to be excellent.":
        "On sekiz gram, otuz saniye. İçine hiçbir şey eklenmez; bu yüzden kahvenin kendisi mükemmel olmalı.",
      "Hot · 60 ml": "Sıcak · 60 ml",
      "Beans, 250 g": "Çekirdek, 250 g",
      "This week’s roast for home, with the roast date printed on the bag.":
        "Bu haftanın kavrumu evin için; kavrum tarihi paketin üstünde yazılı.",
      "Grind": "Öğütme",
      "Whole bean": "Çekirdek hâlinde",
      "Beans": "Çekirdek",
      "Ground for filter": "Filtre için öğütülmüş",
      "Ground for espresso": "Espresso için öğütülmüş",
      "Chosen:": "Seçilen:",
      "02 — The cup": "02 — Bardak",
      "Design your cup": "Bardağını tasarla",
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
      "To go": "Götür",
      "For here": "Burada",
      "To go or for here": "Götür ya da burada",
      "Custom": "Özel",
      "Pick a colour": "Renk seç",
      "Coffee beans": "Kahve çekirdeği",
      "Tulip": "Lale",
      "Gulls": "Martı",
      "Ferry": "Vapur",
      "Skyline": "Silüet",
      "Five Istanbul prints · any print +0.40": "Beş İstanbul deseni · her desen +0.40",
      "Cork": "Mantar",
      "%s mug": "%s fincan",
      "Mug": "Fincan",
      "Welcome back — your usual:": "Tekrar hoş geldin — her zamankin:",
      "Order it again": "Tekrar sipariş ver",
      "Share this cup": "Bu bardağı paylaş",
      "Share": "Paylaş",
      "My cup at Larisel": "Larisel’deki bardağım",
      "Link copied — send it to anyone": "Link kopyalandı — istediğine gönder",
      "Pick-up time": "Teslim saati",
      "in %s min": "%s dk sonra",
      "%s of 10 stamps — the tenth cup is on us": "10 damgadan %s — onuncu bardak bizden",
      "Your tenth cup — this one is on us": "Onuncu bardağın — bu bizden",
      "Save a picture for your story": "Hikâyen için görsel kaydet",
      "MODA · ISTANBUL": "MODA · İSTANBUL",
      "Designed at larisel.com/cafe-3d": "larisel.com/cafe-3d'de tasarlandı",
      "Saved — ready for your story": "Kaydedildi — hikâyen için hazır",
      "03 — The roast": "03 — Kavurma",
      "Our beans are never more than 12 days old.": "Çekirdeklerimiz hiçbir zaman 12 günden eski değil.",
      "We buy whole harvests from four farms we know by name — no anonymous blends. We roast every Monday morning and print the roast date on the front of the bag.":
        "Adını bildiğimiz dört çiftliğin bütün hasadını alıyoruz; kimden geldiği belirsiz karışımlar değil. Her pazartesi sabahı kavuruyor, kavurma tarihini paketin ön yüzüne basıyoruz.",
      "Fresh beans keep their natural fruit and sweetness — not just bitterness.":
        "Taze çekirdek doğal meyve ve tatlılık tadını korur; yalnızca acı olmaz.",
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
      "Four farms, whole harvests": "Dört çiftlik, bütün hasat",
      "Cups": "Bardaklar",
      "Plant-lined, compostable at home": "Bitkisel kaplama, evde kompostlanır",
      "04 — Visit": "04 — Ziyaret",
      "Open every day — from 7 a.m. on weekdays.": "Her gün açığız — hafta içi sabah 7’den itibaren.",
      "Come in, design your cup on the screen by the counter, and watch it being made.":
        "Gel, tezgâhın yanındaki ekranda bardağını tasarla ve hazırlanışını izle.",
      "Address": "Adres",
      "Moda, Kadıköy — İstanbul": "Moda, Kadıköy — İstanbul",
      "Get directions": "Yol tarifi al",
      "A mug needs no sleeve — choose “To go” for one.": "Fincana kolluk gerekmez — kolluk için “Götür”ü seç.",
      "A mug needs no lid — choose “To go” for one.": "Fincana kapak gerekmez — kapak için “Götür”ü seç.",
      "KADIKÖY": "KADIKÖY",
      "MODA": "MODA",
      "MARMARA": "MARMARA",
      "Map: Moda Cad. 112, Moda, Kadıköy, on the Marmara shore": "Harita: Moda Cad. 112, Moda, Kadıköy, Marmara kıyısında",
      "Hours": "Saatler",
      "Mon–Fri 07:00–20:00": "Pzt–Cum 07:00–20:00",
      "Sat–Sun 08:00–21:00": "Cmt–Paz 08:00–21:00",
      "Write to us": "Bize yaz",
      "Open now — closes %s": "Şu an açık — %s’de kapanır",
      "Closed — opens %s": "Şu an kapalı — %s’de açılır",
      "This café is a demo, not a real shop — nothing is charged.": "Bu kafe bir demo, gerçek bir dükkân değil; ücret alınmaz.",
      "Built by": "Yapan:",
      "03 — Pick it up": "03 — Teslim al",
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
      "Done": "Tamam",
      "Table": "Masa",
      "Call a waiter": "Garson çağır",
      "On the way": "Geliyor",
      "Bill": "Hesap",
      "Served at your table, in a ceramic cup.": "Masana servis — seramik fincanda.",
      "At the table it comes in a ceramic cup — no sleeve needed.": "Masada seramik fincanda gelir — kolluğa gerek yok.",
      "At the table it comes in a ceramic cup — no lid needed.": "Masada seramik fincanda gelir — kapağa gerek yok.",
      "We bring it to your table as soon as it is ready.": "Hazır olunca masana getiriyoruz.",
      "QR code: order from table %s": "QR kod: %s numaralı masadan sipariş",
      "At the table": "Masada",
      "Order from your table.": "Masandan sipariş ver.",
      "Try table mode": "Masa modunu dene",
      "The bill": "Hesap",
      "Close": "Kapat",
      "Nothing ordered from this table yet.": "Bu masadan henüz sipariş verilmedi.",
      "Order a coffee": "Kahve söyle",
      "Split": "Bölüşüm",
      "Split the bill": "Hesabı böl",
      "One bill": "Tek hesap",
      "Each pays their own": "Herkes kendi payını",
      "Evenly": "Eşit",
      "Pay": "Ödeme",
      "Pay by": "Ödeme şekli",
      "Card, at the table": "Masada kartla",
      "Cash": "Nakit",
      "Ask for the bill": "Hesabı iste",
      "The bill is on its way": "Hesap geliyor",
      "A waiter is coming to table %s": "Garson %s numaralı masaya geliyor",
      "Coffee": "Kahve",
      "Orders without a name": "İsimsiz siparişler",
      "One person fewer": "Bir kişi eksilt",
      "One person more": "Bir kişi ekle",
      "%s people": "%s kişi",
      "Each pays": "Kişi başı",
      "The bill is coming to table %s — card reader included": "Hesap %s numaralı masaya geliyor — kart makinesiyle birlikte",
      "The bill is coming to table %s": "Hesap %s numaralı masaya geliyor",
      "After the last sip": "Son yudumdan sonra",
      "Read your coffee cup.": "Kahve falına bak.",
      "An Istanbul tradition: after a Turkish coffee, the grounds left in the cup are read like a fortune. Make a wish and turn the cup over — or upload a photo of your own cup, and we read the shapes.":
        "Bir İstanbul geleneği: Türk kahvesinden sonra fincanda kalan telveye fal bakılır. Niyet tut ve fincanı kapat ya da kendi fincanının fotoğrafını yükle; şekilleri biz okuyalım.",
      "Read my cup": "Falıma bak",
      "After the last sip: turn your cup over": "Son yudumdan sonra: fincanını kapat",
      "A coffee reading.": "Kahve falı.",
      "“Don’t believe in fortunes — but don’t go without one.”": "“Fala inanma, falsız da kalma.”",
      "Just for fun — an Istanbul custom, read by a website.": "Sadece eğlence için: bir İstanbul âdeti, bir web sitesi okudu.",
      "Turn the cup over": "Fincanı kapat",
      "Let it cool. The grounds are settling.": "Soğumasını bekle. Telve yerine oturuyor.",
      "Lift the cup": "Fincanı kaldır",
      "It has cooled. Lift the cup — gently.": "Soğudu. Fincanı kaldır — yavaşça.",
      "By the handle": "Kulpa yakın",
      "about you, and your home": "seninle ve evinle ilgili",
      "Near the rim": "Ağza yakın",
      "soon": "yakında",
      "Down in the cup": "Fincanın dibinde",
      "in time, or from the past": "zamanla ya da geçmişten",
      "Bird": "Kuş",
      "Fish": "Balık",
      "Road": "Yol",
      "Heart": "Kalp",
      "Key": "Anahtar",
      "Tree": "Ağaç",
      "Eye": "Göz",
      "Ring": "Yüzük",
      "Mountain": "Dağ",
      "House": "Ev",
      "Crescent": "Hilal",
      "Star": "Yıldız",
      "This browser cannot show the 3D cup.": "Bu tarayıcı 3B fincanı gösteremiyor.",
      "Make a wish. Then turn the cup over onto its saucer — or upload a photo of your own cup.":
        "Bir niyet tut. Sonra fincanı tabağına kapat ya da kendi fincanının fotoğrafını yükle.",
      "We could not see the coffee grounds. Take the photo from straight above, in good light, with the cup filling the frame.":
        "Telveyi göremedik. Fotoğrafı tam yukarıdan, iyi ışıkta ve fincan kadrajı dolduracak şekilde çek.",
      "Reading the grounds in your photo…": "Fotoğraftaki telveyi okuyoruz…",
      "This photo could not be opened — try a JPG or PNG.": "Bu fotoğraf açılamadı. JPG ya da PNG bir fotoğraf dene.",
      "Upload a photo of my cup": "Fincanımın fotoğrafını yükle",
      "Shoot from straight above, handle on the right, the cup filling the frame. Your photo stays on your device.":
        "Tam yukarıdan, kulp sağda ve fincan kadrajı dolduracak şekilde çek. Fotoğrafın cihazından çıkmaz.",
      "Your cup, from your photo": "Fotoğrafındaki fincan",
      "The reading, step by step": "Fal, adım adım",
      "Wish": "Niyet",
      "Turn": "Kapat",
      "Cool": "Soğut",
      "Read": "Oku",
      "Read another cup": "Başka bir fincana bak",
      "%s, here is what your cup says.": "%s, bak fincanın ne söylüyor.",
      "Here is what your cup says.": "Bak, fincanın ne söylüyor.",
      "Your cup is crowded — a lot on your mind lately. The good news: most of it is about to settle.":
        "Fincanın kalabalık; son günlerde kafan epey dolu. İyi haber şu: çoğu yerine oturmak üzere.",
      "Your cup is lively but clear — busy days, and an open road.": "Fincanın hareketli ama açık: günlerin dolu, yolun açık.",
      "Your cup is light and open — you carry less than you think, and things are clearing.":
        "Fincanın ferah; yükün sandığından hafif, ortalık da durulmak üzere.",
      "News": "Haber",
      "Kısmet": "Kısmet",
      "Journey": "Yolculuk",
      "Love": "Aşk",
      "A way through": "Çözüm",
      "Health": "Sağlık",
      "The evil eye": "Nazar",
      "A promise": "Söz",
      "Effort": "Emek",
      "Home": "Yuva",
      "Your wish": "Niyetin",
      "Luck": "Şans",
      "A bird carries news. It is coming from someone far away, and it is good — answer it when it arrives; it opens a door.":
        "Kuş haber getirir. Uzaklardan biri sana ulaşacak ve getirdiği iyi bir haber; geldiğinde cevapsız bırakma, bir kapı aralıyor.",
      "The fish is kısmet: plenty from a direction you are not watching. Money or an offer — say yes before you overthink it.":
        "Balık kısmettir: hiç bakmadığın bir yönden bereket geliyor. Para da olabilir, bir teklif de; fazla düşünmeden evet de.",
      "A road opens in the grounds. A trip is near — short, maybe just across the Bosphorus — and something you need is at the other end of it.":
        "Telvede bir yol açılmış. Yakında bir yolculuk var; kısa, belki sadece Boğaz'ın karşı yakasına. Aradığın bir şey o yolun sonunda seni bekliyor.",
      "A heart, clear as a drawing. Someone thinks of you more than they let on; a small gesture from you will be enough.":
        "Çizilmiş gibi net bir kalp. Biri seni belli ettiğinden çok düşünüyor; senden gelecek küçük bir jest yetecek.",
      "A key: a matter you thought was locked is about to open. The answer is simpler than it looked — ask once more.":
        "Anahtar: kilitli sandığın bir iş açılmak üzere. Çözüm göründüğünden basit; bir kez daha sor.",
      "A tree with its roots in the grounds — health, and quiet. You are putting down roots somewhere; let them take their time.":
        "Kökü telvede bir ağaç: sağlık ve huzur. Bir yere kök salıyorsun; bırak acele etmesin.",
      "An eye: nazar. Someone is watching your good luck a little too closely. Keep your plans to yourself for a while, and a blue bead in your pocket.":
        "Bir göz: nazar var. Biri şansına biraz fazla dikkatle bakıyor. Planlarını bir süre kendine sakla, cebine de bir mavi boncuk koy.",
      "A ring: a promise. One will be made to you, or one you made will finally be kept — either way, it binds you to something good.":
        "Yüzük bir sözdür. Ya sana verilecek, ya da verdiğin bir söz sonunda tutulacak; iki durumda da seni iyi bir şeye bağlıyor.",
      "A mountain stands in the way, but look closer: the path goes over it, not around. It will take effort, and it will be worth it.":
        "Önünde bir dağ var, ama dikkatli bak: yol etrafından değil, üstünden geçiyor. Emek isteyecek ve değecek.",
      "A house: a change at home. A move, a new face at the table, or a room you finally make your own — it lets the light in.":
        "Ev: yuvanda bir değişiklik var. Bir taşınma, sofrana yeni bir yüz ya da sonunda kendine ait kıldığın bir oda; içeri ışık giriyor.",
      "A crescent, the sign of a wish. The one you made at the start of this cup will come — not today, but it is on its way.":
        "Hilal, niyetin işaretidir. Bu fincanın başında tuttuğun niyet olacak; bugün değil, ama yolda.",
      "A star: luck is on your side this week. Whatever you have been putting off, begin it now.":
        "Yıldız: bu hafta şans senden yana. Ertelediğin ne varsa şimdi başla.",
      "Yes — it will happen. The %s in your cup says so.": "Olacak. Fincanındaki %s bunu söylüyor.",
      "It will happen, but not on its own. Ask again in three days.": "Olacak, ama kendiliğinden değil. Üç gün sonra yeniden sor.",
      "The cup is on your side — give it a little time.": "Fincan senden yana; biraz zaman ver.",
      "When?": "Ne zaman?",
      "Within three: three days, three weeks or three months. The cup never says which.":
        "Üç vakte kadar: üç gün, üç hafta ya da üç ay. Hangisi olduğunu fincan hiçbir zaman söylemez.",
      "Leave table mode": "Masa modundan çık",
      "Every table has its own QR code.": "Her masanın kendi QR kodu var.",
      "Every table has its own QR code. Scan it with your phone to order from table %s, call a waiter or ask for the bill — and split it.":
        "Her masanın kendi QR kodu var. Telefonunla okut; %s numaralı masadan sipariş ver, garson çağır ya da hesabı iste ve böl.",
      "Choose a table": "Masa seç",
      "Previous table": "Önceki masa",
      "Next table": "Sonraki masa",
      "Larisel — roasted coffee beans in the dark: pick a coffee, design the cup.":
        "Larisel — karanlıkta kavrulmuş kahve çekirdekleri: kahveni seç, bardağı tasarla.",
      "N": "K",
      "200 m": "200 m"
    },

    ru: {
      "Larisel — light-roast coffee in Moda, Istanbul": "Larisel — кофе светлой обжарки в Моде, Стамбул",
      "A coffee shop in Moda, Kadıköy that roasts its own beans. Choose your coffee and design its cup — colour, print, sleeve, your name — in live 3D.":
        "Кофейня в Моде (Кадыкёй), которая сама обжаривает зерно. Выберите кофе и оформите стакан — цвет, узор, манжета, ваше имя — в живом 3D.",
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
      "The secret is": "Весь вкус —",
      "in the roast.": "в обжарке.",
      "At 4 a.m., 12 kg at a time — small batches stay fresh.": "В 4 утра, по 12 кг за раз: маленькие партии остаются свежими.",
      "Cooling": "Охлаждение",
      "The beans cool": "Зерно остывает",
      "in two minutes.": "за две минуты.",
      "Straight out of the roaster onto the cooling tray. Stopping the heat fast keeps the beans sweet, not bitter.":
        "Сразу из ростера — на охлаждающий поднос. Быстро остановленный жар сохраняет зерну сладость, а не горечь.",
      "The grind": "Помол",
      "Ground": "Мелем",
      "when you order.": "под заказ.",
      "Ground coffee loses its aroma within minutes, so we never grind in advance.":
        "Молотый кофе теряет аромат за считаные минуты, поэтому мы никогда не мелем заранее.",
      "Weighing": "Взвешивание",
      "20 grams": "20 граммов",
      "for each cup.": "на стакан.",
      "Every cup is weighed on its own and goes into a rinsed paper filter — so it tastes of coffee, not of paper.":
        "Каждая порция взвешивается отдельно и идёт в промытый бумажный фильтр — чтобы кофе был на вкус кофе, а не бумаги.",
      "First pour": "Первая вода",
      "A little water,": "Немного воды,",
      "then 30 seconds.": "и 30 секунд.",
      "The coffee swells and lets out its gas. Then the rest of the water goes in, evenly.":
        "Кофе набухает и выпускает газ. Затем равномерно вливаем остальную воду.",
      "The brew": "Заваривание",
      "Brewed by hand": "Вручную",
      "in four minutes.": "за 4 минуты.",
      "One slow, steady pour from a kettle. No machine.": "Медленно и ровно льём из чайника. Без кофемашины.",
      "The pour": "Подача",
      "Poured fresh": "Наливаем",
      "when you arrive.": "при вас.",
      "From the server straight into your cup, still steaming — never kept on a hot plate.":
        "Из сервера прямо в вашу чашку, ещё горячий, — никогда не стоит на подогреве.",
      "Skip the film": "Пропустить фильм",
      "Chapters": "Главы",
      "Moda, Istanbul · roasting since 2019": "Мода, Стамбул · обжариваем с 2019",
      "Pick a coffee,": "Кофе на выбор,",
      "design the cup.": "стакан — ваш.",
      "Choose from five drinks, then the colour, print, sleeve and lid of your cup — even your name on it. You see every choice in 3D as you make it.":
        "Выберите один из пяти напитков, затем цвет, узор, манжету и крышку стакана — и даже своё имя на нём. Каждый выбор сразу виден в 3D.",
      "Start your order": "Начать заказ",
      "How we roast": "Как мы обжариваем",
      "How it works": "Как это работает",
      "Choose the coffee": "Выберите кофе",
      "Design the cup": "Соберите стакан",
      "Pick it up": "Заберите",
      "Scroll": "Листайте",
      "01 — The coffee": "01 — Кофе",
      "What are you drinking?": "Что будете пить?",
      "Five drinks to choose from — and fresh beans to take home, if you like.":
        "Пять напитков на выбор — и, если хотите, свежее зерно домой.",
      "Choose your coffee": "Выберите кофе",
      "Filter": "Фильтр",
      "This week’s single origin, brewed by hand to order.": "Моносорт этой недели, завариваем вручную под заказ.",
      "Hot · 350 ml": "Горячий · 350 мл",
      "Flat white": "Флэт уайт",
      "A double ristretto under silky steamed milk, without a foam cap.":
        "Двойной ристретто под шелковистым молоком, без шапки пены.",
      "Hot · 240 ml": "Горячий · 240 мл",
      "Cortado": "Кортадо",
      "Espresso and warm milk in equal parts. Small, strong, and quickly finished.":
        "Эспрессо и тёплое молоко поровну. Маленький, крепкий, выпивается быстро.",
      "Hot · 150 ml": "Горячий · 150 мл",
      "Cold brew": "Колд брю",
      "Steeped eighteen hours in cold water — naturally sweet, no sugar needed.":
        "Восемнадцать часов в холодной воде — сладкий сам по себе, без сахара.",
      "Iced · 400 ml": "Холодный · 400 мл",
      "Espresso": "Эспрессо",
      "Eighteen grams, thirty seconds. Nothing added — so the coffee itself has to be excellent.":
        "18 граммов, 30 секунд. Без добавок — поэтому сам кофе должен быть отличным.",
      "Hot · 60 ml": "Горячий · 60 мл",
      "Beans, 250 g": "Зерно, 250 г",
      "This week’s roast for home, with the roast date printed on the bag.":
        "Обжарка этой недели — домой, с датой обжарки на пачке.",
      "Grind": "Помол",
      "Whole bean": "В зёрнах",
      "Beans": "Зерно",
      "Ground for filter": "Помол под фильтр",
      "Ground for espresso": "Помол под эспрессо",
      "Chosen:": "Выбрано:",
      "02 — The cup": "02 — Стакан",
      "Design your cup": "Оформите стакан",
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
      "To go": "С собой",
      "For here": "Здесь",
      "To go or for here": "С собой или здесь",
      "Custom": "Свой",
      "Pick a colour": "Выберите цвет",
      "Coffee beans": "Кофейные зёрна",
      "Tulip": "Тюльпан",
      "Gulls": "Чайки",
      "Ferry": "Паром",
      "Skyline": "Силуэт города",
      "Five Istanbul prints · any print +0.40": "Пять стамбульских узоров · +0.40",
      "Cork": "Пробка",
      "%s mug": "Кружка: %s",
      "Mug": "Кружка",
      "Welcome back — your usual:": "С возвращением — как обычно:",
      "Order it again": "Заказать снова",
      "Share this cup": "Поделиться стаканом",
      "Share": "Поделиться",
      "My cup at Larisel": "Мой стакан в Larisel",
      "Link copied — send it to anyone": "Ссылка скопирована — отправьте кому угодно",
      "Pick-up time": "Время выдачи",
      "in %s min": "через %s мин",
      "%s of 10 stamps — the tenth cup is on us": "%s из 10 штампов — десятый стакан за наш счёт",
      "Your tenth cup — this one is on us": "Ваш десятый стакан — за наш счёт",
      "Save a picture for your story": "Сохранить картинку для сторис",
      "MODA · ISTANBUL": "МОДА · СТАМБУЛ",
      "Designed at larisel.com/cafe-3d": "Создано на larisel.com/cafe-3d",
      "Saved — ready for your story": "Сохранено — готово для сторис",
      "03 — The roast": "03 — Обжарка",
      "Our beans are never more than 12 days old.": "Нашему зерну никогда не больше 12 дней.",
      "We buy whole harvests from four farms we know by name — no anonymous blends. We roast every Monday morning and print the roast date on the front of the bag.":
        "Мы покупаем урожай целиком у четырёх ферм, которые знаем по именам, — никаких безымянных смесей. Обжариваем каждый понедельник утром и печатаем дату обжарки на лицевой стороне пачки.",
      "Fresh beans keep their natural fruit and sweetness — not just bitterness.":
        "Свежее зерно сохраняет естественный фруктовый и сладкий вкус, а не только горечь.",
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
      "Four farms, whole harvests": "Четыре фермы, урожай целиком",
      "Cups": "Стаканы",
      "Plant-lined, compostable at home": "Растительное покрытие, компостируется дома",
      "04 — Visit": "04 — Визит",
      "Open every day — from 7 a.m. on weekdays.": "Открыты каждый день — в будни с 7 утра.",
      "Come in, design your cup on the screen by the counter, and watch it being made.":
        "Заходите, соберите стакан на экране у стойки — и смотрите, как его готовят.",
      "Address": "Адрес",
      "Moda, Kadıköy — İstanbul": "Мода, Кадыкёй — Стамбул",
      "Get directions": "Проложить маршрут",
      "A mug needs no sleeve — choose “To go” for one.": "Кружке манжета не нужна — выберите «С собой».",
      "A mug needs no lid — choose “To go” for one.": "Кружке крышка не нужна — выберите «С собой».",
      "KADIKÖY": "КАДЫКЁЙ",
      "MODA": "МОДА",
      "MARMARA": "МРАМОРНОЕ МОРЕ",
      "Map: Moda Cad. 112, Moda, Kadıköy, on the Marmara shore": "Карта: Moda Cad. 112, Мода, Кадыкёй, на берегу Мраморного моря",
      "Hours": "Часы",
      "Mon–Fri 07:00–20:00": "Пн–Пт 07:00–20:00",
      "Sat–Sun 08:00–21:00": "Сб–Вс 08:00–21:00",
      "Write to us": "Напишите нам",
      "Open now — closes %s": "Сейчас открыто — до %s",
      "Closed — opens %s": "Сейчас закрыто — откроемся в %s",
      "This café is a demo, not a real shop — nothing is charged.": "Это демо-кафе, а не настоящая кофейня: оплата не взимается.",
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
      "Done": "Хорошо",
      "Table": "Стол",
      "Call a waiter": "Официант",
      "On the way": "Уже идёт",
      "Bill": "Счёт",
      "Served at your table, in a ceramic cup.": "Подаём к столу — в керамической чашке.",
      "At the table it comes in a ceramic cup — no sleeve needed.": "За столом — в керамической чашке, манжета не нужна.",
      "At the table it comes in a ceramic cup — no lid needed.": "За столом — в керамической чашке, крышка не нужна.",
      "We bring it to your table as soon as it is ready.": "Принесём к вашему столу, как только будет готово.",
      "QR code: order from table %s": "QR-код: заказ со стола %s",
      "At the table": "За столом",
      "Order from your table.": "Заказ прямо со стола.",
      "Try table mode": "Попробовать режим стола",
      "The bill": "Счёт",
      "Close": "Закрыть",
      "Nothing ordered from this table yet.": "С этого стола ещё ничего не заказано.",
      "Order a coffee": "Заказать кофе",
      "Split": "Разделить",
      "Split the bill": "Разделить счёт",
      "One bill": "Один счёт",
      "Each pays their own": "Каждый за себя",
      "Evenly": "Поровну",
      "Pay": "Оплата",
      "Pay by": "Способ оплаты",
      "Card, at the table": "Картой за столом",
      "Cash": "Наличными",
      "Ask for the bill": "Попросить счёт",
      "The bill is on its way": "Счёт уже несут",
      "A waiter is coming to table %s": "Официант уже идёт к столу %s",
      "Coffee": "Кофе",
      "Orders without a name": "Заказы без имени",
      "One person fewer": "На одного меньше",
      "One person more": "На одного больше",
      "%s people": "%s чел.",
      "Each pays": "С каждого",
      "The bill is coming to table %s — card reader included": "Счёт несут к столу %s — вместе с терминалом",
      "The bill is coming to table %s": "Счёт несут к столу %s",
      "After the last sip": "После последнего глотка",
      "Read your coffee cup.": "Гадание на кофейной гуще.",
      "An Istanbul tradition: after a Turkish coffee, the grounds left in the cup are read like a fortune. Make a wish and turn the cup over — or upload a photo of your own cup, and we read the shapes.":
        "Стамбульская традиция: после турецкого кофе гадают по гуще, оставшейся в чашке. Загадайте желание и переверните чашку — или загрузите фото своей чашки, а мы прочтём фигуры.",
      "Read my cup": "Погадать на кофе",
      "After the last sip: turn your cup over": "После последнего глотка: переверните чашку",
      "A coffee reading.": "Гадание на кофейной гуще.",
      "“Don’t believe in fortunes — but don’t go without one.”": "«Гаданию не верь, но и без гадания не оставайся.»",
      "Just for fun — an Istanbul custom, read by a website.": "Просто для развлечения: стамбульский обычай в исполнении сайта.",
      "Turn the cup over": "Перевернуть чашку",
      "Let it cool. The grounds are settling.": "Дайте ей остыть. Гуща оседает.",
      "Lift the cup": "Поднять чашку",
      "It has cooled. Lift the cup — gently.": "Остыла. Поднимите чашку — бережно.",
      "By the handle": "У ручки",
      "about you, and your home": "о вас и вашем доме",
      "Near the rim": "У края",
      "soon": "скоро",
      "Down in the cup": "На дне чашки",
      "in time, or from the past": "со временем или из прошлого",
      "Bird": "Птица",
      "Fish": "Рыба",
      "Road": "Дорога",
      "Heart": "Сердце",
      "Key": "Ключ",
      "Tree": "Дерево",
      "Eye": "Глаз",
      "Ring": "Кольцо",
      "Mountain": "Гора",
      "House": "Дом",
      "Crescent": "Полумесяц",
      "Star": "Звезда",
      "This browser cannot show the 3D cup.": "Этот браузер не может показать 3D-чашку.",
      "Make a wish. Then turn the cup over onto its saucer — or upload a photo of your own cup.":
        "Загадайте желание. Затем переверните чашку на блюдце — или загрузите фото своей чашки.",
      "We could not see the coffee grounds. Take the photo from straight above, in good light, with the cup filling the frame.":
        "Не удалось разглядеть гущу. Снимите сверху, при хорошем свете, чтобы чашка заполнила кадр.",
      "Reading the grounds in your photo…": "Читаем гущу на вашем фото…",
      "This photo could not be opened — try a JPG or PNG.": "Не удалось открыть фото — попробуйте JPG или PNG.",
      "Upload a photo of my cup": "Загрузить фото чашки",
      "Shoot from straight above, handle on the right, the cup filling the frame. Your photo stays on your device.":
        "Снимайте сверху: ручка справа, чашка на весь кадр. Фото остаётся на вашем устройстве.",
      "Your cup, from your photo": "Ваша чашка на фото",
      "The reading, step by step": "Гадание, шаг за шагом",
      "Wish": "Желание",
      "Turn": "Переверните",
      "Cool": "Остудите",
      "Read": "Прочтите",
      "Read another cup": "Погадать ещё раз",
      "%s, here is what your cup says.": "%s, вот что говорит ваша чашка.",
      "Here is what your cup says.": "Вот что говорит ваша чашка.",
      "Your cup is crowded — a lot on your mind lately. The good news: most of it is about to settle.":
        "Чашка полна — в последнее время у вас много мыслей. Хорошая новость: почти всё скоро встанет на свои места.",
      "Your cup is lively but clear — busy days, and an open road.": "Чашка живая, но ясная: дни насыщенные, а дорога открыта.",
      "Your cup is light and open — you carry less than you think, and things are clearing.":
        "Чашка светлая и чистая — ноша легче, чем кажется, и всё понемногу проясняется.",
      "News": "Вести",
      "Kısmet": "Кысмет",
      "Journey": "Путешествие",
      "Love": "Любовь",
      "A way through": "Решение",
      "Health": "Здоровье",
      "The evil eye": "Сглаз",
      "A promise": "Обещание",
      "Effort": "Усилие",
      "Home": "Семья",
      "Your wish": "Ваше желание",
      "Luck": "Удача",
      "A bird carries news. It is coming from someone far away, and it is good — answer it when it arrives; it opens a door.":
        "Птица несёт весть. Она придёт от кого-то издалека, и она добрая — ответьте, когда получите: она открывает дверь.",
      "The fish is kısmet: plenty from a direction you are not watching. Money or an offer — say yes before you overthink it.":
        "Рыба — это кысмет: достаток придёт оттуда, куда вы не смотрите. Деньги или предложение — соглашайтесь, не раздумывая слишком долго.",
      "A road opens in the grounds. A trip is near — short, maybe just across the Bosphorus — and something you need is at the other end of it.":
        "В гуще открылась дорога. Скоро поездка — короткая, может, просто на другой берег Босфора, — и на её конце вас ждёт то, что нужно.",
      "A heart, clear as a drawing. Someone thinks of you more than they let on; a small gesture from you will be enough.":
        "Сердце — чёткое, как рисунок. Кто-то думает о вас больше, чем показывает; маленького шага с вашей стороны будет достаточно.",
      "A key: a matter you thought was locked is about to open. The answer is simpler than it looked — ask once more.":
        "Ключ: дело, которое казалось закрытым, вот-вот откроется. Решение проще, чем казалось, — спросите ещё раз.",
      "A tree with its roots in the grounds — health, and quiet. You are putting down roots somewhere; let them take their time.":
        "Дерево с корнями в гуще — здоровье и покой. Вы где-то пускаете корни; дайте им время.",
      "An eye: nazar. Someone is watching your good luck a little too closely. Keep your plans to yourself for a while, and a blue bead in your pocket.":
        "Глаз — это сглаз. Кто-то слишком пристально смотрит на вашу удачу. Пока держите планы при себе, а в кармане — синюю бусину.",
      "A ring: a promise. One will be made to you, or one you made will finally be kept — either way, it binds you to something good.":
        "Кольцо — это обещание. Либо его дадут вам, либо наконец сдержат то, что дали вы; так или иначе, оно связывает вас с хорошим.",
      "A mountain stands in the way, but look closer: the path goes over it, not around. It will take effort, and it will be worth it.":
        "На пути гора, но присмотритесь: тропа идёт через неё, а не в обход. Будет непросто — и того стоит.",
      "A house: a change at home. A move, a new face at the table, or a room you finally make your own — it lets the light in.":
        "Дом — перемены дома. Переезд, новое лицо за столом или комната, которую вы наконец сделаете своей, — в доме станет светлее.",
      "A crescent, the sign of a wish. The one you made at the start of this cup will come — not today, but it is on its way.":
        "Полумесяц — знак желания. То, что вы загадали в начале, сбудется — не сегодня, но оно уже в пути.",
      "A star: luck is on your side this week. Whatever you have been putting off, begin it now.":
        "Звезда: на этой неделе удача на вашей стороне. Всё, что откладывали, — начинайте сейчас.",
      "Yes — it will happen. The %s in your cup says so.": "Да — сбудется. Об этом говорит %s в вашей чашке.",
      "It will happen, but not on its own. Ask again in three days.": "Сбудется, но не само собой. Спросите снова через три дня.",
      "The cup is on your side — give it a little time.": "Чашка на вашей стороне — дайте ему немного времени.",
      "When?": "Когда?",
      "Within three: three days, three weeks or three months. The cup never says which.":
        "В течение трёх: трёх дней, трёх недель или трёх месяцев. Чашка никогда не уточняет.",
      "Leave table mode": "Выйти из режима стола",
      "Every table has its own QR code.": "У каждого стола свой QR-код.",
      "Every table has its own QR code. Scan it with your phone to order from table %s, call a waiter or ask for the bill — and split it.":
        "У каждого стола свой QR-код. Отсканируйте его телефоном: заказывайте со стола %s, зовите официанта или просите счёт — и делите его.",
      "Choose a table": "Выберите стол",
      "Previous table": "Предыдущий стол",
      "Next table": "Следующий стол",
      "Larisel — roasted coffee beans in the dark: pick a coffee, design the cup.":
        "Larisel — обжаренные кофейные зёрна в темноте: кофе на выбор, стакан — ваш.",
      "N": "С",
      "200 m": "200 м"
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
