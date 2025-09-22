# Bitalih Kupon API Kütüphanesi

Bu kütüphane Bitalih sitesine HTTP request ile kupon oynar ve sonuç döndürür. Kupon doğrulama ve oynama işlemlerini gerçekleştirir.

## 🚀 Özellikler

- ✅ **HTTP Request Kupon**: Sadece HTTP istekleri ile kupon oynama
- ✅ **Kupon Doğrulama**: Kupon oynamadan önce doğrulama
- ✅ **Çoklu Seçim**: Birden fazla at seçimi ile kupon
- ✅ **Token Desteği**: Login token'ı ile güvenli kupon oynama
- ✅ **Cookie Yönetimi**: Otomatik cookie yönetimi
- ✅ **Hata Yönetimi**: Kapsamlı hata yakalama
- ✅ **Potansiyel Kazanç**: Otomatik kazanç hesaplama

## 📁 Dosyalar

- `bitalih_coupon.py` - Ana kupon kütüphanesi
- `coupon_example.py` - Kullanım örnekleri
- `README_coupon.md` - Bu dosya

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
from bitalih_coupon import play_coupon_with_validation, create_runners

# Runner'ları oluştur
selections = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
runners = create_runners(selections)

# Kuponu oyna
result = play_coupon_with_validation(token, cookies, runners, "29", 29, "88.00")
```

### Kütüphane Fonksiyonları

#### 1. `play_coupon(token, cookies, runners, amount, multiplier, odd_at_play)`
Kuponu oynar.

```python
runners = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
result = play_coupon(token, cookies, runners, "29", 29, "88.00")
# Sonuç: {
#   'success': True,
#   'data': {
#     'couponId': '12345',
#     'status': 'active',
#     'amount': '29',
#     'oddAtPlay': '88.00',
#     'potentialWin': '2552.00'
#   }
# }
```

#### 2. `play_coupon_with_validation(token, cookies, runners, amount, multiplier, odd_at_play)`
Kuponu önce doğrular, sonra oynar.

```python
result = play_coupon_with_validation(token, cookies, runners, "29", 29, "88.00")
# Önce doğrulama yapar, sonra oynar
```

#### 3. `validate_coupon(token, cookies, runners, amount, multiplier, odd_at_play)`
Kuponu doğrular.

```python
result = validate_coupon(token, cookies, runners, "29", 29, "88.00")
# Sonuç: {
#   'success': True,
#   'data': [
#     {
#       'runner': {'raceId': 978, 'runNo': 3, 'horseNo': 1},
#       'isStartedRun': True,
#       'isDoesRun': False
#     }
#   ]
# }
```

#### 4. `create_runners(selections)`
Seçimlerden runner listesi oluşturur.

```python
selections = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
runners = create_runners(selections)
# Sonuç: [{"raceId": 978, "runNo": 3, "horseNo": 1}]
```

### Kupon Objesi Metodları

```python
from bitalih_coupon import BitalihCoupon

coupon_client = BitalihCoupon(token, cookies)

# Kuponu doğrula
validation_result = coupon_client.validate_coupon(runners, amount, multiplier, odd_at_play)

# Kuponu oyna
play_result = coupon_client.play_coupon(runners, amount, multiplier, odd_at_play)

# Doğrulama ile oyna
result = coupon_client.play_coupon_with_validation(runners, amount, multiplier, odd_at_play)

# Runner'ları oluştur
runners = coupon_client.create_runners(selections)

# Potansiyel kazancı hesapla
potential_win = coupon_client.calculate_potential_win(amount, odd_at_play)
```

## 🧪 Test Etme

### Kupon Fonksiyonlarını Test Et

```bash
source venv/bin/activate
python bitalih_coupon.py test
```

### Örnek Kullanımları Çalıştır

```bash
source venv/bin/activate
python coupon_example.py
```

### Manuel Kupon Oynama

```bash
source venv/bin/activate
python bitalih_coupon.py
```

## 📊 Örnek Çıktı

```
🎯 Bitalih Kupon API Kütüphanesi Kullanım Örnekleri
============================================================
🏇 Örnek 1: Runner oluşturma
--------------------------------------------------
✅ Runner'lar oluşturuldu:
   • 1. Seçim: 3. ayak, 1 numaralı at
   • 2. Seçim: 8. ayak, 3 numaralı at

🔍 Örnek 2: Kupon doğrulama
--------------------------------------------------
✅ Kupon doğrulaması başarılı!
   • 3. ayak, 1 numaralı at:
     - Başladı mı: True
     - Koşuyor mu: False
   • 8. ayak, 3 numaralı at:
     - Başladı mı: False
     - Koşuyor mu: False

🎯 Örnek 3: Login ile kupon oynama
--------------------------------------------------
✅ Login başarılı!
🎯 Kupon oynanıyor...
   • Seçimler: 2 at
   • Bahis: 29 TL
   • Oran: 88.00
   • Potansiyel Kazanç: 2552.00 TL
✅ Kupon başarıyla oynandı!
   • Kupon ID: 12345
   • Durum: active
