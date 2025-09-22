#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bitalih Ana Uygulama
Bu uygulama login yapar, 2 ayak seçer, tüm kombinasyonları hesaplar ve kupon oynar.
"""

import json
import time
import os
from datetime import datetime
from bitalih_login import get_login_session
from bulletin_request import get_race_horses, get_available_race_numbers
from bitalih_coupon import play_coupon_with_validation, create_runners
from credential_manager import CredentialManager
from account_manager import AccountManager


class BitalihMainApp:
    def __init__(self):
        """Ana uygulama sınıfını başlatır."""
        self.session = None
        self.token = None
        self.cookies = None
        self.race_id_1 = 988  # İlk race ID
        self.race_id_2 = None  # İkinci race ID (opsiyonel)
        self.selected_races = []
        self.race_data = {}
        self.combinations = []
        self.credential_manager = CredentialManager()
        self.account_manager = AccountManager()
        self.current_account = None
    
    def clear_screen(self):
        """Ekranı temizler."""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def login(self, ssn=None, password=None, account_name=None):
        """
        Bitalih'e login yapar.
        
        Args:
            ssn (str): TC kimlik numarası (opsiyonel)
            password (str): Şifre (opsiyonel)
            account_name (str): Hesap adı (opsiyonel)
            
        Returns:
            bool: Login başarılı mı
        """
        try:
            print("🔐 Login işlemi başlatılıyor...")
            
            # Hesap yönetimi kullan
            if account_name:
                # Belirli bir hesap kullan
                master_password = input("🔑 Ana şifre girin: ").strip()
                ssn, password = self.account_manager.get_account_credentials(account_name, master_password)
                if not ssn or not password:
                    print("❌ Hesap bilgileri alınamadı")
                    return False
                self.current_account = account_name
            else:
                # Hesap seçimi yap
                print("\n🏦 Hesap Seçimi:")
                print("1. Kayıtlı hesap kullan")
                print("2. Yeni hesap ekle")
                print("3. Manuel giriş")
                
                choice = input("Seçiminiz (1-3): ").strip()
                
                if choice == "1":
                    # Kayıtlı hesap kullan
                    account_name = self.account_manager.select_account()
                    if not account_name:
                        return False
                    
                    master_password = input("🔑 Ana şifre girin: ").strip()
                    ssn, password = self.account_manager.get_account_credentials(account_name, master_password)
                    if not ssn or not password:
                        print("❌ Hesap bilgileri alınamadı")
                        return False
                    self.current_account = account_name
                    
                elif choice == "2":
                    # Yeni hesap ekle
                    account_name = input("🏦 Hesap adı girin: ").strip()
                    ssn = input("🆔 TC Kimlik No girin: ").strip()
                    password = input("🔐 Şifre girin: ").strip()
                    master_password = input("🔑 Ana şifre girin: ").strip()
                    
                    self.account_manager.add_account(account_name, ssn, password, master_password)
                    self.current_account = account_name
                    
                elif choice == "3":
                    # Manuel giriş
                    ssn = input("🆔 TC Kimlik No girin: ").strip()
                    password = input("🔐 Şifre girin: ").strip()
                    self.current_account = "manuel_giriş"
                    
                else:
                    print("❌ Geçersiz seçim")
                    return False
            
            self.session = get_login_session(ssn, password)
            
            if self.session and self.session.is_logged_in():
                self.token = self.session.get_token()
                self.cookies = self.session.get_cookies()
                
                user_data = self.session.get_user_data()
                print(f"✅ Login başarılı! Hesap: {self.current_account}")
                print(f"   • Kullanıcı: {user_data['email']}")
                print(f"   • Kullanıcı No: {user_data['number']}")
                print(f"   • Token: {self.token[:30]}...")
                
                return True
            else:
                print("❌ Login başarısız!")
                return False
                
        except Exception as e:
            print(f"❌ Login hatası: {e}")
            return False
    
    def get_available_races(self, race_id):
        """
        Belirtilen race ID için mevcut ayakları listeler.
        
        Args:
            race_id (int): Race ID
            
        Returns:
            list: Mevcut ayak numaraları
        """
        try:
            print(f"🔍 Race ID {race_id} için mevcut ayaklar aranıyor...")
            
            race_numbers = get_available_race_numbers(race_id)
            
            if race_numbers:
                print(f"✅ Race ID {race_id}: {len(race_numbers)} ayak bulundu: {race_numbers}")
                return race_numbers
            else:
                print(f"❌ Race ID {race_id} için hiç ayak bulunamadı")
                return []
                
        except Exception as e:
            print(f"❌ Ayak listesi alınırken hata: {e}")
            return []
    
    def select_races_dual(self, race_1_races, race_2_races):
        """
        İki farklı race ID'den 2 ayak seçimi alır.
        
        Args:
            race_1_races (list): İlk race ID'nin ayak numaraları
            race_2_races (list): İkinci race ID'nin ayak numaraları
            
        Returns:
            list: Seçilen ayak bilgileri [{"race_id": 988, "race_number": 1}, ...]
        """
        try:
            print(f"\n🏇 İKİ RACE ID İLE AYAK SEÇİMİ")
            print("=" * 60)
            print("2 ayak seçmeniz gerekiyor (farklı race ID'lerden).")
            print(f"Race ID {self.race_id_1} ayakları: {race_1_races}")
            if race_2_races:
                print(f"Race ID {self.race_id_2} ayakları: {race_2_races}")
            print("-" * 60)
            
            selected_races = []
            
            for i in range(2):
                while True:
                    try:
                        print(f"\n{i+1}. AYAK SEÇİMİ:")
                        print(f"1. Race ID {self.race_id_1} ayakları: {race_1_races}")
                        if race_2_races:
                            print(f"2. Race ID {self.race_id_2} ayakları: {race_2_races}")
                        
                        race_choice = input("Hangi race ID'den seçmek istiyorsunuz? (1/2): ").strip()
                        
                        if race_choice == "1":
                            race_id = self.race_id_1
                            available_races = race_1_races
                        elif race_choice == "2" and race_2_races:
                            race_id = self.race_id_2
                            available_races = race_2_races
                        else:
                            print("❌ Geçersiz seçim. 1 veya 2 girin.")
                            continue
                        
                        race_input = input(f"Race ID {race_id} - Ayak seçin ({', '.join(map(str, available_races))}): ").strip()
                        race_number = int(race_input)
                        
                        if race_number in available_races:
                            # Aynı race_id ve race_number kombinasyonu var mı kontrol et
                            existing = any(r["race_id"] == race_id and r["race_number"] == race_number for r in selected_races)
                            if not existing:
                                selected_races.append({"race_id": race_id, "race_number": race_number})
                                print(f"✅ Race ID {race_id} - {race_number}. ayak seçildi")
                                break
                            else:
                                print("❌ Bu ayak zaten seçildi. Farklı bir ayak seçin.")
                        else:
                            print(f"❌ Geçersiz ayak numarası. Lütfen {', '.join(map(str, available_races))} arasından seçin.")
                    except ValueError:
                        print("❌ Lütfen geçerli bir sayı girin.")
                    except KeyboardInterrupt:
                        print("\n⏹️ İşlem iptal edildi")
                        return []
            
            self.selected_races = selected_races
            print(f"\n🎯 Seçilen ayaklar:")
            for i, race in enumerate(selected_races, 1):
                print(f"   {i}. Race ID {race['race_id']} - {race['race_number']}. ayak")
            
            return selected_races
            
        except Exception as e:
            print(f"❌ Ayak seçimi hatası: {e}")
            return []
    
    def get_race_data_dual(self, selected_races):
        """
        Seçilen ayaklar için at bilgilerini alır (iki race ID ile).
        
        Args:
            selected_races (list): Seçilen ayak bilgileri [{"race_id": 988, "race_number": 1}, ...]
            
        Returns:
            dict: Ayak verileri
        """
        try:
            print(f"\n🐎 AT BİLGİLERİ ALINIYOR")
            print("=" * 50)
            
            race_data = {}
            
            for race_info in selected_races:
                race_id = race_info['race_id']
                race_number = race_info['race_number']
                
                print(f"🔍 Race ID {race_id} - {race_number}. ayak için at bilgileri alınıyor...")
                
                horses = get_race_horses(race_id, race_number)
                
                if horses:
                    key = f"{race_id}_{race_number}"
                    race_data[key] = {
                        'race_id': race_id,
                        'race_number': race_number,
                        'race_name': horses['race_name'],
                        'race_time': horses['race_time'],
                        'total_horses': horses['total_horses'],
                        'horses': horses['horses']
                    }
                    print(f"✅ Race ID {race_id} - {race_number}. ayak: {horses['total_horses']} at bulundu")
                    print(f"   • Ayak adı: {horses['race_name']}")
                    print(f"   • Yarış zamanı: {horses['race_time']}")
                    
                    # İlk 3 atı göster
                    for i, horse in enumerate(horses['horses'][:3]):
                        print(f"     {horse['horse_no']}. {horse['horse_name']} (Oran: {horse['odds']})")
                    
                    if len(horses['horses']) > 3:
                        print(f"     ... ve {len(horses['horses']) - 3} at daha")
                else:
                    print(f"❌ Race ID {race_id} - {race_number}. ayak için at bilgisi alınamadı")
                    return None
            
            self.race_data = race_data
            return race_data
            
        except Exception as e:
            print(f"❌ At bilgileri alınırken hata: {e}")
            return None
    
    def calculate_combinations(self):
        """
        İki ayak arasındaki tüm kombinasyonları hesaplar.
        
        Returns:
            list: Kombinasyon listesi
        """
        try:
            print(f"\n🔄 KOMBİNASYON HESAPLAMA")
            print("=" * 50)
            
            if len(self.selected_races) != 2:
                print("❌ Tam olarak 2 ayak seçilmelidir")
                return []
            
            race1_info = self.selected_races[0]
            race2_info = self.selected_races[1]
            
            race1_key = f"{race1_info['race_id']}_{race1_info['race_number']}"
            race2_key = f"{race2_info['race_id']}_{race2_info['race_number']}"
            
            race1_data = self.race_data.get(race1_key)
            race2_data = self.race_data.get(race2_key)
            
            if not race1_data or not race2_data:
                print("❌ Ayak verileri eksik")
                return []
            
            combinations = []
            
            print(f"🔄 Race ID {race1_info['race_id']}-{race1_info['race_number']}. ve Race ID {race2_info['race_id']}-{race2_info['race_number']}. ayak kombinasyonları hesaplanıyor...")
            
            for horse1 in race1_data['horses']:
                for horse2 in race2_data['horses']:
                    try:
                        # Oranları float'a çevir
                        odds1 = float(horse1.get('odds', 0))
                        odds2 = float(horse2.get('odds', 0))
                        
                        # Kombinasyon oranını hesapla (çarpım)
                        combination_odds = odds1 * odds2
                        
                        combination = {
                            'race1': {
                                'race_id': race1_info['race_id'],
                                'number': race1_info['race_number'],
                                'race_name': race1_data['race_name'],
                                'horse_no': horse1.get('horse_no'),
                                'horse_name': horse1.get('horse_name'),
                                'odds': odds1
                            },
                            'race2': {
                                'race_id': race2_info['race_id'],
                                'number': race2_info['race_number'],
                                'race_name': race2_data['race_name'],
                                'horse_no': horse2.get('horse_no'),
                                'horse_name': horse2.get('horse_name'),
                                'odds': odds2
                            },
                            'combination_odds': combination_odds
                        }
                        
                        combinations.append(combination)
                        
                    except (ValueError, TypeError) as e:
                        print(f"⚠️ Oran hesaplama hatası: {e}")
                        continue
            
            # Kombinasyonları oran sırasına göre sırala (düşükten yükseğe)
            combinations.sort(key=lambda x: x['combination_odds'])
            
            self.combinations = combinations
            
            print(f"✅ Toplam {len(combinations)} kombinasyon hesaplandı")
            
            # İstatistikleri göster
            if combinations:
                min_odds = combinations[0]['combination_odds']
                max_odds = combinations[-1]['combination_odds']
                avg_odds = sum(c['combination_odds'] for c in combinations) / len(combinations)
                
                print(f"📊 En Düşük Oran: {min_odds:.2f}")
                print(f"📊 En Yüksek Oran: {max_odds:.2f}")
                print(f"📊 Ortalama Oran: {avg_odds:.2f}")
            
            return combinations
            
        except Exception as e:
            print(f"❌ Kombinasyon hesaplama hatası: {e}")
            return []
    
    def display_combinations(self, limit=10):
        """
        Kombinasyonları gösterir.
        
        Args:
            limit (int): Gösterilecek kombinasyon sayısı
        """
        try:
            if not self.combinations:
                print("❌ Gösterilecek kombinasyon bulunamadı")
                return
            
            print(f"\n🎯 KOMBİNASYONLAR (İlk {limit} adet)")
            print("=" * 80)
            
            display_count = min(limit, len(self.combinations))
            
            for i, combo in enumerate(self.combinations[:display_count], 1):
                race1 = combo['race1']
                race2 = combo['race2']
                odds = combo['combination_odds']
                
                # Oran rengi belirleme
                if odds <= 10:
                    color_indicator = "🟢"  # Düşük oran - yeşil
                elif odds <= 50:
                    color_indicator = "🟡"  # Orta oran - sarı
                else:
                    color_indicator = "🔴"  # Yüksek oran - kırmızı
                
                print(f"{i:2d}. {color_indicator} {race1['number']}.Ayak-{race1['horse_no']} {race1['horse_name']} ({race1['odds']:.2f}) x "
                      f"{race2['number']}.Ayak-{race2['horse_no']} {race2['horse_name']} ({race2['odds']:.2f}) = {odds:.2f}")
            
            if len(self.combinations) > display_count:
                print(f"... ve {len(self.combinations) - display_count} kombinasyon daha")
            
            print("-" * 80)
            print("🟢 Düşük oran (≤10) | 🟡 Orta oran (10-50) | 🔴 Yüksek oran (>50)")
            
        except Exception as e:
            print(f"❌ Kombinasyon gösterimi hatası: {e}")
    
    def display_coupons_for_confirmation(self, max_combinations, max_win):
        """
        Oynanacak kuponları gösterir ve kullanıcı onayı alır.
        
        Args:
            max_combinations (int): Maksimum oynanacak kombinasyon sayısı
            max_win (float): Maksimum kazanç limiti
            
        Returns:
            bool: Kullanıcı onayı
        """
        try:
            if not self.combinations:
                print("❌ Oynanacak kombinasyon bulunamadı")
                return False
            
            print(f"\n🎯 OYANACAK KUPONLAR")
            print("=" * 80)
            print(f"💰 Maksimum kazanç limiti: {max_win} TL")
            if max_combinations:
                print(f"🎯 Oynanacak kombinasyon sayısı: {max_combinations}")
            else:
                print(f"🎯 Oynanacak kombinasyon sayısı: Sınırsız (Tüm kombinasyonlar)")
            print("-" * 80)
            
            total_bet = 0
            total_potential_win = 0
            
            # Oynanacak kombinasyonları göster
            combinations_to_show = self.combinations[:max_combinations] if max_combinations else self.combinations
            for i, combo in enumerate(combinations_to_show, 1):
                race1 = combo['race1']
                race2 = combo['race2']
                odds = combo['combination_odds']
                
                # Optimal bahis miktarını hesapla
                bet_info = self.calculate_optimal_bet(combo, max_win)
                
                if not bet_info:
                    print(f"   ❌ {i}. kombinasyon için bahis hesaplanamadı")
                    continue
                
                bet_amount = bet_info['bet_amount']
                potential_win = bet_info['potential_win']
                profit = bet_info['profit']
                
                total_bet += bet_amount
                total_potential_win += potential_win
                
                # Oran rengi belirleme
                if odds <= 10:
                    color_indicator = "🟢"  # Düşük oran - yeşil
                elif odds <= 50:
                    color_indicator = "🟡"  # Orta oran - sarı
                else:
                    color_indicator = "🔴"  # Yüksek oran - kırmızı
                
                print(f"{i:2d}. {color_indicator} {race1['number']}.Ayak-{race1['horse_no']} {race1['horse_name']} ({race1['odds']:.2f}) x "
                      f"{race2['number']}.Ayak-{race2['horse_no']} {race2['horse_name']} ({race2['odds']:.2f}) = {odds:.2f}")
                print(f"    💰 Bahis: {bet_amount:.2f} TL | 🎯 Kazanç: {potential_win:.2f} TL | 💸 Kar: {profit:.2f} TL")
                print()
            
            print("-" * 80)
            print(f"📊 TOPLAM ÖZET:")
            print(f"   💰 Toplam Bahis: {total_bet:.2f} TL")
            print(f"   🎯 Toplam Potansiyel Kazanç: {total_potential_win:.2f} TL")
            print(f"   💸 Toplam Potansiyel Kar: {total_potential_win - total_bet:.2f} TL")
            print("-" * 80)
            
            # Kullanıcı onayı al
            while True:
                try:
                    if max_combinations:
                        confirm = input(f"\nBu {max_combinations} kuponu oynamak istiyor musunuz? (e/h): ").strip().lower()
                    else:
                        confirm = input(f"\nBu {len(self.combinations)} kuponu oynamak istiyor musunuz? (e/h): ").strip().lower()
                    
                    if confirm in ['e', 'evet', 'y', 'yes']:
                        print("✅ Kuponlar onaylandı, oynama başlatılıyor...")
                        return True
                    elif confirm in ['h', 'hayır', 'n', 'no']:
                        print("❌ Kupon oynama iptal edildi")
                        return False
                    else:
                        print("❌ Lütfen 'e' (evet) veya 'h' (hayır) girin.")
                        
                except KeyboardInterrupt:
                    print("\n❌ Kupon oynama iptal edildi")
                    return False
            
        except Exception as e:
            print(f"❌ Kupon onay hatası: {e}")
            return False
    
    def calculate_optimal_bet(self, combination, max_win):
        """
        Maksimum kazanç limitine göre optimal bahis miktarını hesaplar.
        
        Args:
            combination (dict): Kombinasyon bilgisi
            max_win (float): Maksimum kazanç limiti
            
        Returns:
            dict: Bahis bilgileri
        """
        try:
            odds = combination['combination_odds']
            
            # Optimal bahis miktarını hesapla
            # Kazanç = Bahis * Oran
            # Bahis = Kazanç / Oran
            optimal_bet = max_win / odds
            
            # Minimum 1 TL bahis
            min_bet = 1.0
            if optimal_bet < min_bet:
                optimal_bet = min_bet
                actual_win = optimal_bet * odds
            else:
                actual_win = max_win
            
            # Bahis miktarını düzenle
            bet_amount = round(optimal_bet, 2)
            
            # 10 TL'nin altındaki bahisler 10 TL yap
            if bet_amount < 10:
                bet_amount = 10.0
                actual_win = bet_amount * odds
            
            # Küsüratlı bahisleri bir üst tam sayıya tamamla
            if bet_amount != int(bet_amount):
                bet_amount = int(bet_amount) + 1
                actual_win = bet_amount * odds
            
            return {
                'bet_amount': bet_amount,
                'odds': odds,
                'potential_win': round(actual_win, 2),
                'profit': round(actual_win - bet_amount, 2)
            }
            
        except Exception as e:
            print(f"❌ Bahis hesaplama hatası: {e}")
            return None
    
    def play_combinations(self, max_combinations=None, max_win=2500):
        """
        Kombinasyonlarla kupon oynar.
        
        Args:
            max_combinations (int): Maksimum oynanacak kombinasyon sayısı (None = sınırsız)
            max_win (float): Maksimum kazanç limiti (TL)
        """
        try:
            if not self.combinations:
                print("❌ Oynanacak kombinasyon bulunamadı")
                return
            
            if not self.token or not self.cookies:
                print("❌ Login gerekli")
                return
            
            print(f"\n🎯 KUPON OYNAMA")
            print("=" * 50)
            print(f"💰 Maksimum kazanç limiti: {max_win} TL")
            if max_combinations:
                print(f"🎯 Maksimum kombinasyon: {max_combinations}")
            else:
                print(f"🎯 Maksimum kombinasyon: Sınırsız (Tüm kombinasyonlar)")
            print("-" * 50)
            
            played_count = 0
            successful_count = 0
            total_bet = 0
            total_potential_win = 0
            
            # En düşük oranlı kombinasyonlardan başla (en güvenli)
            combinations_to_play = self.combinations[:max_combinations] if max_combinations else self.combinations
            for i, combo in enumerate(combinations_to_play):
                try:
                    race1 = combo['race1']
                    race2 = combo['race2']
                    odds = combo['combination_odds']
                    
                    # Optimal bahis miktarını hesapla
                    bet_info = self.calculate_optimal_bet(combo, max_win)
                    
                    if not bet_info:
                        print(f"   ❌ {i+1}. kombinasyon için bahis hesaplanamadı")
                        continue
                    
                    bet_amount = str(int(bet_info['bet_amount']))
                    potential_win = bet_info['potential_win']
                    profit = bet_info['profit']
                    
                    # Runner'ları oluştur
                    selections = [
                        {"raceId": race1['race_id'], "runNo": race1['number'], "horseNo": race1['horse_no']},
                        {"raceId": race2['race_id'], "runNo": race2['number'], "horseNo": race2['horse_no']}
                    ]
                    runners = create_runners(selections)
                    
                    # Kuponu oyna
                    result = play_coupon_with_validation(
                        self.token, 
                        self.cookies, 
                        runners, 
                        bet_amount, 
                        int(bet_amount), 
                        str(odds)
                    )
                    
                    played_count += 1
                    total_bet += float(bet_amount)
                    total_potential_win += potential_win
                    
                    # Kupon kaydını tut
                    coupon_data = {
                        'races': [
                            {
                                'race_id': race1['race_id'],
                                'number': race1['number'],
                                'horse_no': race1['horse_no'],
                                'horse_name': race1['horse_name'],
                                'odds': race1['odds']
                            },
                            {
                                'race_id': race2['race_id'],
                                'number': race2['number'],
                                'horse_no': race2['horse_no'],
                                'horse_name': race2['horse_name'],
                                'odds': race2['odds']
                            }
                        ],
                        'bet_amount': float(bet_amount),
                        'odds': odds,
                        'potential_win': potential_win,
                        'profit': profit
                    }
                    
                    result_data = {
                        'success': bool(result),
                        'message': 'Kupon başarıyla oynandı' if result else 'Kupon oynanamadı'
                    }
                    
                    # Hesap takibi için kaydet
                    if self.current_account:
                        self.account_manager.record_coupon_play(self.current_account, coupon_data, result_data)
                    
                    if result:
                        successful_count += 1
                        print(f"✅ {i+1}. Kupon oynandı - R{race1['race_id']}-{race1['number']}.Ayak-{race1['horse_no']} x R{race2['race_id']}-{race2['number']}.Ayak-{race2['horse_no']} ({bet_amount} TL)")
                    else:
                        print(f"❌ {i+1}. Kupon oynanamadı - R{race1['race_id']}-{race1['number']}.Ayak-{race1['horse_no']} x R{race2['race_id']}-{race2['number']}.Ayak-{race2['horse_no']} ({bet_amount} TL)")
                    
                    # Kısa bekleme
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"   ❌ Kupon oynama hatası: {e}")
                    continue
            
            print(f"\n📊 KUPON OYNAMA ÖZETİ")
            print("=" * 50)
            print(f"🎯 Toplam Oynanan: {played_count}")
            print(f"✅ Başarılı: {successful_count}")
            print(f"❌ Başarısız: {played_count - successful_count}")
            print(f"💰 Toplam Bahis: {total_bet:.2f} TL")
            print(f"🎯 Toplam Potansiyel Kazanç: {total_potential_win:.2f} TL")
            print(f"💸 Toplam Potansiyel Kar: {total_potential_win - total_bet:.2f} TL")
            
        except Exception as e:
            print(f"❌ Kupon oynama hatası: {e}")
    
    def run(self, ssn=None, password=None, race_id_1=988, race_id_2=None, max_combinations=None, max_win=2500):
        """
        Ana uygulama fonksiyonu.
        
        Args:
            ssn (str): TC kimlik numarası (opsiyonel)
            password (str): Şifre (opsiyonel)
            race_id_1 (int): İlk Race ID
            race_id_2 (int): İkinci Race ID (opsiyonel)
            max_combinations (int): Maksimum oynanacak kombinasyon sayısı (None = sınırsız)
            max_win (float): Maksimum kazanç limiti (TL)
        """
        try:
            print("🚀 Bitalih Ana Uygulama başlatılıyor...")
            print(f"⏰ Başlangıç Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)
            
            self.race_id_1 = race_id_1
            self.race_id_2 = race_id_2
            
            # 1. Login yap
            if not self.login(ssn, password):
                print("❌ Login başarısız, uygulama sonlandırılıyor")
                return
            
            # 2. İlk race ID için mevcut ayakları al
            race_1_races = self.get_available_races(race_id_1)
            if not race_1_races:
                print(f"❌ Race ID {race_id_1} için ayak bulunamadı")
                return
            
            # 3. İkinci race ID için mevcut ayakları al (varsa)
            race_2_races = []
            if race_id_2:
                race_2_races = self.get_available_races(race_id_2)
                if not race_2_races:
                    print(f"❌ Race ID {race_id_2} için ayak bulunamadı")
                    return
            
            # 4. 2 ayak seç
            selected_races = self.select_races_dual(race_1_races, race_2_races)
            if len(selected_races) != 2:
                print("❌ 2 ayak seçilmedi")
                return
            
            # 5. At bilgilerini al
            race_data = self.get_race_data_dual(selected_races)
            if not race_data:
                print("❌ At bilgileri alınamadı")
                return
            
            # 6. Kombinasyonları hesapla
            combinations = self.calculate_combinations()
            if not combinations:
                print("❌ Kombinasyon hesaplanamadı")
                return
            
            # 6. Kombinasyonları göster
            self.display_combinations(10)
            
            # 7. Oynanacak kuponları göster ve onay al
            if self.display_coupons_for_confirmation(max_combinations, max_win):
                # 8. Kupon oyna
                self.play_combinations(max_combinations, max_win)
            else:
                print("⏹️ Kupon oynama iptal edildi")
            
            print(f"\n🎉 Uygulama tamamlandı!")
            print(f"⏰ Bitiş Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Hesap istatistiklerini göster
            if self.current_account:
                print(f"\n📊 HESAP İSTATİSTİKLERİ")
                self.account_manager.get_account_statistics(self.current_account)
            
        except Exception as e:
            print(f"❌ Ana uygulama hatası: {e}")
    
    def show_account_menu(self):
        """Hesap yönetimi menüsünü gösterir."""
        try:
            while True:
                self.clear_screen()
                print(f"🏇 Bitalih Ana Uygulama")
                print(f"="*50)
                print(f"🏦 HESAP YÖNETİMİ")
                print(f"="*50)
                print(f"1. 📋 Hesapları Listele")
                print(f"   • Kayıtlı tüm hesapları görüntüle")
                print()
                print(f"2. 📊 Hesap İstatistikleri")
                print(f"   • Seçilen hesabın detaylı istatistiklerini görüntüle")
                print()
                print(f"3. 📜 Kupon Geçmişi")
                print(f"   • Seçilen hesabın kupon oynama geçmişini incele")
                print()
                print(f"4. ➕ Yeni Hesap Ekle")
                print(f"   • Yeni bir hesap kaydet")
                print()
                print(f"5. 🔙 Ana Menüye Dön")
                print(f"   • Ana menüye geri dön")
                print(f"="*50)
                
                choice = input("Seçiminizi yapın (1-5): ").strip()
                
                if choice == "1":
                    self.clear_screen()
                    print(f"📋 HESAPLARI LİSTELE")
                    print(f"="*30)
                    self.account_manager.list_accounts()
                    input("\n⏸️ Devam etmek için Enter'a basın...")
                    
                elif choice == "2":
                    self.clear_screen()
                    print(f"📊 HESAP İSTATİSTİKLERİ")
                    print(f"="*30)
                    account_name = self.account_manager.select_account()
                    if account_name:
                        self.clear_screen()
                        print(f"📊 HESAP İSTATİSTİKLERİ - {account_name}")
                        print(f"="*40)
                        self.account_manager.get_account_statistics(account_name)
                    else:
                        print("❌ Hesap seçilmedi")
                    input("\n⏸️ Devam etmek için Enter'a basın...")
                        
                elif choice == "3":
                    self.clear_screen()
                    print(f"📜 KUPON GEÇMİŞİ")
                    print(f"="*30)
                    account_name = self.account_manager.select_account()
                    if account_name:
                        self.clear_screen()
                        print(f"📜 KUPON GEÇMİŞİ - {account_name}")
                        print(f"="*40)
                        self.account_manager.get_coupon_history(account_name, 20)
                    else:
                        print("❌ Hesap seçilmedi")
                    input("\n⏸️ Devam etmek için Enter'a basın...")
                        
                elif choice == "4":
                    self.clear_screen()
                    print(f"➕ YENİ HESAP EKLE")
                    print(f"="*30)
                    try:
                        account_name = input("🏦 Hesap adı girin: ").strip()
                        if not account_name:
                            print("❌ Hesap adı boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                            
                        ssn = input("🆔 TC Kimlik No girin: ").strip()
                        if not ssn:
                            print("❌ TC Kimlik No boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                            
                        password = input("🔐 Şifre girin: ").strip()
                        if not password:
                            print("❌ Şifre boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                            
                        master_password = input("🔑 Ana şifre girin: ").strip()
                        if not master_password:
                            print("❌ Ana şifre boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                        
                        self.account_manager.add_account(account_name, ssn, password, master_password)
                        input("\n⏸️ Devam etmek için Enter'a basın...")
                        
                    except KeyboardInterrupt:
                        print("\n⏹️ İşlem iptal edildi")
                        input("Devam etmek için Enter'a basın...")
                    except Exception as e:
                        print(f"❌ Hesap ekleme hatası: {e}")
                        input("Devam etmek için Enter'a basın...")
                        
                elif choice == "5":
                    break
                    
                else:
                    print(f"\n❌ Geçersiz seçim! Lütfen 1-5 arasında bir sayı girin.")
                    input("Devam etmek için Enter'a basın...")
                    
        except Exception as e:
            print(f"❌ Hesap menüsü hatası: {e}")
    
    def show_cost_analysis_menu(self):
        """Maliyet analizi menüsünü gösterir."""
        try:
            while True:
                self.clear_screen()
                print(f"🏇 Bitalih Ana Uygulama")
                print(f"="*50)
                print(f"📊 MALİYET ANALİZİ")
                print(f"="*50)
                print(f"1. 🔍 İkili Maliyet Analizi")
                print(f"   • İki Race ID ile ayak çiftlerinin maliyet analizi")
                print()
                print(f"2. 🔍 Üçlü Maliyet Analizi")
                print(f"   • Üç Race ID ile ayak gruplarının maliyet analizi")
                print()
                print(f"3. 🔙 Ana Menüye Dön")
                print(f"   • Ana menüye geri dön")
                print(f"="*50)
                
                choice = input("Seçiminizi yapın (1-3): ").strip()
                
                if choice == "1":
                    self.clear_screen()
                    print(f"🔍 İKİLİ MALİYET ANALİZİ")
                    print(f"="*30)
                    try:
                        race_id_1_input = input("🏁 İlk Race ID girin: ").strip()
                        if not race_id_1_input:
                            print("❌ Race ID boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                        race_id_1 = int(race_id_1_input)
                        
                        race_id_2_input = input("🏁 İkinci Race ID girin: ").strip()
                        if not race_id_2_input:
                            print("❌ Race ID boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                        race_id_2 = int(race_id_2_input)
                        
                        # Maksimum kazanç limitini al
                        max_win_input = input("💰 Maksimum kazanç limiti (TL) [varsayılan: 2500]: ").strip()
                        max_win = float(max_win_input) if max_win_input else 2500.0
                        
                        # İkili maliyet analizi çalıştır
                        from cost_analyzer import CostAnalyzer
                        analyzer = CostAnalyzer()
                        analyzer.race_id_1 = race_id_1
                        analyzer.race_id_2 = race_id_2
                        analyzer.run()
                        
                        input("\n⏸️ Devam etmek için Enter'a basın...")
                        
                    except KeyboardInterrupt:
                        print("\n⏹️ İşlem iptal edildi")
                        input("Devam etmek için Enter'a basın...")
                    except ValueError:
                        print("❌ Geçersiz Race ID")
                        input("Devam etmek için Enter'a basın...")
                    except Exception as e:
                        print(f"❌ Analiz hatası: {e}")
                        input("Devam etmek için Enter'a basın...")
                        
                elif choice == "2":
                    self.clear_screen()
                    print(f"🔍 ÜÇLÜ MALİYET ANALİZİ")
                    print(f"="*30)
                    try:
                        race_id_1_input = input("🏁 İlk Race ID girin: ").strip()
                        if not race_id_1_input:
                            print("❌ Race ID boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                        race_id_1 = int(race_id_1_input)
                        
                        race_id_2_input = input("🏁 İkinci Race ID girin: ").strip()
                        if not race_id_2_input:
                            print("❌ Race ID boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                        race_id_2 = int(race_id_2_input)
                        
                        race_id_3_input = input("🏁 Üçüncü Race ID girin: ").strip()
                        if not race_id_3_input:
                            print("❌ Race ID boş olamaz")
                            input("Devam etmek için Enter'a basın...")
                            continue
                        race_id_3 = int(race_id_3_input)
                        
                        # Maksimum kazanç limitini al
                        max_win_input = input("💰 Maksimum kazanç limiti (TL) [varsayılan: 1250]: ").strip()
                        max_win = float(max_win_input) if max_win_input else 1250.0
                        
                        # Üçlü maliyet analizi çalıştır
                        from triple_cost_analyzer import TripleCostAnalyzer
                        analyzer = TripleCostAnalyzer()
                        analyzer.run(max_win=max_win)
                        
                        input("\n⏸️ Devam etmek için Enter'a basın...")
                        
                    except KeyboardInterrupt:
                        print("\n⏹️ İşlem iptal edildi")
                        input("Devam etmek için Enter'a basın...")
                    except ValueError:
                        print("❌ Geçersiz Race ID")
                        input("Devam etmek için Enter'a basın...")
                    except Exception as e:
                        print(f"❌ Analiz hatası: {e}")
                        input("Devam etmek için Enter'a basın...")
                        
                elif choice == "3":
                    break
                    
                else:
                    print(f"\n❌ Geçersiz seçim! Lütfen 1-3 arasında bir sayı girin.")
                    input("Devam etmek için Enter'a basın...")
                    
        except Exception as e:
            print(f"❌ Maliyet analizi menüsü hatası: {e}")
        
        finally:
            # Logout yap
            if self.session:
                self.session.logout()


def main():
    """Ana fonksiyon."""
    print("🏇 Bitalih Ana Uygulama")
    print("="*50)
    print("Bu uygulama login yapar, 2 ayak seçer,")
    print("tüm kombinasyonları hesaplar ve kupon oynar.")
    print("-"*50)
    
    # Ana uygulamayı başlat
    app = BitalihMainApp()
    
    try:
        while True:
            app.clear_screen()
            print(f"🏇 Bitalih Ana Uygulama")
            print(f"="*50)
            print(f"Bu uygulama login yapar, 2 ayak seçer,")
            print(f"tüm kombinasyonları hesaplar ve kupon oynar.")
            print(f"="*50)
            print(f"🎯 ANA MENÜ")
            print(f"="*50)
            print(f"1. 🎲 Kupon Oyna")
            print(f"   • Login yap, ayak seç, kombinasyon hesapla ve kupon oyna")
            print()
            print(f"2. 🏦 Hesap Yönetimi")
            print(f"   • Hesapları listele, istatistikleri görüntüle, geçmişi incele")
            print()
            print(f"3. 📊 Maliyet Analizi")
            print(f"   • İkili ve üçlü ayak kombinasyonlarının maliyet analizi")
            print()
            print(f"4. ❌ Çıkış")
            print(f"   • Uygulamayı kapat")
            print(f"="*50)
            
            choice = input("Seçiminizi yapın (1-4): ").strip()
            
            if choice == "1":
                # Kupon oynama
                app.clear_screen()
                print(f"🎲 KUPON OYNAMA")
                print(f"="*30)
                try:
                    print("📋 Ayarları girin:")
                    race_id_1_input = input("   🏁 İlk Race ID [varsayılan: 988]: ").strip()
                    race_id_1 = int(race_id_1_input) if race_id_1_input else 988
                    
                    race_id_2_input = input("   🏁 İkinci Race ID [opsiyonel]: ").strip()
                    race_id_2 = int(race_id_2_input) if race_id_2_input else None
                    
                    max_combinations_input = input("   🎯 Maksimum kombinasyon [sınırsız]: ").strip()
                    max_combinations = int(max_combinations_input) if max_combinations_input else None
                    
                    max_win_input = input("   💰 Maksimum kazanç limiti (TL) [2500]: ").strip()
                    max_win = float(max_win_input) if max_win_input else 2500.0
                    
                    print(f"\n🚀 Kupon oynama başlatılıyor...")
                    app.run(None, None, race_id_1, race_id_2, max_combinations, max_win)
                    
                    input("\n⏸️ Devam etmek için Enter'a basın...")
                    
                except KeyboardInterrupt:
                    print("\n⏹️ İşlem iptal edildi")
                    input("Devam etmek için Enter'a basın...")
                except ValueError:
                    print("❌ Geçersiz değer girildi")
                    input("Devam etmek için Enter'a basın...")
                    
            elif choice == "2":
                # Hesap yönetimi
                app.show_account_menu()
                
            elif choice == "3":
                # Maliyet analizi
                app.show_cost_analysis_menu()
                
            elif choice == "4":
                # Çıkış
                app.clear_screen()
                print(f"👋 Teşekkürler! Görüşürüz!")
                break
                
            else:
                print(f"\n❌ Geçersiz seçim! Lütfen 1-4 arasında bir sayı girin.")
                input("Devam etmek için Enter'a basın...")
        
    except KeyboardInterrupt:
        print("\n⏹️ Uygulama kullanıcı tarafından durduruldu")
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")


if __name__ == "__main__":
    main()
