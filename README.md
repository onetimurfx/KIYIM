# BREND — Telegram Mini App (demo)

Premium kiyim do'koni uchun Telegram Mini App **demo versiyasi** (portfolio). Haqiqiy server, to'lov yoki hisoblar yo'q:
barcha ma'lumotlar (katalog, ombor, savat, buyurtmalar, demo admin o'zgarishlari) faqat foydalanuvchi qurilmasining `localStorage`ida saqlanadi.

Sayt: https://onetimurfx.github.io/KIYIM/

## Nima ishlaydi
- 26 ta namunaviy kiyim mahsuloti, 11 kategoriya, filtr, qidiruv, komplektlar, yaqinda ko'rilganlar.
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

## Tuzilma
- `src/demo/` — demo "backend": `db.ts` (localStorage), `seed.ts` (boshlang'ich ma'lumot), `backend.ts` (ilova ishlatadigan API, admin bilan).
- `src/lib/backend.ts` — ilova faqat shu obyekt bilan gaplashadi.
- `src/admin/` — admin panel (alohida bundle).
- `src/pages`, `src/components` — mijoz ekranlari (Liquid Glass navigatsiya, Telegram Mini App ko'rinishi).
