const express = require('express');
const os = require('os');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// D.P8 — Improvement 1: Gzip compression (reduces response size ~60-70%)
app.use(compression());

// D.P8 — Improvement 2: Rate limiting (100 req/min per IP, protects against abuse)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/order', limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const products = [
  { id: 1, name: "Erkaklar ko'ylagi (klassik)", category: "Erkaklar", price: "$12.50", stock: 2400 },
  { id: 2, name: "Ayollar bluzkasi (ipak)", category: "Ayollar", price: "$18.00", stock: 1800 },
  { id: 3, name: "Bolalar kiyimi to'plami", category: "Bolalar", price: "$9.00", stock: 3200 },
  { id: 4, name: "Sport kostyum", category: "Sport", price: "$22.00", stock: 950 },
  { id: 5, name: "Qishki palto", category: "Erkaklar", price: "$45.00", stock: 600 },
  { id: 6, name: "Yozgi ko'ylak", category: "Ayollar", price: "$14.00", stock: 2100 },
];

app.get('/', (req, res) => {
  // D.P8 — Improvement 3: Cache-Control header (1 hour for catalogue page)
  res.set('Cache-Control', 'public, max-age=3600');

  const rows = products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.price}</td>
      <td>${p.stock.toLocaleString()}</td>
    </tr>`).join('');

  res.send(`<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UzTeks Wholesale</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; color: #333; }
    header { background: #1a56db; color: white; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; }
    header h1 { font-size: 1.6rem; }
    header span { font-size: 0.85rem; opacity: 0.85; }
    .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 36px; }
    .stat-card { background: white; border-radius: 10px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); text-align: center; }
    .stat-card h3 { font-size: 2rem; color: #1a56db; }
    .stat-card p { color: #666; margin-top: 4px; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    th { background: #1a56db; color: white; padding: 14px 18px; text-align: left; font-size: 0.9rem; }
    td { padding: 13px 18px; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f9fbff; }
    .section-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 16px; color: #222; }
    .order-form { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-top: 36px; }
    .order-form input, .order-form select, .order-form textarea { width: 100%; padding: 10px 14px; margin-top: 8px; margin-bottom: 18px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95rem; }
    .order-form button { background: #1a56db; color: white; border: none; padding: 12px 32px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    .server-badge { background: #e8f0ff; color: #1a56db; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    footer { text-align: center; padding: 30px; color: #999; font-size: 0.85rem; margin-top: 40px; }
  </style>
</head>
<body>
  <header>
    <h1>UzTeks Wholesale</h1>
    <span class="server-badge">Server: ${os.hostname()}</span>
  </header>

  <div class="container">
    <div class="stats">
      <div class="stat-card"><h3>6</h3><p>Mahsulot toifalari</p></div>
      <div class="stat-card"><h3>11,050</h3><p>Umumiy zaxira (dona)</p></div>
      <div class="stat-card"><h3>3</h3><p>Mintaqaviy omborlar</p></div>
    </div>

    <p class="section-title">Mahsulotlar katalogi</p>
    <table>
      <thead>
        <tr><th>#</th><th>Mahsulot nomi</th><th>Kategoriya</th><th>Narx (ulgurji)</th><th>Zaxira</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="order-form">
      <p class="section-title">Buyurtma so'rovi</p>
      <form method="POST" action="/order">
        <label>Kompaniya nomi</label>
        <input type="text" name="company" placeholder="Masalan: Samarqand Textil LLC" required>
        <label>Mahsulot</label>
        <select name="product">
          ${products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <label>Miqdor (dona)</label>
        <input type="number" name="qty" min="100" placeholder="Minimal buyurtma: 100 dona" required>
        <label>Qo'shimcha izoh</label>
        <textarea name="note" rows="3" placeholder="Yetkazib berish manzili, rang, o'lcham..."></textarea>
        <button type="submit">Buyurtma yuborish</button>
      </form>
    </div>
  </div>

  <footer>
    &copy; 2026 UzTeks Wholesale &mdash; Toshkent, O'zbekiston &mdash; Served by ${os.hostname()}
  </footer>
</body>
</html>`);
});

app.post('/order', (req, res) => {
  const { company, product, qty, note } = req.body;
  const prod = products.find(p => p.id === parseInt(product));
  res.send(`<!DOCTYPE html>
<html lang="uz"><head><meta charset="UTF-8"><title>Buyurtma qabul qilindi</title>
<style>body{font-family:'Segoe UI',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f7fa;}
.card{background:white;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.1);text-align:center;max-width:480px;}
h2{color:#1a56db;margin-bottom:12px;} p{color:#555;margin:8px 0;} a{color:#1a56db;text-decoration:none;font-weight:600;}
.check{font-size:3rem;}</style></head>
<body><div class="card">
  <div class="check">✅</div>
  <h2>Buyurtma qabul qilindi!</h2>
  <p><strong>${company}</strong></p>
  <p>Mahsulot: ${prod ? prod.name : product}</p>
  <p>Miqdor: ${parseInt(qty).toLocaleString()} dona</p>
  <p style="margin-top:20px;"><a href="/">← Katalogga qaytish</a></p>
</div></body></html>`);
});

// Load balancer health check
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', hostname: os.hostname(), uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`UzTeks running on port ${PORT} — hostname: ${os.hostname()}`);
});
