# 🎮 MultiTetris - Online Multiplayer Tetris

<div align="center">

![Tetris](https://img.shields.io/badge/Game-Tetris-FF6B6B?style=for-the-badge&logo=gamepad&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

**Arkadaşlarınla gerçek zamanlı Tetris oyna!**

[🎮 Oyna](#-nasıl-oynanır) • [🚀 Kurulum](#-kurulum) • [📖 Özellikler](#-özellikler)

</div>

---

## 📖 Özellikler

- 🎯 **Gerçek Zamanlı Multiplayer** - Socket.IO ile anlık senkronizasyon
- 🏠 **Oda Sistemi** - Özel oda kodu ile arkadaşlarını davet et
- 🎨 **Modern Arayüz** - Temiz ve responsive tasarım
- ⚡ **Hızlı Bağlantı** - Düşük gecikme süresi
- 🏆 **Skor Takibi** - Canlı skor karşılaştırması
- 🔄 **Yeniden Oyna** - Maç bitince hızlıca tekrar başla

---

## 🎮 Nasıl Oynanır?

### Kontroller

| Tuş | Aksiyon |
|-----|---------|
| `←` `→` | Sola / Sağa hareket |
| `↓` | Hızlı düşür |
| `↑` | Döndür |
| `Space` | Anında düşür |

### Oyun Akışı

1. **Oda Oluştur** veya **Odaya Katıl**
2. İki oyuncu da **"Hazır"** butonuna tıklasın
3. Oyun başlar - rakibinden önce daha çok satır temizle!
4. Oyun bitince skorlar karşılaştırılır

---

## 🚀 Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) (v14 veya üzeri)
- npm

### Yerel Kurulum

```bash
# Repository'yi klonla
git clone https://github.com/enkazweb/multitetris.git

# Klasöre gir
cd multitetris

# Bağımlılıkları yükle
npm install

# Sunucuyu başlat
npm start
```

Tarayıcıda aç: `http://localhost:3001`

---

## 🛠️ Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| **Node.js** | Backend runtime |
| **Express** | Web sunucusu |
| **Socket.IO** | Gerçek zamanlı iletişim |
| **HTML5 Canvas** | Oyun render |
| **CSS3** | Styling & animasyonlar |
| **Vanilla JS** | Frontend logic |

---

## 📁 Proje Yapısı

```
multitetris/
├── public/
│   ├── index.html    # Ana sayfa
│   ├── style.css     # Stiller
│   └── game.js       # Oyun mantığı
├── server.js         # Socket.IO sunucusu
├── package.json      # Bağımlılıklar
└── README.md         # Bu dosya
```

---

## 🌐 Deploy

Bu proje [Render.com](https://render.com) üzerinde ücretsiz olarak host edilebilir.

### Render.com Ayarları

| Ayar | Değer |
|------|-------|
| Build Command | `npm install` |
| Start Command | `npm start` |
| Environment | Node |

---

## 🤝 Katkıda Bulun

1. Fork'la
2. Feature branch oluştur (`git checkout -b feature/yeni-ozellik`)
3. Commit et (`git commit -m 'Yeni özellik eklendi'`)
4. Push et (`git push origin feature/yeni-ozellik`)
5. Pull Request aç

---

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

<div align="center">

**⭐ Beğendiysen yıldız vermeyi unutma!**

Made with ❤️ by [enkazweb](https://github.com/enkazweb)

</div>
