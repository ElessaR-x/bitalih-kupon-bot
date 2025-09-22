# Bitalih At Yarışı Oranları Botu

Bu Python botu, Bitalih sitesinden at yarışı verilerini çeker ve atların isimlerini ile sabit oranlarını (fixedOdd) ekrana yazdırır.

## Özellikler

- 🏇 Bitalih API'sinden yarış verilerini çeker
- 🛡️ Undetected Chrome driver kullanarak bot tespitini önler
- 📊 Atların isimlerini ve sabit oranlarını listeler
- 🌤️ Yarış bilgilerini (hipodrom, hava durumu, vb.) gösterir
- 🔄 Farklı yarış ID'leri ile çalışabilir

## Kurulum

1. Gerekli paketleri yükleyin:
```bash
pip install -r requirements.txt
```

2. Chrome tarayıcısının yüklü olduğundan emin olun.

## Kullanım

### Temel Kullanım
```bash
python bitalih_bot.py
```

### Farklı Yarış ID'si ile
Bot kodunda `race_id` parametresini değiştirerek farklı yarışları çekebilirsiniz:

```python
bot.run(race_id=1234)  # 1234 numaralı yarış için
```

## Çıktı Örneği

```
🏇 Bitalih At Yarışı Oranları Botu
==================================================
🤖 Bitalih Bot başlatılıyor...
✅ Chrome driver başarıyla başlatıldı
🔍 API'den veri çekiliyor: https://www.bitalih.com/api/tjk/race/978/bulletin
✅ API verisi başarıyla çekildi

============================================================
🏇 YARIŞ BİLGİLERİ
============================================================
📍 Hipodrom: İstanbul Veliefendi Hipodromu
🌍 Konum: İstanbul
📅 Başlangıç: 2025-09-17 14:00:00
📅 Bitiş: 2025-09-17 18:00:00
🏃 Yarış Günü: 67. Yarış Günü
🌤️  Hava: Parçalı Bulutlu (27°C)

🏁 2. Yarış:
--------------------------------------------------
  1. EAGLE KHAN - Sabit Oran: 4.5
  2. AT İSMİ 2 - Sabit Oran: 3.2
  3. AT İSMİ 3 - Sabit Oran: 6.8
  ...

✅ Toplam 12 at bilgisi işlendi
🔒 Chrome driver kapatıldı
```

## Teknik Detaylar

- **Undetected Chrome Driver**: Bot tespitini önlemek için kullanılır
- **Selenium WebDriver**: Web sayfalarıyla etkileşim için
- **JSON Parsing**: API yanıtlarını işlemek için
- **Error Handling**: Kapsamlı hata yönetimi

## Gereksinimler

- Python 3.7+
- Chrome tarayıcısı
- İnternet bağlantısı

## Lisans

Bu proje eğitim amaçlıdır. Ticari kullanım için Bitalih'in kullanım şartlarını kontrol edin.
