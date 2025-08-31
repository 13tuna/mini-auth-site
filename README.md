# Mini Auth Site (Express + SQLite)

Basit ama **tam çalışan** giriş/kayıt web sitesi:
- Frontend: Vanilla HTML/CSS/JS (şık koyu tema)
- Backend: Node.js (Express)
- **Kalıcı veritabanı**: SQLite (better-sqlite3)
- Şifreler **bcrypt** ile hash’lenir.
- Oturumlar **HTTP‑only JWT cookie** ile yönetilir.

## Kurulum (Windows / macOS / Linux)

1) Node.js 18+ kurulu olsun. Terminal açın ve klasöre girin:
```bash
cd auth-starter
npm install
```

2) (İsteğe bağlı) .env oluşturun ve gizli anahtar belirleyin:
```bash
# .env
JWT_SECRET=super-gizli-anahtar
PORT=3000
```

3) Çalıştırın:
```bash
npm start
```
Tarayıcı: http://localhost:3000

## Demo Hesap
`admin@gmail.com / 123456` (Önce **Kayıt Ol** kısmıyla ekleyin.)

## Yapı
```
server.js           # API + statik dosya sunumu
auth.db             # SQLite veritabanı (ilk çalıştırmada oluşur)
public/
  index.html        # Giriş / Kayıt
  dashboard.html    # Korunan alan
  style.css
  script.js
```

## API
- `POST /api/register` `{name,email,password}` → kayıt + cookie
- `POST /api/login` `{email,password}` → giriş + cookie
- `GET /api/me` → aktif kullanıcı bilgisi (cookie gerekiyor)
- `POST /api/logout` → cookie temizler

> Üretimde HTTPS kullanın ve `secure: true` ayarlayın (reverse proxy arkasında).

## SSS
- **Veriler nerede saklanıyor?** Proje klasöründeki `auth.db` dosyasında (SQLite).
- **Şifreler düz metin mi?** Hayır. `bcrypt` ile güvenli şekilde hashlenir.
- **Farklı port istiyorum.** `.env` içine `PORT=5050` yazabilirsiniz.
