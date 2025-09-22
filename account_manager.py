#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Bitalih Hesap Yöneticisi
========================

Bu modül, birden fazla hesap yönetimi ve kupon oynama geçmişi
takibi için kullanılır.

Özellikler:
- Birden fazla hesap kaydetme ve yönetme
- Kupon oynama geçmişini JSON olarak kaydetme
- Hesap bazında kupon takibi
- Şifreli hesap bilgileri saklama
"""

import json
import os
import sys
from datetime import datetime
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Kütüphaneleri import et
try:
    from bitalih_login import BitalihLogin
except ImportError as e:
    print(f"❌ Kütüphane import hatası: {e}")
    print("Lütfen gerekli dosyaların mevcut olduğundan emin olun.")
    sys.exit(1)


class AccountManager:
    """Hesap yönetimi sınıfı"""
    
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.accounts_file = os.path.join(data_dir, "accounts.json")
        self.coupon_history_file = os.path.join(data_dir, "coupon_history.json")
        self.accounts = {}
        self.coupon_history = []
        
        # Veri dizinini oluştur
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        # Mevcut verileri yükle
        self.load_accounts()
        self.load_coupon_history()
    
    def generate_key_from_password(self, password: str, salt: bytes = None) -> tuple:
        """
        Şifreden anahtar üretir.
        
        Args:
            password (str): Şifre
            salt (bytes): Salt (opsiyonel)
            
        Returns:
            tuple: (key, salt)
        """
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key, salt
    
    def encrypt_data(self, data: str, password: str) -> dict:
        """
        Veriyi şifreler.
        
        Args:
            data (str): Şifrelenecek veri
            password (str): Şifre
            
        Returns:
            dict: Şifrelenmiş veri ve salt
        """
        key, salt = self.generate_key_from_password(password)
        f = Fernet(key)
        encrypted_data = f.encrypt(data.encode())
        
        return {
            'data': base64.urlsafe_b64encode(encrypted_data).decode(),
            'salt': base64.urlsafe_b64encode(salt).decode()
        }
    
    def decrypt_data(self, encrypted_info: dict, password: str) -> str:
        """
        Şifrelenmiş veriyi çözer.
        
        Args:
            encrypted_info (dict): Şifrelenmiş veri bilgileri
            password (str): Şifre
            
        Returns:
            str: Çözülmüş veri
        """
        try:
            salt = base64.urlsafe_b64decode(encrypted_info['salt'].encode())
            key, _ = self.generate_key_from_password(password, salt)
            f = Fernet(key)
            
            encrypted_data = base64.urlsafe_b64decode(encrypted_info['data'].encode())
            decrypted_data = f.decrypt(encrypted_data)
            
            return decrypted_data.decode()
        except Exception as e:
            raise ValueError(f"Şifre çözme hatası: {e}")
    
    def add_account(self, account_name: str, ssn: str, password: str, master_password: str):
        """
        Yeni hesap ekler.
        
        Args:
            account_name (str): Hesap adı
            ssn (str): TC Kimlik No
            password (str): Hesap şifresi
            master_password (str): Ana şifre
        """
        try:
            # Hesap bilgilerini şifrele
            encrypted_ssn = self.encrypt_data(ssn, master_password)
            encrypted_password = self.encrypt_data(password, master_password)
            
            account_data = {
                'account_name': account_name,
                'ssn': encrypted_ssn,
                'password': encrypted_password,
                'created_at': datetime.now().isoformat(),
                'last_used': None,
                'total_coupons_played': 0,
                'successful_coupons': 0,
                'total_bet_amount': 0.0,
                'total_win_amount': 0.0
            }
            
            self.accounts[account_name] = account_data
            self.save_accounts()
            
            print(f"✅ Hesap '{account_name}' başarıyla eklendi")
            
        except Exception as e:
            print(f"❌ Hesap ekleme hatası: {e}")
    
    def get_account_credentials(self, account_name: str, master_password: str) -> tuple:
        """
        Hesap bilgilerini getirir.
        
        Args:
            account_name (str): Hesap adı
            master_password (str): Ana şifre
            
        Returns:
            tuple: (ssn, password)
        """
        try:
            if account_name not in self.accounts:
                raise ValueError(f"Hesap '{account_name}' bulunamadı")
            
            account_data = self.accounts[account_name]
            
            ssn = self.decrypt_data(account_data['ssn'], master_password)
            password = self.decrypt_data(account_data['password'], master_password)
            
            # Son kullanım zamanını güncelle
            account_data['last_used'] = datetime.now().isoformat()
            self.save_accounts()
            
            return ssn, password
            
        except Exception as e:
            print(f"❌ Hesap bilgileri alma hatası: {e}")
            return None, None
    
    def list_accounts(self):
        """
        Mevcut hesapları listeler.
        """
        try:
            if not self.accounts:
                print("📋 Kayıtlı hesap bulunmuyor")
                return
            
            print(f"\n📋 KAYITLI HESAPLAR ({len(self.accounts)} adet)")
            print("=" * 60)
            
            for i, (account_name, account_data) in enumerate(self.accounts.items(), 1):
                print(f"{i:2d}. 🏦 {account_name}")
                print(f"    📅 Oluşturulma: {account_data['created_at'][:19]}")
                if account_data['last_used']:
                    print(f"    🕒 Son Kullanım: {account_data['last_used'][:19]}")
                else:
                    print(f"    🕒 Son Kullanım: Hiç kullanılmamış")
                print(f"    🎯 Toplam Kupon: {account_data['total_coupons_played']}")
                print(f"    ✅ Başarılı: {account_data['successful_coupons']}")
                print(f"    💰 Toplam Bahis: {account_data['total_bet_amount']:.2f} TL")
                print(f"    💸 Toplam Kazanç: {account_data['total_win_amount']:.2f} TL")
                print()
            
        except Exception as e:
            print(f"❌ Hesap listesi hatası: {e}")
    
    def get_all_accounts(self):
        """Kayıtlı tüm hesap isimlerini döndürür."""
        try:
            return list(self.accounts.keys())
        except Exception as e:
            print(f"❌ Hesap listesi alma hatası: {e}")
            return []
    
    def select_account(self) -> str:
        """
        Kullanıcıdan hesap seçmesini ister.
        
        Returns:
            str: Seçilen hesap adı
        """
        try:
            if not self.accounts:
                print("❌ Kayıtlı hesap bulunmuyor")
                return None
            
            self.list_accounts()
            
            while True:
                try:
                    choice = input(f"\n🏦 Hesap seçin (1-{len(self.accounts)}): ").strip()
                    if choice.isdigit():
                        choice_num = int(choice)
                        if 1 <= choice_num <= len(self.accounts):
                            account_names = list(self.accounts.keys())
                            selected_account = account_names[choice_num - 1]
                            print(f"✅ '{selected_account}' hesabı seçildi")
                            return selected_account
                        else:
                            print(f"❌ Lütfen 1-{len(self.accounts)} arasında bir sayı girin")
                    else:
                        print("❌ Lütfen geçerli bir sayı girin")
                except KeyboardInterrupt:
                    print("\n⏹️ İşlem iptal edildi")
                    return None
                    
        except Exception as e:
            print(f"❌ Hesap seçimi hatası: {e}")
            return None
    
    def record_coupon_play(self, account_name: str, coupon_data: dict, result: dict):
        """
        Kupon oynama kaydını tutar.
        
        Args:
            account_name (str): Hesap adı
            coupon_data (dict): Kupon verisi
            result (dict): Oynama sonucu
        """
        try:
            record = {
                'timestamp': datetime.now().isoformat(),
                'account_name': account_name,
                'coupon_data': coupon_data,
                'result': result,
                'success': result.get('success', False) if result else False
            }
            
            self.coupon_history.append(record)
            
            # Hesap istatistiklerini güncelle
            if account_name in self.accounts:
                account_data = self.accounts[account_name]
                account_data['total_coupons_played'] += 1
                
                if record['success']:
                    account_data['successful_coupons'] += 1
                
                # Bahis ve kazanç miktarlarını güncelle
                if 'bet_amount' in coupon_data:
                    account_data['total_bet_amount'] += coupon_data['bet_amount']
                
                if 'potential_win' in coupon_data and record['success']:
                    account_data['total_win_amount'] += coupon_data['potential_win']
            
            self.save_coupon_history()
            self.save_accounts()
            
        except Exception as e:
            print(f"❌ Kupon kaydı hatası: {e}")
    
    def get_coupon_history(self, account_name: str = None, limit: int = 50):
        """
        Kupon geçmişini getirir.
        
        Args:
            account_name (str): Hesap adı (opsiyonel)
            limit (int): Gösterilecek kayıt sayısı
        """
        try:
            filtered_history = self.coupon_history
            
            if account_name:
                filtered_history = [record for record in self.coupon_history 
                                  if record['account_name'] == account_name]
            
            if not filtered_history:
                print("📋 Kupon geçmişi bulunmuyor")
                return
            
            # Son kayıtları göster
            recent_history = filtered_history[-limit:] if len(filtered_history) > limit else filtered_history
            
            print(f"\n📋 KUPON GEÇMİŞİ ({len(recent_history)} kayıt)")
            if account_name:
                print(f"🏦 Hesap: {account_name}")
            print("=" * 80)
            
            for i, record in enumerate(recent_history, 1):
                timestamp = record['timestamp'][:19]
                success_icon = "✅" if record['success'] else "❌"
                
                coupon = record['coupon_data']
                result = record['result']
                
                print(f"{i:3d}. {success_icon} {timestamp} | {record['account_name']}")
                
                if 'races' in coupon:
                    race_info = []
                    for race in coupon['races']:
                        race_info.append(f"R{race['race_id']}-{race['number']}.Ayak-{race['horse_no']}")
                    print(f"     🏁 Kombinasyon: {' x '.join(race_info)}")
                
                if 'bet_amount' in coupon:
                    print(f"     💰 Bahis: {coupon['bet_amount']} TL")
                
                if 'odds' in coupon:
                    print(f"     📊 Oran: {coupon['odds']:.2f}")
                
                if 'potential_win' in coupon:
                    print(f"     💸 Potansiyel Kazanç: {coupon['potential_win']} TL")
                
                if result and 'message' in result:
                    print(f"     📝 Sonuç: {result['message']}")
                
                print()
            
        except Exception as e:
            print(f"❌ Kupon geçmişi hatası: {e}")
    
    def save_accounts(self):
        """Hesapları dosyaya kaydeder."""
        try:
            with open(self.accounts_file, 'w', encoding='utf-8') as f:
                json.dump(self.accounts, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"❌ Hesap kaydetme hatası: {e}")
    
    def load_accounts(self):
        """Hesapları dosyadan yükler."""
        try:
            if os.path.exists(self.accounts_file):
                with open(self.accounts_file, 'r', encoding='utf-8') as f:
                    self.accounts = json.load(f)
        except Exception as e:
            print(f"❌ Hesap yükleme hatası: {e}")
            self.accounts = {}
    
    def save_coupon_history(self):
        """Kupon geçmişini dosyaya kaydeder."""
        try:
            with open(self.coupon_history_file, 'w', encoding='utf-8') as f:
                json.dump(self.coupon_history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"❌ Kupon geçmişi kaydetme hatası: {e}")
    
    def load_coupon_history(self):
        """Kupon geçmişini dosyadan yükler."""
        try:
            if os.path.exists(self.coupon_history_file):
                with open(self.coupon_history_file, 'r', encoding='utf-8') as f:
                    self.coupon_history = json.load(f)
        except Exception as e:
            print(f"❌ Kupon geçmişi yükleme hatası: {e}")
            self.coupon_history = []
    
    def get_account_statistics(self, account_name: str = None):
        """
        Hesap istatistiklerini getirir.
        
        Args:
            account_name (str): Hesap adı (opsiyonel)
        """
        try:
            if account_name:
                if account_name not in self.accounts:
                    print(f"❌ Hesap '{account_name}' bulunamadı")
                    return
                
                accounts_to_show = {account_name: self.accounts[account_name]}
            else:
                accounts_to_show = self.accounts
            
            if not accounts_to_show:
                print("📋 Gösterilecek hesap bulunmuyor")
                return
            
            print(f"\n📊 HESAP İSTATİSTİKLERİ")
            print("=" * 60)
            
            for acc_name, acc_data in accounts_to_show.items():
                print(f"🏦 Hesap: {acc_name}")
                print(f"   🎯 Toplam Kupon: {acc_data['total_coupons_played']}")
                print(f"   ✅ Başarılı Kupon: {acc_data['successful_coupons']}")
                
                if acc_data['total_coupons_played'] > 0:
                    success_rate = (acc_data['successful_coupons'] / acc_data['total_coupons_played']) * 100
                    print(f"   📈 Başarı Oranı: {success_rate:.1f}%")
                
                print(f"   💰 Toplam Bahis: {acc_data['total_bet_amount']:.2f} TL")
                print(f"   💸 Toplam Kazanç: {acc_data['total_win_amount']:.2f} TL")
                
                if acc_data['total_bet_amount'] > 0:
                    profit = acc_data['total_win_amount'] - acc_data['total_bet_amount']
                    print(f"   📊 Net Kar/Zarar: {profit:.2f} TL")
                
                print()
            
        except Exception as e:
            print(f"❌ İstatistik hatası: {e}")


def main():
    """Test fonksiyonu"""
    try:
        manager = AccountManager()
        
        print("🏦 Hesap Yöneticisi Test")
        print("=" * 30)
        
        # Test hesabı ekle
        manager.add_account("test_hesap", "12345678901", "test123", "master123")
        
        # Hesapları listele
        manager.list_accounts()
        
        # Hesap bilgilerini al
        ssn, password = manager.get_account_credentials("test_hesap", "master123")
        print(f"SSN: {ssn}, Password: {password}")
        
    except Exception as e:
        print(f"❌ Test hatası: {e}")


if __name__ == "__main__":
    main()
