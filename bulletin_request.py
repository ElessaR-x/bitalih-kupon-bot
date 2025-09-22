#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bitalih Bulletin API Kütüphanesi
Bu kütüphane Bitalih sitesine POST isteği yaparak bulletin verilerini çeker.
Dışarıdan çağrılabilir fonksiyonlar ile race ID ve ayak numarası alıp atlar ve oranlarını döndürür.
"""

import requests
import json
import time
from datetime import datetime


class BitalihBulletinRequest:
    def __init__(self):
        """Bulletin request sınıfını başlatır."""
        self.session = requests.Session()
        self.setup_session()
    
    def setup_session(self):
        """Session ayarlarını yapar."""
        # User-Agent ve diğer header'ları ayarla
        self.session.headers.update({
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.bitalih.com',
            'Referer': 'https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/greyville-guney-afrika',
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
        
        # Cookie'leri ayarla
        cookies = {
            'platform': 'web',
            'LaVisitorNew': 'Y',
            'LaVisitorId_Yml0YWxpaC5sYWRlc2suY29tLw': 'sqvou6bqprs92ud41sfl69uj8b2d7efg',
            'LaSID': '89mdfne9nmzc918egyizfk1p79a3ku2h',
            '_gcl_au': '1.1.96631517.1758110462',
            '_ga': 'GA1.1.327758038.1758110446',
            '_fbp': 'fb.1.1758110719848.655979332806927605',
            '_tt_enable_cookie': '1',
            '_ttp': '01K5BS17XYPQSK9DWB6YSG3M5J_.tt.1',
            '_clck': 'qyj9sz%5E2%5Efze%5E0%5E2086',
            '_ym_uid': '1758110720675645929',
            '_ym_d': '1758110720',
            '_ym_isad': '2',
            '_ym_visorc': 'w',
            'popup_history': '%7B%2229%22%3A%7B%22timestamp%22%3A1758112335866%2C%22expires%22%3A1765888335866%7D%7D',
            'bth_valid_until': '1758114306002',
            'LaUserDetails': '%7B%22email%22%3A%22mehmetozger64%40hotmail.com%22%2C%22firstName%22%3A%22Mehmet%22%2C%22lastName%22%3A%22%C3%96zger%22%2C%22phone%22%3A%225355192962%22%2C%22t_uyeno%22%3A%2282508489%22%7D',
            'ttcsid': '1758110719935::_yn36dggXoGiEna5909I.1.1758114010507.0',
            'MgidSensorNVis': '52',
            'MgidSensorHref': 'https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/greyville-guney-afrika',
            'ttcsid_CUBLMERC77UALAVP2M10': '1758110719935::jCnrd_euIfsEklhMLQvc.1.1758114010717.0',
            '_clsk': '1urcar6%5E1758114011859%5E11%5E1%5Ez.clarity.ms%2Fcollect',
            '_ga_0E4P7ZF1VD': 'GS2.1.s1758110445$o1$g1$t1758114168$j60$l0$h1733957727'
        }
        
        # Cookie'leri session'a ekle
        for name, value in cookies.items():
            self.session.cookies.set(name, value)
        
        print("✅ Session ayarları tamamlandı")
    
    def make_bulletin_request(self, race_id=988, request_type="fob"):
        """
        Bulletin API'sine istek yapar.
        
        Args:
            race_id (int): Yarış ID'si (varsayılan: 988)
            request_type (str): İstek tipi (varsayılan: "fob")
            
        Returns:
            dict: API yanıtı veya None
        """
        try:
            print(f"🔍 Bulletin API isteği yapılıyor...")
            print(f"   • Race ID: {race_id}")
            print(f"   • Request Type: {request_type}")
            
            # API URL'i
            url = f"https://www.bitalih.com/api/tjk/race/{race_id}/bulletin"
            
            # Request verisi
            data = {
                "type": request_type
            }
            
            print(f"📡 URL: {url}")
            print(f"📊 Data: {json.dumps(data, indent=2)}")
            
            # POST isteği yap
            response = self.session.post(url, json=data, timeout=30)
            
            print(f"📈 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ İstek başarılı!")
                return result
            else:
                print(f"❌ İstek başarısız - HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Hata Detayı: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                except:
                    print(f"❌ Hata Detayı: {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            print("❌ İstek timeout - Sunucu yanıt vermiyor")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ İstek hatası: {e}")
            return None
        except Exception as e:
            print(f"❌ Beklenmeyen hata: {e}")
            return None
    
    def save_response_to_file(self, response_data, filename=None):
        """
        API yanıtını dosyaya kaydeder.
        
        Args:
            response_data (dict): API yanıtı
            filename (str): Dosya adı (opsiyonel)
        """
        try:
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"bulletin_response_{timestamp}.json"
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(response_data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Yanıt dosyaya kaydedildi: {filename}")
            
        except Exception as e:
            print(f"❌ Dosya kaydetme hatası: {e}")
    
    def display_response_summary(self, response_data):
        """
        API yanıtının özetini gösterir.
        
        Args:
            response_data (dict): API yanıtı
        """
        try:
            if not response_data:
                print("❌ Gösterilecek veri yok")
                return
            
            print(f"\n📋 BULLETIN YANITI ÖZETİ")
            print("=" * 50)
            
            # Temel bilgiler
            if isinstance(response_data, dict):
                print(f"📊 Veri Tipi: Dictionary")
                print(f"📊 Ana Anahtarlar: {list(response_data.keys())}")
                
                # Başarı durumu
                if 'success' in response_data:
                    print(f"✅ Başarı Durumu: {response_data['success']}")
                
                # Data anahtarı varsa
                if 'data' in response_data:
                    data = response_data['data']
                    if isinstance(data, dict):
                        print(f"📊 Data Anahtarları: {list(data.keys())}")
                    elif isinstance(data, list):
                        print(f"📊 Data Eleman Sayısı: {len(data)}")
                
                # Mesaj varsa
                if 'message' in response_data:
                    print(f"💬 Mesaj: {response_data['message']}")
                
                # Toplam veri boyutu
                json_str = json.dumps(response_data, ensure_ascii=False)
                print(f"📏 Veri Boyutu: {len(json_str)} karakter")
                
            elif isinstance(response_data, list):
                print(f"📊 Veri Tipi: List")
                print(f"📊 Eleman Sayısı: {len(response_data)}")
            
            print("-" * 50)
            
        except Exception as e:
            print(f"❌ Özet gösterilirken hata: {e}")
    
    def get_race_horses(self, race_id, race_number):
        """
        Belirtilen race ID ve ayak numarası için atları ve oranlarını döndürür.
        
        Args:
            race_id (int): Yarış ID'si
            race_number (int): Ayak numarası
            
        Returns:
            dict: At bilgileri veya None
        """
        try:
            # Bulletin isteği yap
            response_data = self.make_bulletin_request(race_id, "fob")
            
            if not response_data or not response_data.get('success'):
                return None
            
            # Race verilerini al
            race_data = response_data.get('data', {}).get('race', {})
            if not race_data:
                return None
            
            # Runs array'ini al
            runs = race_data.get('runs', [])
            if not runs:
                return None
            
            # Belirtilen ayak numarasını bul
            race_info = None
            for run in runs:
                if run.get('number') == race_number:
                    race_info = run
                    break
            
            if not race_info:
                return None
            
            # At bilgilerini çıkar
            horses = race_info.get('horses', [])
            horses_info = []
            
            for horse in horses:
                horse_info = {
                    'horse_no': horse.get('no'),
                    'horse_name': horse.get('name'),
                    'odds': horse.get('fixedOdd'),
                    'jockey': horse.get('jockeyName'),
                    'trainer': horse.get('coachName'),
                    'weight': horse.get('weight'),
                    'age': horse.get('age'),
                    'sex': horse.get('gender')
                }
                horses_info.append(horse_info)
            
            return {
                'race_id': race_id,
                'race_number': race_number,
                'race_name': race_info.get('info'),
                'race_time': race_info.get('time'),
                'horses': horses_info,
                'total_horses': len(horses_info)
            }
            
        except Exception as e:
            print(f"❌ At bilgileri alınırken hata: {e}")
            return None
    
    def get_all_races(self, race_id):
        """
        Belirtilen race ID için tüm ayakları ve at bilgilerini döndürür.
        
        Args:
            race_id (int): Yarış ID'si
            
        Returns:
            dict: Tüm ayak bilgileri veya None
        """
        try:
            # Bulletin isteği yap
            response_data = self.make_bulletin_request(race_id, "fob")
            
            if not response_data or not response_data.get('success'):
                return None
            
            # Race verilerini al
            race_data = response_data.get('data', {}).get('race', {})
            if not race_data:
                return None
            
            # Runs array'ini al
            runs = race_data.get('runs', [])
            if not runs:
                return None
            
            all_races = []
            
            for run in runs:
                race_number = run.get('number')
                horses = run.get('horses', [])
                horses_info = []
                
                for horse in horses:
                    horse_info = {
                        'horse_no': horse.get('no'),
                        'horse_name': horse.get('name'),
                        'odds': horse.get('fixedOdd'),
                        'jockey': horse.get('jockeyName'),
                        'trainer': horse.get('coachName'),
                        'weight': horse.get('weight'),
                        'age': horse.get('age'),
                        'sex': horse.get('gender')
                    }
                    horses_info.append(horse_info)
                
                race_info = {
                    'race_number': race_number,
                    'race_name': run.get('info'),
                    'race_time': run.get('time'),
                    'horses': horses_info,
                    'total_horses': len(horses_info)
                }
                all_races.append(race_info)
            
            return {
                'race_id': race_id,
                'races': all_races,
                'total_races': len(all_races)
            }
            
        except Exception as e:
            print(f"❌ Tüm ayak bilgileri alınırken hata: {e}")
            return None
    
    def run(self, race_id=988, request_type="fob", save_to_file=True):
        """
        Ana fonksiyon - bulletin isteğini yapar.
        
        Args:
            race_id (int): Yarış ID'si
            request_type (str): İstek tipi
            save_to_file (bool): Yanıtı dosyaya kaydet
        """
        try:
            print("🚀 Bitalih Bulletin Request başlatılıyor...")
            print(f"⏰ Başlangıç Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("-" * 60)
            
            # Bulletin isteği yap
            response_data = self.make_bulletin_request(race_id, request_type)
            
            if response_data:
                # Yanıt özetini göster
                self.display_response_summary(response_data)
                
                # Dosyaya kaydet
                if save_to_file:
                    self.save_response_to_file(response_data)
                
                print(f"\n✅ İşlem tamamlandı!")
                print(f"⏰ Bitiş Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                return response_data
            else:
                print(f"\n❌ İşlem başarısız!")
                return None
                
        except Exception as e:
            print(f"❌ Ana fonksiyon hatası: {e}")
            return None
    
    def get_available_race_numbers(self, race_id):
        """
        Belirtilen race ID için mevcut ayak numaralarını döndürür.
        
        Args:
            race_id (int): Yarış ID'si
            
        Returns:
            list: Mevcut ayak numaraları veya None
        """
        try:
            all_races = self.get_all_races(race_id)
            if not all_races:
                return None
            
            race_numbers = [race['race_number'] for race in all_races['races']]
            return sorted(race_numbers)
            
        except Exception as e:
            print(f"❌ Ayak numarası alma hatası: {e}")
            return None


def main():
    """Ana fonksiyon."""
    print("🏇 Bitalih Bulletin API İsteği")
    print("="*50)
    print("Bu uygulama Bitalih sitesine bulletin isteği yapar.")
    print("-"*50)
    
    # Kullanıcıdan parametreleri al
    try:
        race_id_input = input("Yarış ID'si [varsayılan: 988]: ").strip()
        race_id = int(race_id_input) if race_id_input else 988
        
        request_type_input = input("İstek tipi [varsayılan: fob]: ").strip()
        request_type = request_type_input if request_type_input else "fob"
        
        save_input = input("Yanıtı dosyaya kaydet? (e/h) [varsayılan: e]: ").strip().lower()
        save_to_file = save_input in ['', 'e', 'evet', 'y', 'yes']
        
    except KeyboardInterrupt:
        print("\n⏹️ İşlem iptal edildi")
        return
    except ValueError:
        print("❌ Geçersiz değer girildi")
        return
    
    # Bulletin request'i başlat
    bulletin_request = BitalihBulletinRequest()
    
    try:
        # İsteği yap
        result = bulletin_request.run(
            race_id=race_id,
            request_type=request_type,
            save_to_file=save_to_file
        )
        
        if result:
            print("\n🎉 İşlem başarıyla tamamlandı!")
        else:
            print("\n❌ İşlem başarısız!")
            
    except KeyboardInterrupt:
        print("\n⏹️ İşlem kullanıcı tarafından durduruldu")
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")


# =============================================================================
# KÜTÜPHANE FONKSİYONLARI - DIŞARIDAN ÇAĞRILABİLİR
# =============================================================================

def get_race_horses(race_id, race_number):
    """
    Belirtilen race ID ve ayak numarası için atları ve oranlarını döndürür.
    
    Args:
        race_id (int): Yarış ID'si
        race_number (int): Ayak numarası
        
    Returns:
        dict: At bilgileri veya None
        
    Example:
        >>> horses = get_race_horses(988, 1)
        >>> print(horses['horses'][0]['horse_name'])
    """
    try:
        bulletin_request = BitalihBulletinRequest()
        return bulletin_request.get_race_horses(race_id, race_number)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def get_all_races(race_id):
    """
    Belirtilen race ID için tüm ayakları ve at bilgilerini döndürür.
    
    Args:
        race_id (int): Yarış ID'si
        
    Returns:
        dict: Tüm ayak bilgileri veya None
        
    Example:
        >>> all_races = get_all_races(988)
        >>> print(f"Toplam {all_races['total_races']} ayak bulundu")
    """
    try:
        bulletin_request = BitalihBulletinRequest()
        return bulletin_request.get_all_races(race_id)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def get_horse_odds(race_id, race_number, horse_number):
    """
    Belirtilen at için oran bilgisini döndürür.
    
    Args:
        race_id (int): Yarış ID'si
        race_number (int): Ayak numarası
        horse_number (int): At numarası
        
    Returns:
        float: At oranı veya None
        
    Example:
        >>> odds = get_horse_odds(988, 1, 5)
        >>> print(f"5 numaralı atın oranı: {odds}")
    """
    try:
        race_data = get_race_horses(race_id, race_number)
        if not race_data:
            return None
        
        for horse in race_data['horses']:
            if horse['horse_no'] == horse_number:
                return horse['odds']
        
        return None
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def get_race_info(race_id, race_number):
    """
    Belirtilen ayak için genel bilgileri döndürür.
    
    Args:
        race_id (int): Yarış ID'si
        race_number (int): Ayak numarası
        
    Returns:
        dict: Ayak genel bilgileri veya None
        
    Example:
        >>> info = get_race_info(988, 1)
        >>> print(f"Ayak adı: {info['race_name']}")
    """
    try:
        race_data = get_race_horses(race_id, race_number)
        if not race_data:
            return None
        
        return {
            'race_id': race_data['race_id'],
            'race_number': race_data['race_number'],
            'race_name': race_data['race_name'],
            'race_time': race_data['race_time'],
            'total_horses': race_data['total_horses']
        }
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def get_available_race_numbers(race_id):
    """
    Belirtilen race ID için mevcut ayak numaralarını döndürür.
    
    Args:
        race_id (int): Yarış ID'si
        
    Returns:
        list: Mevcut ayak numaraları veya None
        
    Example:
        >>> race_numbers = get_available_race_numbers(988)
        >>> print(f"Mevcut ayaklar: {race_numbers}")
    """
    try:
        all_races = get_all_races(race_id)
        if not all_races:
            return None
        
        race_numbers = [race['race_number'] for race in all_races['races']]
        return sorted(race_numbers)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


# =============================================================================
# TEST FONKSİYONLARI
# =============================================================================

def test_library_functions():
    """Kütüphane fonksiyonlarını test eder."""
    print("🧪 Kütüphane fonksiyonları test ediliyor...")
    print("-" * 50)
    
    race_id = 988
    
    # Test 1: Mevcut ayak numaralarını al
    print("1️⃣ Mevcut ayak numaraları alınıyor...")
    race_numbers = get_available_race_numbers(race_id)
    if race_numbers:
        print(f"✅ Mevcut ayaklar: {race_numbers}")
        
        # Test 2: İlk ayak için at bilgilerini al
        first_race = race_numbers[0]
        print(f"\n2️⃣ {first_race}. ayak için at bilgileri alınıyor...")
        horses = get_race_horses(race_id, first_race)
        if horses:
            print(f"✅ {horses['total_horses']} at bulundu")
            print(f"   Ayak adı: {horses['race_name']}")
            
            # Test 3: İlk at için oran bilgisini al
            if horses['horses']:
                first_horse = horses['horses'][0]
                print(f"\n3️⃣ {first_horse['horse_no']} numaralı at için oran bilgisi alınıyor...")
                odds = get_horse_odds(race_id, first_race, first_horse['horse_no'])
                if odds:
                    print(f"✅ At: {first_horse['horse_name']}, Oran: {odds}")
                
                # Test 4: Ayak genel bilgilerini al
                print(f"\n4️⃣ {first_race}. ayak genel bilgileri alınıyor...")
                race_info = get_race_info(race_id, first_race)
                if race_info:
                    print(f"✅ Ayak bilgileri: {race_info}")
        else:
            print("❌ At bilgileri alınamadı")
    else:
        print("❌ Ayak numaraları alınamadı")
    
    print("\n🎉 Test tamamlandı!")


if __name__ == "__main__":
    # Test modu kontrolü
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_library_functions()
    else:
        main()
