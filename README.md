# 🎮 MultiTetris - Online Multiplayer Tetris

<div align="center">

![Tetris](https://img.shields.io/badge/Game-Tetris-FF6B6B?style=for-the-badge&logo=gamepad&logoColor=white)
![VR](https://img.shields.io/badge/VR-Meta_Quest_3-00D4FF?style=for-the-badge&logo=meta&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![A-Frame](https://img.shields.io/badge/A--Frame-EF2D5E?style=for-the-badge&logo=aframe&logoColor=white)

**Arkadaşlarınla gerçek zamanlı Tetris oyna! 🖥️ Web + 🥽 VR**

[🎮 Oyna](#-nasıl-oynanır) • [🥽 VR Modu](#-vr-modu-meta-quest-3) • [🚀 Kurulum](#-kurulum) • [📖 Özellikler](#-özellikler)

</div>

---

## 📖 Özellikler

### 🖥️ Web Modu
- 🎯 **Gerçek Zamanlı Multiplayer** - Socket.IO ile anlık senkronizasyon
- 🏠 **Oda Sistemi** - Özel oda kodu ile arkadaşlarını davet et
- 🎨 **Modern Arayüz** - Temiz ve responsive tasarım
- ⚡ **Hızlı Bağlantı** - Düşük gecikme süresi
- 🏆 **Skor Takibi** - Canlı skor karşılaştırması
- 🔄 **Yeniden Oyna** - Maç bitince hızlıca tekrar başla

### 🥽 VR Modu (Meta Quest 3)
- 🌐 **360° İmmersif Ortam** - Etrafınızda uçuşan Tetris blokları
- 🎮 **3D Oyun Alanı** - Gerçek derinlik hissi
- 👥 **Canlı Rakip İzleme** - Rakibinizin hamlelerini anlık görün
- 🎵 **Arcade Müzik** - Korobeiniki (Tetris teması) + Ambient müzik
- 🔊 **3D Ses Efektleri** - Blok dönme, yerleştirme, satır silme sesleri
- 🎯 **VR Controller Desteği** - Oculus Touch kontrolleri
- 🌟 **Neon Görsel Efektler** - Parlak ve canlı renkler

---

## 🎮 Nasıl Oynanır?

### 🖥️ Web Kontrolleri

| Tuş | Aksiyon |
|-----|---------|
| `←` `→` | Sola / Sağa hareket |
| `↓` | Hızlı düşür (Soft Drop) |
| `↑` | Döndür |
| `Space` | Anında düşür (Hard Drop) |

### 🥽 VR Kontrolleri (Meta Quest 3)

| Kontrol | Aksiyon |
|---------|---------|
| **Sol Thumbstick** | Sola / Sağa hareket |
| **Sağ Thumbstick Aşağı** | Hızlı düşür |
| **A Butonu** | Döndür |
| **Trigger** | UI butonlarına tıkla |
| **Thumbstick Aşağı (basılı)** | Anında düşür |

### Oyun Akışı

1. **Oda Oluştur** veya **Odaya Katıl**
2. İki oyuncu da **"Hazır"** butonuna tıklasın
3. **"VR'a Gir ve Oyna"** butonuna bas (VR modunda)
4. Oyun başlar - rakibinden önce daha çok satır temizle!
5. Oyun bitince: **Tekrar Oyna** veya **Çıkış** seç

---

## 🥽 VR Modu (Meta Quest 3)

### Özellikler

- **360° İmmersif Ortam**: Etrafınızda dönen ve yüzen Tetris parçaları
- **3D Oyun Boardları**: Derinlikli, neon çerçeveli oyun alanları
- **Canlı Rakip İzleme**: Rakibinizin her hamlesini anlık olarak görün
- **Sıradaki Blok Gösterimi**: Her iki oyuncu için de sıradaki blok görünür
- **Oyun Sonu Seçenekleri**: Tekrar Oyna veya Çıkış butonları

### Müzik & Ses

| Ses | Açıklama |
|-----|----------|
| 🎵 **Korobeiniki** | Klasik Tetris müziği (2 loop) |
| 🎶 **Ambient** | Rahatlatıcı arka plan müziği |
| 🔊 **Blok Sesleri** | Hareket, döndürme, yerleştirme |
| ✨ **Satır Silme** | Efekt ve ses |

### VR Moduna Erişim

```
Web: https://multitetris.enkazweb.com/vr.html
Local: http://localhost:3001/vr.html
Quest: http://[PC_IP]:3001/vr.html
```

### Gereksinimler

- Meta Quest 3 (veya WebXR destekli VR başlık)
- Meta Quest Browser
- Aynı ağda olmalısınız (local test için)

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
| **HTML5 Canvas** | Web oyun render |
| **A-Frame** | VR 3D framework |
| **WebXR** | VR cihaz entegrasyonu |
| **Web Audio API** | Müzik & ses efektleri |
| **CSS3** | Styling & animasyonlar |
| **Vanilla JS** | Frontend logic |

---

## 📁 Proje Yapısı

```
multitetris/
├── public/
│   ├── index.html    # Web modu ana sayfa
│   ├── vr.html       # VR modu (A-Frame)
│   ├── style.css     # Web stilleri
│   ├── game.js       # Web oyun mantığı
│   └── vr-game.js    # VR oyun mantığı & 3D render
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

Geliştiren: **Cem YILDIRIM**

Made with ❤️ by [enkazweb](https://github.com/enkazweb)

</div>
