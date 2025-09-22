#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bitalih Kupon API Kütüphanesi
Bu kütüphane Bitalih sitesine HTTP request ile kupon oynar ve sonuç döndürür.
"""

import requests
import json
import time
from datetime import datetime


class BitalihCoupon:
    def __init__(self, token=None, cookies=None):
        """
        Kupon sınıfını başlatır.
        
        Args:
            token (str): Login token'ı
            cookies (dict): Login cookie'leri
        """
        self.session = requests.Session()
        self.token = token
        self.setup_session(cookies)
    
    def setup_session(self, cookies=None):
        """Session ayarlarını yapar."""
        # User-Agent ve diğer header'ları ayarla
        self.session.headers.update({
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.bitalih.com',
            'Referer': 'https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/istanbul',
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
        
        # Token'ı header'a ekle
        if self.token:
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
        
        # Cookie'leri ayarla
        if cookies:
            for name, value in cookies.items():
                self.session.cookies.set(name, value)
        else:
            # Varsayılan cookie'ler
            default_cookies = {
                'platform': 'web',
                'LaVisitorNew': 'Y',
                'LaVisitorId_Yml0YWxpaC5sYWRlc2suY29tLw': 'sqvou6bqprs92ud41sfl69uj8b2d7efg',
                'LaSID': '89mdfne9nmzc918egyizfk1p79a3ku2h',
                'MgidSensorNVis': '4',
                'MgidSensorHref': 'https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/istanbul'
            }
            
            for name, value in default_cookies.items():
                self.session.cookies.set(name, value)
        
        print("✅ Kupon session ayarları tamamlandı")
    
    def validate_coupon(self, runners, amount, multiplier, odd_at_play):
        """
        Kuponu doğrular (validate eder).
        
        Args:
            runners (list): At bilgileri listesi
            amount (str): Bahis miktarı
            multiplier (int): Çarpan
            odd_at_play (str): Oynanan oran
            
        Returns:
            dict: Doğrulama sonucu veya None
        """
        try:
            # Kupon verisi hazırla
            coupon_data = {
                "runners": runners,
                "amount": amount,
                "multiplier": multiplier,
                "complete": False,
                "oddAtPlay": odd_at_play,
                "count": 1
            }
            
            # Validate API'sini çağır
            validate_url = "https://www.bitalih.com/api/tjk/coupon/fob/play/validate"
            response = self.session.post(validate_url, json=coupon_data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    # Runner durumlarını kontrol et
                    data = result.get('data', [])
                    for item in data:
                        is_started = item.get('isStartedRun', False)
                        
                        if is_started:
                            return None
                    
                    return result
                else:
                    return None
            else:
                return None
                
        except requests.exceptions.Timeout:
            print("❌ Kupon doğrulaması timeout - Sunucu yanıt vermiyor")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Kupon doğrulaması hatası: {e}")
            return None
        except Exception as e:
            print(f"❌ Beklenmeyen hata: {e}")
            return None
    
    def play_coupon(self, runners, amount, multiplier, odd_at_play):
        """
        Kuponu oynar.
        
        Args:
            runners (list): At bilgileri listesi
            amount (str): Bahis miktarı
            multiplier (int): Çarpan
            odd_at_play (str): Oynanan oran
            
        Returns:
            dict: Kupon oynama sonucu veya None
        """
        try:
            # Kupon verisi hazırla
            coupon_data = {
                "runners": runners,
                "amount": amount,
                "multiplier": multiplier,
                "complete": False,
                "oddAtPlay": odd_at_play,
                "count": 1
            }
            
            # Play API'sini çağır
            play_url = "https://www.bitalih.com/api/tjk/coupon/fob/play"
            response = self.session.post(play_url, json=coupon_data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    return result
                else:
                    return None
            else:
                return None
                
        except requests.exceptions.Timeout:
            print("❌ Kupon oynama timeout - Sunucu yanıt vermiyor")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Kupon oynama hatası: {e}")
            return None
        except Exception as e:
            print(f"❌ Beklenmeyen hata: {e}")
            return None
    
    def play_coupon_with_validation(self, runners, amount, multiplier, odd_at_play):
        """
        Kuponu önce doğrular, sonra oynar.
        
        Args:
            runners (list): At bilgileri listesi
            amount (str): Bahis miktarı
            multiplier (int): Çarpan
            odd_at_play (str): Oynanan oran
            
        Returns:
            dict: Kupon oynama sonucu veya None
        """
        try:
            # Önce doğrula
            validation_result = self.validate_coupon(runners, amount, multiplier, odd_at_play)
            
            if not validation_result:
                return None
            
            # Doğrulama başarılı, kuponu oyna
            play_result = self.play_coupon(runners, amount, multiplier, odd_at_play)
            
            return play_result
            
        except Exception as e:
            print(f"❌ Kupon doğrulama ve oynama hatası: {e}")
            return None
    
    def create_runners(self, selections):
        """
        Seçimlerden runner listesi oluşturur.
        
        Args:
            selections (list): Seçim listesi [{"raceId": 978, "runNo": 3, "horseNo": 1}, ...]
            
        Returns:
            list: Runner listesi
        """
        runners = []
        for selection in selections:
            runner = {
                "raceId": selection.get("raceId"),
                "runNo": selection.get("runNo"),
                "horseNo": selection.get("horseNo")
            }
            runners.append(runner)
        
        return runners
    
    def calculate_potential_win(self, amount, odd_at_play):
        """
        Potansiyel kazancı hesaplar.
        
        Args:
            amount (str): Bahis miktarı
            odd_at_play (str): Oran
            
        Returns:
            float: Potansiyel kazanç
        """
        try:
            return float(amount) * float(odd_at_play)
        except (ValueError, TypeError):
            return 0.0


# =============================================================================
# KÜTÜPHANE FONKSİYONLARI - DIŞARIDAN ÇAĞRILABİLİR
# =============================================================================

def play_coupon(token, cookies, runners, amount, multiplier, odd_at_play):
    """
    Kuponu oynar.
    
    Args:
        token (str): Login token'ı
        cookies (dict): Login cookie'leri
        runners (list): At bilgileri listesi
        amount (str): Bahis miktarı
        multiplier (int): Çarpan
        odd_at_play (str): Oynanan oran
        
    Returns:
        dict: Kupon oynama sonucu veya None
        
    Example:
        >>> runners = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
        >>> result = play_coupon(token, cookies, runners, "29", 29, "88.00")
    """
    try:
        coupon_client = BitalihCoupon(token, cookies)
        return coupon_client.play_coupon(runners, amount, multiplier, odd_at_play)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def play_coupon_with_validation(token, cookies, runners, amount, multiplier, odd_at_play):
    """
    Kuponu önce doğrular, sonra oynar.
    
    Args:
        token (str): Login token'ı
        cookies (dict): Login cookie'leri
        runners (list): At bilgileri listesi
        amount (str): Bahis miktarı
        multiplier (int): Çarpan
        odd_at_play (str): Oynanan oran
        
    Returns:
        dict: Kupon oynama sonucu veya None
        
    Example:
        >>> runners = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
        >>> result = play_coupon_with_validation(token, cookies, runners, "29", 29, "88.00")
    """
    try:
        coupon_client = BitalihCoupon(token, cookies)
        return coupon_client.play_coupon_with_validation(runners, amount, multiplier, odd_at_play)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def validate_coupon(token, cookies, runners, amount, multiplier, odd_at_play):
    """
    Kuponu doğrular.
    
    Args:
        token (str): Login token'ı
        cookies (dict): Login cookie'leri
        runners (list): At bilgileri listesi
        amount (str): Bahis miktarı
        multiplier (int): Çarpan
        odd_at_play (str): Oynanan oran
        
    Returns:
        dict: Doğrulama sonucu veya None
        
    Example:
        >>> runners = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
        >>> result = validate_coupon(token, cookies, runners, "29", 29, "88.00")
    """
    try:
        coupon_client = BitalihCoupon(token, cookies)
        return coupon_client.validate_coupon(runners, amount, multiplier, odd_at_play)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


def create_runners(selections):
    """
    Seçimlerden runner listesi oluşturur.
    
    Args:
        selections (list): Seçim listesi
        
    Returns:
        list: Runner listesi
        
    Example:
        >>> selections = [{"raceId": 978, "runNo": 3, "horseNo": 1}]
        >>> runners = create_runners(selections)
    """
    try:
        coupon_client = BitalihCoupon()
        return coupon_client.create_runners(selections)
    except Exception as e:
        print(f"❌ Kütüphane fonksiyonu hatası: {e}")
        return None


# =============================================================================
# TEST FONKSİYONLARI
# =============================================================================

def test_coupon_functions():
    """Kupon fonksiyonlarını test eder."""
    print("🧪 Kupon fonksiyonları test ediliyor...")
    print("-" * 50)
    
    # Test verileri
    test_runners = [
        {"raceId": 978, "runNo": 3, "horseNo": 1},
        {"raceId": 978, "runNo": 8, "horseNo": 3}
    ]
    test_amount = "29"
    test_multiplier = 29
    test_odd_at_play = "88.00"
    
    # Test token ve cookie'leri (gerçek veriler gerekli)
    test_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."  # Gerçek token gerekli
    test_cookies = {
        "bth_at": "U2FsdGVkX1%2Fx%2BNiUVSHBnotO5XZ3lBRjcT%2BRf%2FGrSKw0Kh7XpAhYaKWhYKVD%2BmBeJKVZzPwDynurAYSiOu%2B3pxy1MZ82O0CW9l6TYxEZFBV2diUGVG7eF5tFvKVNKI5EQ5ZXwhvidPP25t9Z4qasJCNQJPMwfFryYRYu1Q8DyQFJfLox%2Fi5ZRQNqeH17aTbdxd8PslkI4Gc9J8B7udZNQuvixa0SMIVMdqi5nO3xnRf9gO6IpcAF63UzDdf0r9KVvtrZPMrqdtjOkohxH1DuImZk%2F5mEicu0Fjd%2B4531IMCLyvTdnPtcX0wsaMsKjN6rRQhNkaf%2Bts3BlkIgUT28qCc80P3xf8gK8ZnzG4Y7UmmZvQX3qbb7gsBCYIRaAIRkzrFTZbYCPqq%2Bj2NqB6KCUrMAjiqFd1339o842nwzW0tN63sh2bxnlGEsRCSDOcjFxOR4h3e12F1ZblcHtvmMYO%2FCcD25VfRprmpFLDHgNUqwczF5EAQfeXiKgrz17yMGEBXzxawADGDRqnjreJWNIx5CQvhmKAhIQt%2FYhtoW31fKd5lCkKJaH4cjZL9SG1Np",
        "bth_rt": "U2FsdGVkX19hYF1vhly05jtK6tpHgDtwbMKR3S%2BgktBYFc5qnyfUwrkunf4kQftW54oIPCpwJF6ewKTke%2FZ2uSYGEs97G7zpcpobq1FjwrJnO%2FC61NS1BgrtEc1fr8HQBNZpmQAJ6sAx5pVs6IrJ5A%3D%3D",
        "bth_valid_until": "1758108234592"
    }
    
    # Test 1: Runner oluşturma
    print("1️⃣ Runner oluşturma testi...")
    runners = create_runners(test_runners)
    if runners:
        print(f"✅ Runner'lar oluşturuldu: {runners}")
    else:
        print("❌ Runner'lar oluşturulamadı")
    
    # Test 2: Kupon doğrulama (token olmadan)
    print(f"\n2️⃣ Kupon doğrulama testi...")
    coupon_client = BitalihCoupon()
    validation_result = coupon_client.validate_coupon(test_runners, test_amount, test_multiplier, test_odd_at_play)
    if validation_result:
        print(f"✅ Kupon doğrulaması başarılı")
    else:
        print(f"❌ Kupon doğrulaması başarısız (token gerekli olabilir)")
    
    print("\n🎉 Test tamamlandı!")
    print("💡 Gerçek kupon oynama için geçerli token ve cookie'ler gerekli")


def main():
    """Ana fonksiyon."""
    print("🎯 Bitalih Kupon API")
    print("="*50)
    print("Bu uygulama Bitalih sitesine HTTP request ile kupon oynar.")
    print("-"*50)
    
    # Kullanıcıdan kupon bilgilerini al
    try:
        print("\n📋 Kupon Bilgileri:")
        
        # Race ID
        race_id = input("Race ID [varsayılan: 978]: ").strip()
        if not race_id:
            race_id = 978
        else:
            race_id = int(race_id)
        
        # Seçimler
        selections = []
        print("\n🏇 At Seçimleri:")
        
        while True:
            run_no = input("Ayak numarası (çıkmak için 'q'): ").strip()
            if run_no.lower() == 'q':
                break
            
            horse_no = input("At numarası: ").strip()
            
            try:
                selection = {
                    "raceId": race_id,
                    "runNo": int(run_no),
                    "horseNo": int(horse_no)
                }
                selections.append(selection)
                print(f"✅ Seçim eklendi: {run_no}. ayak, {horse_no} numaralı at")
            except ValueError:
                print("❌ Geçersiz numara")
        
        if not selections:
            print("❌ En az bir seçim gerekli!")
            return
        
        # Bahis miktarı
        amount = input("\n💰 Bahis miktarı (TL): ").strip()
        if not amount:
            print("❌ Bahis miktarı gerekli!")
            return
        
        # Çarpan
        multiplier_input = input("Çarpan [varsayılan: bahis miktarı]: ").strip()
        if not multiplier_input:
            multiplier = int(amount)
        else:
            multiplier = int(multiplier_input)
        
        # Oran
        odd_at_play = input("Oran: ").strip()
        if not odd_at_play:
            print("❌ Oran gerekli!")
            return
        
        # Token ve cookie'ler
        print("\n🔐 Login Bilgileri:")
        token = input("Token: ").strip()
        if not token:
            print("❌ Token gerekli!")
            return
        
        print("Cookie'ler (JSON formatında, boş bırakabilirsiniz):")
        cookies_input = input().strip()
        cookies = {}
        if cookies_input:
            try:
                cookies = json.loads(cookies_input)
            except json.JSONDecodeError:
                print("❌ Geçersiz JSON formatı")
                return
        
    except KeyboardInterrupt:
        print("\n⏹️ İşlem iptal edildi")
        return
    except ValueError:
        print("❌ Geçersiz değer girildi")
        return
    
    # Kuponu oyna
    coupon_client = BitalihCoupon(token, cookies)
    
    try:
        # Önce doğrula, sonra oyna
        result = coupon_client.play_coupon_with_validation(selections, amount, multiplier, odd_at_play)
        
        if result:
            print(f"\n🎉 Kupon başarıyla oynandı!")
            print(f"⏰ Zaman: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print(f"\n❌ Kupon oynanamadı!")
            
    except KeyboardInterrupt:
        print("\n⏹️ İşlem kullanıcı tarafından durduruldu")
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")


if __name__ == "__main__":
    # Test modu kontrolü
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_coupon_functions()
    else:
        main()
