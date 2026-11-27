# BREND — Telegram Mini App (demo)

Premium kiyim do'koni uchun Telegram Mini App **demo versiyasi** (portfolio). Haqiqiy server, to'lov yoki hisoblar yo'q:
barcha ma'lumotlar (katalog, ombor, savat, buyurtmalar, demo admin o'zgarishlari) faqat foydalanuvchi qurilmasining `localStorage`ida saqlanadi.

Sayt: https://onetimurfx.github.io/KIYIM/

## Nima ishlaydi
- 27 ta namunaviy kiyim mahsuloti, 11 kategoriya, filtr, qidiruv, komplektlar, yaqinda ko'rilganlar.
- Haqiqiy fotosuratlar (Unsplash), yagona Liquid Glass interfeys.
- **Brendni sozlash**: Profil → «Brendni sozlash» (yoki Admin → Brend, faqat egasi): nom, logotip, ranglar, shisha va fon ko'rinishi.
- Savat → buyurtma berish (yetkazib berish narxi/bepul yetkazish qoidasi) → Profilda buyurtmalar tarixi.
- Tezkor buyurtma (do'kondan olib ketish): kod bilan topshirish.
- **Demo admin panel**: Profil → «Demo admin panelga kirish». Buyurtma holatlari, tezkor buyurtmalar, mahsulotlar (rasm yuklash bilan),
  kategoriyalar, ombor, mijozlar, sozlamalar. Mijoz tomonidagi o'zgarishlar admin panelda, admin o'zgarishlari mijoz tomonida ko'rinadi.
- Profil → «Demoni boshidan boshlash» boshlang'ich ma'lumotlarni qaytaradi.

## Ishga tushirish
```
npm ci
npm run dev        # lokal
npm test           # unit testlar
npm run build      # tsc + vite build
```
GitHub Pages uchun `VITE_BASE=/KIYIM/` (`.github/workflows/deploy.yml` buni o'zi beradi).
Brauzer testi (telefon o'lchami): `VITE_BASE=/KIYIM/ npm run build && node tests/e2e/demo.cjs`.
Chrome topilmasa `CHROME_PATH` bilan ko'rsating. Testlar Unsplash o'rniga «TEST FOTO» belgili vaqtinchalik rasmlarni
beradi, shuning uchun haqiqiy suratlarning mosligi qo'lda tekshiriladi.

## Tuzilma
- `src/demo/` — demo "backend": `db.ts` (localStorage), `seed.ts` (boshlang'ich ma'lumot), `backend.ts` (ilova ishlatadigan API, admin bilan).
- `src/lib/backend.ts` — ilova faqat shu obyekt bilan gaplashadi.
- `src/admin/` — admin panel (alohida bundle).
- `src/pages`, `src/components` — mijoz ekranlari (Liquid Glass navigatsiya, Telegram Mini App ko'rinishi).
- `src/brand/` — qayta ishlatiladigan brend moduli (katalog va buyurtmalarga bog'liq emas).
- `src/data/photos.ts` — namunaviy suratlar, mualliflari va manba sahifalari.

## Suratlar
- Manba: Unsplash, bepul [Unsplash License](https://unsplash.com/license) (Unsplash+ ishlatilmagan). Rasmlar repoga
  ko'chirilmaydi, `images.unsplash.com` dan yuklanadi; mualliflar Profil sahifasida ko'rsatiladi.
- Bular **namunaviy** suratlar: aniq mahsulot rasmi emas, rangi biroz farq qilishi mumkin. Litsenziya suratdagi savdo
  belgilari yoki odamlarning roziligini qamrab olmaydi. Haqiqiy savdoda do'kon o'z suratlarini yuklashi kerak
  (Admin → Mahsulotlar); yuklangan surat har doim ustun turadi.
- Internet bo'lmasa yoki surat yuklanmasa, neytral shisha o'rinbosar ko'rinadi.

## Brend moduli
```ts
const store = createBrandStore({ namespace: 'kiyim', tenantId: 'brend' })
store.update({ name: 'Do\'kon', primary: '#1F7A5C' })
```
- Kalit: `<namespace>:brand:<tenantId>`; `storage` almashtiriladi (kelajakda API). Kirish ma'lumoti `sanitizeBrand` bilan tozalanadi.
- Ranglar CSS o'zgaruvchilariga (`--brand-*`) yoziladi (`applyBrand`, `<BrandTheme />`).
- Logotip: PNG, WebP yoki SVG; shaffoflik va proporsiya saqlanadi. SVG ichida skript yoki tashqi havola bo'lsa rad etiladi.
- Demo cheklovi: sozlama faqat shu qurilmada saqlanadi, boshqa mijozlarga ko'rinmaydi.

## Shisha tizimi (`src/index.css`)
Blur faqat ostidan kontent o'tadigan qatlamlarda: `.glass-bar`, `.glass-nav`, `.glass-sheet`, `.glass-photo` (banner
yozuvi). `.glass`, `.glass-card`, `.glass-pill`, `.glass-field`, `.glass-chip` shaffof, lekin tezlik uchun blursiz.
Kuchsiz telefonda (`src/lib/performance.ts`: Telegram Android `LOW` sinfi yoki kam xotira) blur 8px gacha kamayadi.
`prefers-reduced-transparency` va blur qo'llamaydigan brauzerlar uchun zich fon ishlatiladi.

Juda och brend rangi tanlansa, rang saqlanadi, tugma va tanlangan holatlarga to'qroq hoshiya qo'shiladi va
sozlamalarda ogohlantirish chiqadi.
