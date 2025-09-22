# Bitalih Login API Kütüphanesi

Bu kütüphane Bitalih sitesine HTTP request ile login yapar ve token döndürür. Sadece HTTP istekleri kullanarak kimlik doğrulama işlemi gerçekleştirir.

## 🚀 Özellikler

- ✅ **HTTP Request Login**: Sadece HTTP istekleri ile login
- ✅ **Token Yönetimi**: JWT token alımı ve yönetimi
- ✅ **Session Yönetimi**: Login session'ı yönetimi
- ✅ **Cookie Desteği**: Otomatik cookie yönetimi
- ✅ **Beni Hatırla**: Remember me özelliği
- ✅ **Hata Yönetimi**: Kapsamlı hata yakalama
- ✅ **Session Kaydetme**: Session bilgilerini dosyaya kaydetme

## 📁 Dosyalar

- `bitalih_login.py` - Ana login kütüphanesi
- `login_example.py` - Kullanım örnekleri
- `README_login.md` - Bu dosya

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
from bitalih_login import login_to_bitalih, get_login_token

# Basit login
result = login_to_bitalih("10108926614", "necmuk-tucbov-beMqi6")
if result:
    print(f"Token: {result['token']}")

# Sadece token al
token = get_login_token("10108926614", "necmuk-tucbov-beMqi6")
print(f"Token: {token}")
```

### Kütüphane Fonksiyonları

#### 1. `login_to_bitalih(ssn, password, remember=False)`
Bitalih'e login yapar ve tam sonuç döndürür.

```python
result = login_to_bitalih("10108926614", "necmuk-tucbov-beMqi6")
# Sonuç: {
#   'success': True,
#   'token': 'eyJ0eXAiOiJKV1QiLCJh...',
#   'refresh_token': '559375b93ff144d2...',
#   'user_data': {
#     'number': '41041526',
#     'email': 'mehmetardaozger@gmail.com',
#     'testPlayer': False,
#     'registerDate': '2025-09-07 14:14:11'
#   },
#   'cookies': {...}
# }
```

#### 2. `get_login_token(ssn, password, remember=False)`
Bitalih'e login yapar ve sadece token döndürür.

```python
token = get_login_token("10108926614", "necmuk-tucbov-beMqi6")
# Sonuç: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

#### 3. `get_login_session(ssn, password, remember=False)`
Bitalih'e login yapar ve session objesi döndürür.

```python
session = get_login_session("10108926614", "necmuk-tucbov-beMqi6")
if session:
    print(f"Login durumu: {session.is_logged_in()}")
    print(f"Kullanıcı: {session.get_user_data()['email']}")
    print(f"Token: {session.get_token()}")
```

### Session Objesi Metodları

```python
session = get_login_session("10108926614", "necmuk-tucbov-beMqi6")

# Login durumunu kontrol et
is_logged_in = session.is_logged_in()

# Token'ı al
token = session.get_token()

# Refresh token'ı al
refresh_token = session.get_refresh_token()

# Kullanıcı bilgilerini al
user_data = session.get_user_data()

# Cookie'leri al
cookies = session.get_cookies()

# Session'ı dosyaya kaydet
filename = session.save_session_to_file()

# Logout yap
session.logout()
```

## 🧪 Test Etme

### Login Fonksiyonlarını Test Et

```bash
source venv/bin/activate
python bitalih_login.py test
```

### Örnek Kullanımları Çalıştır

```bash
source venv/bin/activate
python login_example.py
```

### Manuel Login

```bash
source venv/bin/activate
python bitalih_login.py
```

## 📊 Örnek Çıktı

```
🔐 Bitalih Login Kütüphanesi Kullanım Örnekleri
============================================================
🔐 Örnek 1: Basit login
--------------------------------------------------
✅ Login başarılı!
   • Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUz...
   • Kullanıcı No: 41041526
   • Email: mehmetardaozger@gmail.com
   • Test Player: False
   • Register Date: 2025-09-07 14:14:11

🔑 Örnek 2: Sadece token al
--------------------------------------------------
✅ Token alındı!
   • Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUz...
   • Token uzunluğu: 301 karakter

📋 Örnek 3: Session objesi al ve kullan
--------------------------------------------------
✅ Session alındı!
   • Login durumu: True
   • Kullanıcı bilgileri:
     - Email: mehmetardaozger@gmail.com
     - Number: 41041526
     - Test Player: False
   • Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUz...
   • Refresh Token: 559375b93ff144d261617b7259e344...
   • Cookie sayısı: 10
```

## 🔧 Teknik Detaylar

### API Endpoint
- **URL**: `https://www.bitalih.com/api/auth/login`
- **Method**: POST
- **Content-Type**: application/json
- **Data**: `{"ssn": "TC", "password": "Şifre", "remember": false}`

### Response Yapısı
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {
      "number": "41041526",
      "token": "eyJ0eXAiOiJKV1QiLCJh...",
      "refreshToken": "559375b93ff144d2...",
      "testPlayer": false,
      "email": "mehmetardaozger@gmail.com",
      "registerDate": "2025-09-07 14:14:11"
    }
  }
}
```

### Cookie'ler
Login başarılı olduğunda aşağıdaki cookie'ler otomatik olarak ayarlanır:
- `bth_at` - Access token cookie
- `bth_rt` - Refresh token cookie
- `bth_valid_until` - Token geçerlilik süresi
- `platform` - Platform bilgisi

### Hata Yönetimi
- **401 Unauthorized**: Geçersiz kimlik bilgileri
- **Timeout**: Sunucu yanıt vermiyor
- **Network Error**: Bağlantı hatası
- Tüm hatalar yakalanır ve `None` döndürülür

## 🔐 Güvenlik

### Token Kullanımı
```python
# Token'ı Authorization header'ında kullanın
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
```

### Session Kaydetme
```python
# Session'ı güvenli bir şekilde kaydedin
session = get_login_session(ssn, password)
filename = session.save_session_to_file("my_session.json")
```

### Logout
```python
# İşlem tamamlandığında logout yapın
session.logout()
```

## 📝 Notlar

- **Token Süresi**: Token'lar 24 saat geçerlidir
- **Refresh Token**: Token yenileme için kullanılır
- **Remember Me**: Beni hatırla özelliği cookie süresini uzatır
- **Session Dosyası**: Session bilgileri JSON formatında kaydedilir
- **Hata Kodları**: API hata kodları detaylı olarak loglanır

## 🚨 Önemli

- Bu kütüphane sadece login amaçlıdır
- Token'ları güvenli bir şekilde saklayın
- Production'da credential'ları environment variable'larda tutun
- Rate limiting uygulanmamıştır, dikkatli kullanın
- Session dosyalarını güvenli bir yerde saklayın

## 🔗 Entegrasyon

### Bulletin API ile Kullanım
```python
from bitalih_login import get_login_token
from bulletin_request import get_race_horses

# Login yap ve token al
token = get_login_token("10108926614", "necmuk-tucbov-beMqi6")

# Token'ı kullanarak bulletin API'sini çağır
# (Bulletin API'si token gerektiriyorsa)
horses = get_race_horses(988, 6)
```

### Diğer API'ler ile Kullanım
```python
import requests

# Token'ı al
token = get_login_token("10108926614", "necmuk-tucbov-beMqi6")

# Token'ı kullanarak başka API istekleri yap
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get('https://www.bitalih.com/api/some-endpoint', headers=headers)
```