```

## 🔧 Teknik Detaylar

### API Endpoints
- **Validate**: `https://www.bitalih.com/api/tjk/coupon/fob/play/validate`
- **Play**: `https://www.bitalih.com/api/tjk/coupon/fob/play`
- **Method**: POST
- **Content-Type**: application/json

### Kupon Veri Yapısı
```json
{
  "runners": [
    {
      "raceId": 978,
      "runNo": 3,
      "horseNo": 1
    }
  ],
  "amount": "29",
  "multiplier": 29,
  "complete": false,
  "oddAtPlay": "88.00",
  "count": 1
}
```

### Response Yapısı
```json
{
  "success": true,
  "data": {
    "couponId": "12345",
    "status": "active",
    "amount": "29",
    "oddAtPlay": "88.00",
    "potentialWin": "2552.00"
  }
}
```

### Hata Kodları
- **EL76**: "Sabit ihtimalli oran bulunamadı"
- **EL77**: "At koşmuyor"
- **EL78**: "Yarış başlamış"
- **406**: Not Acceptable (genel hata)

## 🎯 Kupon Türleri

### 1. Tek Seçim
```python
runners = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
```

### 2. İkili Kupon
```python
runners = [
    {"raceId": 978, "runNo": 3, "horseNo": 1},
    {"raceId": 978, "runNo": 8, "horseNo": 3}
]
```

### 3. Üçlü Kupon
```python
runners = [
    {"raceId": 978, "runNo": 1, "horseNo": 2},
    {"raceId": 978, "runNo": 2, "horseNo": 5},
    {"raceId": 978, "runNo": 3, "horseNo": 1}
]
```

## 💰 Hesaplamalar

### Potansiyel Kazanç
```python
potential_win = float(amount) * float(odd_at_play)
```

### Net Kar
```python
profit = potential_win - float(amount)
```

### ROI (Return on Investment)
```python
roi = (profit / float(amount)) * 100
```

## 🔐 Güvenlik

### Token Kullanımı
```python
# Token'ı Authorization header'ında kullanın
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
```

### Cookie Yönetimi
```python
# Login'den gelen cookie'leri kullanın
cookies = session.get_cookies()
```

## 📝 Notlar

- **Sabit İhtimalli**: Sadece sabit ihtimalli bahisler desteklenir
- **FOB**: Fixed Odds Betting
- **Doğrulama**: Kupon oynamadan önce doğrulama yapılması önerilir
- **Yarış Durumu**: Yarış başlamışsa kupon oynanamaz
- **At Durumu**: At koşmuyorsa kupon oynanamaz

## 🚨 Önemli

- Bu kütüphane sadece kupon oynama amaçlıdır
- Gerçek para ile bahis yapılır, dikkatli kullanın
- Token'ları güvenli bir şekilde saklayın
- Production'da credential'ları environment variable'larda tutun
- Rate limiting uygulanmamıştır, dikkatli kullanın

## 🔗 Entegrasyon

### Login ile Kullanım
```python
from bitalih_login import get_login_session
from bitalih_coupon import play_coupon_with_validation

# Login yap
session = get_login_session("10108926614", "necmuk-tucbov-beMqi6")

# Token ve cookie'leri al
token = session.get_token()
cookies = session.get_cookies()

# Kuponu oyna
runners = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
result = play_coupon_with_validation(token, cookies, runners, "29", 29, "88.00")
```

### Bulletin API ile Kullanım
```python
from bulletin_request import get_race_horses
from bitalih_coupon import create_runners, play_coupon_with_validation

# At bilgilerini al
horses = get_race_horses(988, 3)
if horses:
    # İlk atı seç
    first_horse = horses['horses'][0]
    
    # Runner oluştur
    selections = [{"raceId": 988, "runNo": 3, "horseNo": first_horse['horse_no']}]
    runners = create_runners(selections)
    
    # Kuponu oyna
    result = play_coupon_with_validation(token, cookies, runners, "10", 10, str(first_horse['odds']))
```

## 📈 Örnek Senaryolar

### 1. Düşük Risk Kuponu
```python
# Düşük oran, yüksek kazanma şansı
runners = [{"raceId": 978, "runNo": 3, "horseNo": 1}]  # Favori at
result = play_coupon_with_validation(token, cookies, runners, "50", 50, "2.50")
# Potansiyel kazanç: 125 TL
```

### 2. Yüksek Risk Kuponu
```python
# Yüksek oran, düşük kazanma şansı
runners = [{"raceId": 978, "runNo": 3, "horseNo": 10}]  # Dış at
result = play_coupon_with_validation(token, cookies, runners, "10", 10, "25.00")
# Potansiyel kazanç: 250 TL
```

### 3. Kombine Kupon
```python
# Birden fazla seçim
runners = [
    {"raceId": 978, "runNo": 3, "horseNo": 1},
    {"raceId": 978, "runNo": 8, "horseNo": 3}
]
result = play_coupon_with_validation(token, cookies, runners, "20", 20, "15.00")
# Potansiyel kazanç: 300 TL
```
