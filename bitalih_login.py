#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bitalih Login API Kütüphanesi
Bu kütüphane Bitalih sitesine HTTP request ile login yapar ve token döndürür.
"""

import requests
import json
import time
from datetime import datetime


class BitalihLogin:
    def __init__(self):
        """Login sınıfını başlatır."""
        self.session = requests.Session()
        self.setup_session()
        self.token = None
        self.refresh_token = None
        self.user_data = None
    
    def setup_session(self):
        """Session ayarlarını yapar."""
        # User-Agent ve diğer header'ları ayarla
        self.session.headers.update({
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.bitalih.com',
            'Referer': 'https://www.bitalih.com/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Accept-Language': 'tr-TR,tr;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Priority': 'u=1, i'
        })
        
        # Başlangıç cookie'lerini ayarla
        initial_cookies = {
            'platform': 'web',
            'MgidSensorNVis': '1',
            'MgidSensorHref': 'https://www.bitalih.com/',
            'LaVisitorNew': 'Y',
            'LaVisitorId_Yml0YWxpaC5sYWRlc2suY29tLw': 'sqvou6bqprs92ud41sfl69uj8b2d7efg',
            'LaSID': '89mdfne9nmzc918egyizfk1p79a3ku2h',
            'LaUserDetails': '%7B%7D'
        }
        
        # Cookie'leri session'a ekle
        for name, value in initial_cookies.items():
            self.session.cookies.set(name, value)
        
        print("✅ Login session ayarları tamamlandı")
    
    def login(self, ssn, password, remember=False):
        """
        Bitalih'e login yapar.
        
        Args:
            ssn (str): TC kimlik numarası
            password (str): Şifre
            remember (bool): Beni hatırla (varsayılan: False)
            
        Returns:
            dict: Login sonucu veya None
        """
        try:
            print("🔐 Login işlemi başlatılıyor...")
            print(f"   • TC: {ssn}")
            print(f"   • Beni Hatırla: {remember}")
            
            # Login verisi hazırla
            login_data = {
                "ssn": ssn,
                "password": password,
                "remember": remember
            }
            
            # Login API'sini çağır
            login_url = "https://www.bitalih.com/api/auth/login"
            response = self.session.post(login_url, json=login_data, timeout=30)
            
            print(f"📈 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success') and result.get('data', {}).get('success'):
                    print("✅ Login başarılı!")
                    
                    # Token ve kullanıcı bilgilerini al
                    user_data = result.get('data', {}).get('data', {})
                    self.token = user_data.get('token')
                    self.refresh_token = user_data.get('refreshToken')
                    self.user_data = user_data
                    
                    # Token'ı header'a ekle
                    if self.token:
                        self.session.headers.update({
                            'Authorization': f'Bearer {self.token}'
                        })
                    
                    # Cookie'leri güncelle
                    self.update_cookies_from_response(response)
                    
                    print(f"📋 Kullanıcı No: {user_data.get('number', 'Bilinmiyor')}")
                    print(f"📧 Email: {user_data.get('email', 'Bilinmiyor')}")
                    print(f"🔑 Token alındı: {self.token[:20]}...")
                    
                    return {
                        'success': True,
                        'token': self.token,
                        'refresh_token': self.refresh_token,
                        'user_data': user_data,
                        'cookies': self.session.cookies.get_dict()
                    }
                else:
                    print("❌ Login başarısız - Geçersiz kimlik bilgileri")
                    return None
            else:
                print(f"❌ Login başarısız - HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Hata Detayı: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                except:
                    print(f"❌ Hata Detayı: {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            print("❌ Login timeout - Sunucu yanıt vermiyor")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Login hatası: {e}")
            return None
        except Exception as e:
            print(f"❌ Beklenmeyen hata: {e}")
            return None
    
    def update_cookies_from_response(self, response):
        """Response'dan gelen cookie'leri session'a ekler."""
        try:
            # Set-Cookie header'larını al
            set_cookies = response.headers.get('Set-Cookie', '')
            if set_cookies:
                print("🍪 Cookie'ler güncellendi")
        except Exception as e:
            print(f"⚠️ Cookie güncelleme hatası: {e}")
    
    def get_token(self):
        """Mevcut token'ı döndürür."""
        return self.token
    
    def get_refresh_token(self):
        """Mevcut refresh token'ı döndürür."""
        return self.refresh_token
    
    def get_user_data(self):
        """Kullanıcı bilgilerini döndürür."""
        return self.user_data
    
    def get_cookies(self):
        """Mevcut cookie'leri döndürür."""
        return self.session.cookies.get_dict()
    
    def is_logged_in(self):
        """Login durumunu kontrol eder."""
        return self.token is not None
    
    def logout(self):
        """Logout yapar ve token'ları temizler."""
        try:
            print("🚪 Logout yapılıyor...")
            
            # Token'ları temizle
            self.token = None
            self.refresh_token = None
            self.user_data = None
            
            # Authorization header'ını kaldır
            if 'Authorization' in self.session.headers:
                del self.session.headers['Authorization']
            
            # Session'ı temizle
            self.session.cookies.clear()
            
            print("✅ Logout başarılı")
            return True
            
        except Exception as e:
            print(f"❌ Logout hatası: {e}")
            return False
    
    def save_session_to_file(self, filename=None):
        """Session bilgilerini dosyaya kaydeder."""
        try:
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"bitalih_session_{timestamp}.json"
            
            session_data = {
                'token': self.token,
                'refresh_token': self.refresh_token,
                'user_data': self.user_data,
                'cookies': self.get_cookies(),
                'timestamp': datetime.now().isoformat()
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(session_data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Session dosyaya kaydedildi: {filename}")
            return filename
            
        except Exception as e:
            print(f"❌ Session kaydetme hatası: {e}")
            return None
    
    def load_session_from_file(self, filename):
        """Dosyadan session bilgilerini yükler."""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                session_data = json.load(f)
            
            self.token = session_data.get('token')
            self.refresh_token = session_data.get('refresh_token')
            self.user_data = session_data.get('user_data')
            
            # Cookie'leri yükle
            cookies = session_data.get('cookies', {})
            for name, value in cookies.items():
                self.session.cookies.set(name, value)
            
            # Token'ı header'a ekle
            if self.token:
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
            
            print(f"📂 Session dosyadan yüklendi: {filename}")
            return True
            
        except Exception as e:
            print(f"❌ Session yükleme hatası: {e}")
            return False


# =============================================================================
# KÜTÜPHANE FONKSİYONLARI - DIŞARIDAN ÇAĞRILABİLİR
# =============================================================================

def login_to_bitalih(ssn, password, remember=False):
    """
    Bitalih'e login yapar ve token döndürür.
    
    Args:
        ssn (str): TC kimlik numarası
        password (str): Şifre
        remember (bool): Beni hatırla (varsayılan: False)
        
    Returns:
        dict: Login sonucu veya None
        
    Example:
        >>> result = login_to_bitalih("10108926614", "necmuk-tucbov-beMqi6")
        >>> if result:
        ...     print(f"Token: {result['token']}")
    """
    try:
        login_client = BitalihLogin()
        return login_client.login(ssn, password, remember)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def get_login_token(ssn, password, remember=False):
    """
    Bitalih'e login yapar ve sadece token döndürür.
    
    Args:
        ssn (str): TC kimlik numarası
        password (str): Şifre
        remember (bool): Beni hatırla (varsayılan: False)
        
    Returns:
        str: Token veya None
        
    Example:
        >>> token = get_login_token("10108926614", "necmuk-tucbov-beMqi6")
        >>> print(f"Token: {token}")
    """
    try:
        result = login_to_bitalih(ssn, password, remember)
        return result.get('token') if result else None
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def get_login_session(ssn, password, remember=False):
    """
    Bitalih'e login yapar ve session objesi döndürür.
    
    Args:
        ssn (str): TC kimlik numarası
        password (str): Şifre
        remember (bool): Beni hatırla (varsayılan: False)
        
    Returns:
        BitalihLogin: Login session objesi veya None
        
    Example:
        >>> session = get_login_session("10108926614", "necmuk-tucbov-beMqi6")
        >>> if session:
        ...     print(f"Kullanıcı: {session.get_user_data()['email']}")
    """
    try:
        login_client = BitalihLogin()
        result = login_client.login(ssn, password, remember)
        return login_client if result else None
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


# =============================================================================
# TEST FONKSİYONLARI
# =============================================================================

def test_login_functions():
    """Login fonksiyonlarını test eder."""
    print("🧪 Login fonksiyonları test ediliyor...")
    print("-" * 50)
    
    # Test verileri (gerçek veriler kullanmayın!)
    test_ssn = "10108926614"
    test_password = "necmuk-tucbov-beMqi6"
    
    # Test 1: Basit login
    print("1️⃣ Basit login testi...")
    result = login_to_bitalih(test_ssn, test_password)
    if result:
        print(f"✅ Login başarılı!")
        print(f"   • Token: {result['token'][:20]}...")
        print(f"   • Kullanıcı No: {result['user_data']['number']}")
        print(f"   • Email: {result['user_data']['email']}")
    else:
        print("❌ Login başarısız")
    
    # Test 2: Sadece token al
    print(f"\n2️⃣ Sadece token alma testi...")
    token = get_login_token(test_ssn, test_password)
    if token:
        print(f"✅ Token alındı: {token[:20]}...")
    else:
        print("❌ Token alınamadı")
    
    # Test 3: Session objesi al
    print(f"\n3️⃣ Session objesi alma testi...")
    session = get_login_session(test_ssn, test_password)
    if session:
        print(f"✅ Session alındı")
        print(f"   • Login durumu: {session.is_logged_in()}")
        print(f"   • Kullanıcı bilgileri: {session.get_user_data()['email']}")
        
        # Session'ı dosyaya kaydet
        filename = session.save_session_to_file()
        if filename:
            print(f"   • Session kaydedildi: {filename}")
    else:
        print("❌ Session alınamadı")
    
    print("\n🎉 Test tamamlandı!")


def main():
    """Ana fonksiyon."""
    print("🔐 Bitalih Login API")
    print("="*50)
    print("Bu uygulama Bitalih sitesine HTTP request ile login yapar.")
    print("-"*50)
    
    # Kullanıcıdan login bilgilerini al
    try:
        ssn = input("TC Kimlik No: ").strip()
        password = input("Şifre: ").strip()
        
        remember_input = input("Beni hatırla? (e/h) [varsayılan: h]: ").strip().lower()
        remember = remember_input in ['e', 'evet', 'y', 'yes']
        
        if not ssn or not password:
            print("❌ TC Kimlik No ve şifre gerekli!")
            return
        
    except KeyboardInterrupt:
        print("\n⏹️ İşlem iptal edildi")
        return
    
    # Login yap
    login_client = BitalihLogin()
    
    try:
        result = login_client.login(ssn, password, remember)
        
        if result:
            print(f"\n🎉 Login başarılı!")
            print(f"⏰ Zaman: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Session'ı dosyaya kaydet
            save_input = input("\nSession'ı dosyaya kaydet? (e/h) [varsayılan: e]: ").strip().lower()
            if save_input in ['', 'e', 'evet', 'y', 'yes']:
                filename = login_client.save_session_to_file()
                if filename:
                    print(f"💾 Session kaydedildi: {filename}")
        else:
            print(f"\n❌ Login başarısız!")
            
    except KeyboardInterrupt:
        print("\n⏹️ İşlem kullanıcı tarafından durduruldu")
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")


if __name__ == "__main__":
    # Test modu kontrolü
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_login_functions()
    else:
        main()
