# Bitalih Bulletin API Kütüphanesi

Bu kütüphane Bitalih sitesine POST isteği yaparak bulletin verilerini çeker. Dışarıdan çağrılabilir fonksiyonlar ile race ID ve ayak numarası alıp atlar ve oranlarını döndürür.

## 🚀 Özellikler

- ✅ **FOB İsteği**: Sabit "fob" tipi ile API isteği yapar
- ✅ **Race ID Desteği**: Farklı race ID'leri ile çalışabilir
- ✅ **Ayak Numarası**: Belirli ayak numaraları için at bilgilerini alır
- ✅ **At Bilgileri**: At numarası, ismi, oranı, jokey, antrenör bilgileri
- ✅ **Kütüphane Fonksiyonları**: Dışarıdan çağrılabilir fonksiyonlar
- ✅ **Hata Yönetimi**: Kapsamlı hata yakalama ve raporlama

## 📁 Dosyalar

- `bulletin_request.py` - Ana kütüphane dosyası
- `example_usage.py` - Kullanım örnekleri
- `README_bulletin.md` - Bu dosya

## 🔧 Kurulum

```bash
# Virtual environment'ı aktifleştir
source venv/bin/activate

# Gerekli paketler zaten yüklü
pip install requests
```

## 📖 Kullanım

### Temel Kullanım

```python
from bulletin_request import get_race_horses, get_available_race_numbers

# Mevcut ayak numaralarını al
race_numbers = get_available_race_numbers(988)
print(f"Mevcut ayaklar: {race_numbers}")

# Belirli bir ayak için at bilgilerini al
horses = get_race_horses(988, 6)
print(f"6. ayakta {horses['total_horses']} at var")
```

### Kütüphane Fonksiyonları

#### 1. `get_available_race_numbers(race_id)`
Belirtilen race ID için mevcut ayak numaralarını döndürür.

```python
race_numbers = get_available_race_numbers(988)
# Sonuç: [6, 7, 8]
```

#### 2. `get_race_horses(race_id, race_number)`
Belirtilen race ID ve ayak numarası için atları ve oranlarını döndürür.

```python
horses = get_race_horses(988, 6)
# Sonuç: {
#   'race_id': 988,
#   'race_number': 6,
#   'race_name': 'Handikap/Dişi, 3 ve Yukarı İngilizler, 1400 Çim',
#   'race_time': '2025-09-17 16:30:00',
#   'horses': [
#     {
#       'horse_no': 1,
#       'horse_name': 'AMAFORT',
#       'odds': 6,
#       'jockey': 'R A VENNİKER',
#       'trainer': 'M L ROBERTS',
#       'weight': 58.5,
#       'age': '4y d k',
#       'sex': 'Dişi'
#     },
#     ...
#   ],
#   'total_horses': 10
# }
```

#### 3. `get_horse_odds(race_id, race_number, horse_number)`
Belirtilen at için oran bilgisini döndürür.

```python
odds = get_horse_odds(988, 6, 1)
# Sonuç: 6
```

#### 4. `get_race_info(race_id, race_number)`
Belirtilen ayak için genel bilgileri döndürür.

```python
info = get_race_info(988, 6)
# Sonuç: {
#   'race_id': 988,
#   'race_number': 6,
#   'race_name': 'Handikap/Dişi, 3 ve Yukarı İngilizler, 1400 Çim',
#   'race_time': '2025-09-17 16:30:00',
#   'total_horses': 10
# }
```

#### 5. `get_all_races(race_id)`
Belirtilen race ID için tüm ayakları ve at bilgilerini döndürür.

```python
all_races = get_all_races(988)
# Sonuç: {
#   'race_id': 988,
#   'races': [...],
#   'total_races': 3
# }
```

## 🧪 Test Etme

### Kütüphane Fonksiyonlarını Test Et

```bash
source venv/bin/activate
python bulletin_request.py test
```

### Örnek Kullanımları Çalıştır

```bash
source venv/bin/activate
python example_usage.py
```

### Manuel Test

```bash
source venv/bin/activate
python bulletin_request.py
```

## 📊 Örnek Çıktı

```
🏇 Bitalih Bulletin Kütüphanesi Kullanım Örnekleri
============================================================
🔍 Örnek 1: Mevcut ayak numaralarını al
--------------------------------------------------
✅ Race ID 988 için mevcut ayaklar: [6, 7, 8]

🐎 Örnek 2: Belirli bir ayak için at bilgilerini al
--------------------------------------------------
✅ 6. ayak bilgileri:
   • Ayak adı: Handikap/Dişi, 3 ve Yukarı İngilizler, 1400 Çim
   • Yarış zamanı: 2025-09-17 16:30:00
   • Toplam at sayısı: 10
   • Atlar:
     - 1. AMAFORT (Oran: 6)
     - 2. WILLOW GEM (Oran: 5.5)
     - 3. GETOFFOFMYCLOUD (Oran: 4.75)
     - 4. MYSTIQUE ROUGE (Oran: 16)
     - 5. COPACABANA (Oran: 4.5)
     - 6. MY TRUE LOVE (Oran: 12)
     - 7. OH MY GUCCI GIRL (Oran: 16)
     - 8. MISSISSIPPI SPICE (Oran: 20)
     - 9. THESUPERNOVASTAR (Oran: 20)
     - 10. SAINT BRIGID (Oran: 3.8)
```

## 🔧 Teknik Detaylar

### API Endpoint
- **URL**: `https://www.bitalih.com/api/tjk/race/{race_id}/bulletin`
- **Method**: POST
- **Content-Type**: application/json
- **Data**: `{"type": "fob"}`

### Veri Yapısı
- **Race ID**: Yarış kimlik numarası (örn: 988)
- **Race Number**: Ayak numarası (örn: 6, 7, 8)
- **Horse Number**: At numarası (örn: 1, 2, 3...)
- **Fixed Odd**: Sabit oran (fob)

### Hata Yönetimi
- Tüm fonksiyonlar hata durumunda `None` döndürür
- Hata mesajları konsola yazdırılır
- Timeout ve network hataları yakalanır

## 📝 Notlar

- **FOB Tipi**: İstek tipi her zaman "fob" olarak sabitlenmiştir
- **Session Yönetimi**: Her fonksiyon çağrısında yeni session oluşturulur
- **Cookie'ler**: Gerekli cookie'ler otomatik olarak ayarlanır
- **Header'lar**: Tüm gerekli HTTP header'ları otomatik olarak eklenir

## 🚨 Önemli

- Bu kütüphane sadece veri çekme amaçlıdır
- Bahis oynama işlevi yoktur
- Rate limiting uygulanmamıştır, dikkatli kullanın
- Cookie'ler ve session bilgileri güncel tutulmalıdır
