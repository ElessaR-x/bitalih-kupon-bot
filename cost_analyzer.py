#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Bitalih Maliyet Analizi
=======================

Bu script, iki Race ID ile tüm ayakların ikili kombinasyonlarını
analiz eder ve en az maliyetli kombinasyonu bulur.

Özellikler:
- İki Race ID'den tüm ayak kombinasyonlarını hesaplar
- Her kombinasyon için kupon sayısı ve maliyet hesaplar
- En az maliyetli kombinasyonu bulur
- Detaylı rapor sunar
"""

import sys
import os
from datetime import datetime

# Kütüphaneleri import et
try:
    from bulletin_request import BitalihBulletinRequest
    from bitalih_login import BitalihLogin
except ImportError as e:
    print(f"❌ Kütüphane import hatası: {e}")
    print("Lütfen gerekli dosyaların mevcut olduğundan emin olun.")
    sys.exit(1)


class CostAnalyzer:
    """Maliyet analizi sınıfı"""
    
    def __init__(self):
        self.bulletin = BitalihBulletinRequest()
        self.login = BitalihLogin()
        self.race_data = {}
        self.combinations = []
        self.cost_analysis = []
        
    def calculate_optimal_bet(self, combination, max_win=2500):
        """
        Maksimum kazanç limitine göre optimal bahis miktarını hesaplar.
        
        Args:
            combination (dict): Kombinasyon bilgileri
            max_win (float): Maksimum kazanç limiti
            
        Returns:
            dict: Bahis bilgileri
        """
        try:
            odds = combination['combination_odds']
            
            # Optimal bahis miktarını hesapla
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
    
    def get_race_data(self, race_id):
        """
        Race ID'ye göre tüm ayak verilerini getirir.
        
        Args:
            race_id (int): Race ID
            
        Returns:
            list: Ayak verileri listesi
        """
        try:
            print(f"🔍 Race ID {race_id} için ayak verileri getiriliyor...")
            
            # Tüm ayak numaralarını al
            available_races = self.bulletin.get_available_race_numbers(race_id)
            if not available_races:
                print(f"❌ Race ID {race_id} için ayak bulunamadı")
                return []
            
            print(f"✅ Race ID {race_id}: {len(available_races)} ayak bulundu: {available_races}")
            
            race_data = []
            
            # Her ayak için at verilerini al
            for race_number in available_races:
                print(f"📊 Race ID {race_id} - {race_number}. ayak verileri alınıyor...")
                
                horses_data = self.bulletin.get_race_horses(race_id, race_number)
                if horses_data and horses_data.get('horses'):
                    race_data.append({
                        'race_id': race_id,
                        'number': race_number,
                        'race_name': horses_data.get('race_name', f'{race_number}. Ayak'),
                        'race_time': horses_data.get('race_time', ''),
                        'horses': horses_data['horses']
                    })
                    print(f"✅ Race ID {race_id} - {race_number}. ayak: {len(horses_data['horses'])} at")
                else:
                    print(f"❌ Race ID {race_id} - {race_number}. ayak verisi alınamadı")
            
            return race_data
            
        except Exception as e:
            print(f"❌ Race veri alma hatası: {e}")
            return []
    
    def calculate_all_combinations(self, race_1_data, race_2_data):
        """
        İki race ID'den tüm ayak kombinasyonlarını hesaplar.
        
        Args:
            race_1_data (list): İlk race ID'nin ayak verileri
            race_2_data (list): İkinci race ID'nin ayak verileri
            
        Returns:
            list: Tüm kombinasyon listesi
        """
        try:
            print(f"\n🧮 TÜM AYAK KOMBİNASYONLARI HESAPLANIYOR")
            print("=" * 60)
            
            all_combinations = []
            
            # Tüm ayak kombinasyonlarını hesapla
            for race1 in race_1_data:
                for race2 in race_2_data:
                    print(f"📊 Race ID {race1['race_id']}-{race1['number']}. x Race ID {race2['race_id']}-{race2['number']}. kombinasyonu hesaplanıyor...")
                    
                    # Bu 2 ayak için tüm at kombinasyonlarını hesapla
                    combinations = self.calculate_combinations_for_two_races(race1, race2)
                    
                    if combinations:
                        all_combinations.extend(combinations)
                        print(f"   ✅ {len(combinations)} at kombinasyonu eklendi")
                    else:
                        print(f"   ❌ At kombinasyonu hesaplanamadı")
            
            print(f"\n✅ Toplam {len(all_combinations)} kombinasyon hesaplandı")
            return all_combinations
            
        except Exception as e:
            print(f"❌ Kombinasyon hesaplama hatası: {e}")
            return []
    
    def calculate_total_cost_for_race_pair(self, race1, race2, max_win=2500):
        """
        İki ayak arasındaki tüm at kombinasyonlarının toplam maliyetini hesaplar.
        
        Args:
            race1 (dict): İlk ayak verisi
            race2 (dict): İkinci ayak verisi
            max_win (float): Maksimum kazanç limiti
            
        Returns:
            dict: Toplam maliyet bilgileri
        """
        try:
            # Bu iki ayak için tüm at kombinasyonlarını hesapla
            combinations = self.calculate_combinations_for_two_races(race1, race2)
            
            if not combinations:
                return None
            
            total_cost = 0
            total_combinations = len(combinations)
            valid_combinations = 0
            
            # Her kombinasyon için maliyet hesapla
            for combo in combinations:
                bet_info = self.calculate_optimal_bet(combo, max_win)
                if bet_info:
                    total_cost += bet_info['bet_amount']
                    valid_combinations += 1
            
            return {
                'race1': race1,
                'race2': race2,
                'total_combinations': total_combinations,
                'valid_combinations': valid_combinations,
                'total_cost': total_cost,
                'average_cost': total_cost / valid_combinations if valid_combinations > 0 else 0
            }
            
        except Exception as e:
            print(f"❌ İki ayak toplam maliyet hesaplama hatası: {e}")
            return None
    
    def calculate_combinations_for_two_races(self, race1, race2):
        """
        İki ayak için tüm at kombinasyonlarını hesaplar.
        
        Args:
            race1 (dict): İlk ayak verisi
            race2 (dict): İkinci ayak verisi
            
        Returns:
            list: Kombinasyon listesi
        """
        try:
            combinations = []
            
            # Her at kombinasyonunu hesapla
            for horse1 in race1['horses']:
                for horse2 in race2['horses']:
                    try:
                        odds1 = float(horse1.get('odds', 0))
                        odds2 = float(horse2.get('odds', 0))
                        
                        if odds1 > 0 and odds2 > 0:
                            combination_odds = odds1 * odds2
                            
                            combination = {
                                'race1': {
                                    'race_id': race1['race_id'],
                                    'number': race1['number'],
                                    'race_name': race1['race_name'],
                                    'horse_no': horse1.get('horse_no'),
                                    'horse_name': horse1.get('horse_name'),
                                    'odds': odds1
                                },
                                'race2': {
                                    'race_id': race2['race_id'],
                                    'number': race2['number'],
                                    'race_name': race2['race_name'],
                                    'horse_no': horse2.get('horse_no'),
                                    'horse_name': horse2.get('horse_name'),
                                    'odds': odds2
                                },
                                'combination_odds': combination_odds
                            }
                            
                            combinations.append(combination)
                            
                    except (ValueError, TypeError) as e:
                        continue
            
            return combinations
            
        except Exception as e:
            print(f"❌ İki ayak kombinasyon hesaplama hatası: {e}")
            return []
    
    def analyze_costs(self, max_win=2500):
        """
        Tüm kombinasyonların maliyetlerini analiz eder.
        
        Args:
            max_win (float): Maksimum kazanç limiti
            
        Returns:
            list: Maliyet analizi listesi
        """
        try:
            print(f"\n💰 MALİYET ANALİZİ")
            print("=" * 60)
            print(f"🎯 Maksimum kazanç limiti: {max_win} TL")
            
            if not self.combinations:
                print("❌ Analiz edilecek kombinasyon bulunamadı")
                return []
            
            cost_analysis = []
            
            # Her kombinasyon için maliyet hesapla
            for i, combo in enumerate(self.combinations):
                bet_info = self.calculate_optimal_bet(combo, max_win)
                
                if bet_info:
                    cost_analysis.append({
                        'index': i + 1,
                        'combination': combo,
                        'bet_info': bet_info,
                        'bet_amount': bet_info['bet_amount'],
                        'potential_win': bet_info['potential_win'],
                        'profit': bet_info['profit']
                    })
            
            # Bet miktarına göre sırala
            cost_analysis.sort(key=lambda x: x['bet_amount'])
            
            self.cost_analysis = cost_analysis
            print(f"✅ {len(cost_analysis)} kombinasyon analiz edildi")
            
            return cost_analysis
            
        except Exception as e:
            print(f"❌ Maliyet analizi hatası: {e}")
            return []
    
    def find_minimum_total_cost_race_pair(self, race_1_data, race_2_data, max_win=2500):
        """
        En az toplam maliyetli ayak çiftini bulur.
        
        Args:
            race_1_data (list): İlk race ID'nin ayak verileri
            race_2_data (list): İkinci race ID'nin ayak verileri
            max_win (float): Maksimum kazanç limiti
            
        Returns:
            dict: En az toplam maliyetli ayak çifti
        """
        try:
            print(f"\n💰 AYAK ÇİFTİ TOPLAM MALİYET ANALİZİ")
            print("=" * 60)
            print(f"🎯 Maksimum kazanç limiti: {max_win} TL")
            
            race_pair_costs = []
            
            # Tüm ayak çiftleri için toplam maliyet hesapla
            for race1 in race_1_data:
                for race2 in race_2_data:
                    print(f"📊 Race ID {race1['race_id']}-{race1['number']}. x Race ID {race2['race_id']}-{race2['number']}. toplam maliyet hesaplanıyor...")
                    
                    cost_info = self.calculate_total_cost_for_race_pair(race1, race2, max_win)
                    
                    if cost_info:
                        race_pair_costs.append(cost_info)
                        print(f"   ✅ {cost_info['valid_combinations']} kombinasyon, Toplam: {cost_info['total_cost']:.2f} TL")
                    else:
                        print(f"   ❌ Maliyet hesaplanamadı")
            
            if not race_pair_costs:
                print("❌ Hesaplanabilir ayak çifti bulunamadı")
                return None
            
            # Toplam maliyete göre sırala
            race_pair_costs.sort(key=lambda x: x['total_cost'])
            
            min_cost_pair = race_pair_costs[0]
            
            print(f"\n🏆 EN AZ TOPLAM MALİYETLİ AYAK ÇİFTİ")
            print("=" * 60)
            
            race1 = min_cost_pair['race1']
            race2 = min_cost_pair['race2']
            
            print(f"💰 Toplam Maliyet: {min_cost_pair['total_cost']:.2f} TL")
            print(f"🎯 Toplam Kombinasyon: {min_cost_pair['total_combinations']}")
            print(f"✅ Geçerli Kombinasyon: {min_cost_pair['valid_combinations']}")
            print(f"📊 Ortalama Maliyet: {min_cost_pair['average_cost']:.2f} TL")
            print("-" * 60)
            
            print(f"🥇 1. AYAK: Race ID {race1['race_id']} - {race1['number']}. Ayak")
            print(f"   📝 Ayak Adı: {race1['race_name']}")
            print(f"   🐎 At Sayısı: {len(race1['horses'])}")
            print()
            
            print(f"🥈 2. AYAK: Race ID {race2['race_id']} - {race2['number']}. Ayak")
            print(f"   📝 Ayak Adı: {race2['race_name']}")
            print(f"   🐎 At Sayısı: {len(race2['horses'])}")
            print()
            
            print(f"🧮 HESAPLAMA:")
            print(f"   {len(race1['horses'])} at x {len(race2['horses'])} at = {min_cost_pair['total_combinations']} kombinasyon")
            print(f"   Toplam maliyet: {min_cost_pair['total_cost']:.2f} TL")
            print(f"   Ortalama maliyet: {min_cost_pair['average_cost']:.2f} TL")
            
            return min_cost_pair
            
        except Exception as e:
            print(f"❌ En az toplam maliyet bulma hatası: {e}")
            return None
    
    def display_race_pair_cost_summary(self, race_pair_costs, limit=10):
        """
        Ayak çifti maliyet özetini gösterir.
        
        Args:
            race_pair_costs (list): Ayak çifti maliyet listesi
            limit (int): Gösterilecek çift sayısı
        """
        try:
            if not race_pair_costs:
                print("❌ Gösterilecek maliyet verisi bulunamadı")
                return
            
            print(f"\n📊 AYAK ÇİFTİ MALİYET ÖZETİ (İlk {limit} Adet)")
            print("=" * 80)
            
            display_count = min(limit, len(race_pair_costs))
            
            for i, cost_info in enumerate(race_pair_costs[:display_count], 1):
                race1 = cost_info['race1']
                race2 = cost_info['race2']
                
                print(f"{i:2d}. 💰 {cost_info['total_cost']:8.2f} TL | "
                      f"R{race1['race_id']}-{race1['number']}.Ayak ({len(race1['horses'])} at) x "
                      f"R{race2['race_id']}-{race2['number']}.Ayak ({len(race2['horses'])} at) | "
                      f"{cost_info['valid_combinations']} kombinasyon")
            
            if len(race_pair_costs) > display_count:
                print(f"... ve {len(race_pair_costs) - display_count} ayak çifti daha")
            
            # İstatistikler
            total_pairs = len(race_pair_costs)
            min_cost = race_pair_costs[0]['total_cost']
            max_cost = race_pair_costs[-1]['total_cost']
            avg_cost = sum(item['total_cost'] for item in race_pair_costs) / total_pairs
            
            print("-" * 80)
            print(f"📈 İSTATİSTİKLER:")
            print(f"   🎯 Toplam Ayak Çifti: {total_pairs}")
            print(f"   💰 En Az Toplam Maliyet: {min_cost:.2f} TL")
            print(f"   💰 En Çok Toplam Maliyet: {max_cost:.2f} TL")
            print(f"   💰 Ortalama Toplam Maliyet: {avg_cost:.2f} TL")
            
        except Exception as e:
            print(f"❌ Ayak çifti maliyet özeti gösterimi hatası: {e}")
    
    def find_minimum_cost_combination(self):
        """
        En az maliyetli kombinasyonu bulur.
        
        Returns:
            dict: En az maliyetli kombinasyon
        """
        try:
            if not self.cost_analysis:
                print("❌ Analiz edilecek veri bulunamadı")
                return None
            
            min_cost = self.cost_analysis[0]  # Zaten sıralı
            
            print(f"\n🏆 EN AZ MALİYETLİ KOMBİNASYON")
            print("=" * 60)
            
            combo = min_cost['combination']
            bet_info = min_cost['bet_info']
            
            print(f"💰 Bahis Miktarı: {bet_info['bet_amount']} TL")
            print(f"🎯 Kombinasyon Oranı: {bet_info['odds']:.2f}")
            print(f"💸 Potansiyel Kazanç: {bet_info['potential_win']} TL")
            print(f"📈 Potansiyel Kar: {bet_info['profit']} TL")
            print("-" * 60)
            
            race1 = combo['race1']
            race2 = combo['race2']
            
            print(f"🥇 1. AYAK: Race ID {race1['race_id']} - {race1['number']}. Ayak")
            print(f"   🐎 At: {race1['horse_no']} - {race1['horse_name']}")
            print(f"   📊 Oran: {race1['odds']:.2f}")
            print()
            
            print(f"🥈 2. AYAK: Race ID {race2['race_id']} - {race2['number']}. Ayak")
            print(f"   🐎 At: {race2['horse_no']} - {race2['horse_name']}")
            print(f"   📊 Oran: {race2['odds']:.2f}")
            print()
            
            print(f"🧮 HESAPLAMA:")
            print(f"   {race1['odds']:.2f} x {race2['odds']:.2f} = {bet_info['odds']:.2f}")
            print(f"   Bahis: {bet_info['bet_amount']} TL")
            print(f"   Kazanç: {bet_info['bet_amount']} x {bet_info['odds']:.2f} = {bet_info['potential_win']} TL")
            
            return min_cost
            
        except Exception as e:
            print(f"❌ En az maliyet bulma hatası: {e}")
            return None
    
    def display_cost_summary(self, limit=10):
        """
        Maliyet özetini gösterir.
        
        Args:
            limit (int): Gösterilecek kombinasyon sayısı
        """
        try:
            if not self.cost_analysis:
                print("❌ Gösterilecek analiz bulunamadı")
                return
            
            print(f"\n📊 MALİYET ÖZETİ (İlk {limit} Adet)")
            print("=" * 80)
            
            display_count = min(limit, len(self.cost_analysis))
            
            for i, item in enumerate(self.cost_analysis[:display_count], 1):
                combo = item['combination']
                bet_info = item['bet_info']
                
                race1 = combo['race1']
                race2 = combo['race2']
                
                print(f"{i:2d}. 💰 {bet_info['bet_amount']} TL | "
                      f"R{race1['race_id']}-{race1['number']}.Ayak-{race1['horse_no']} ({race1['odds']:.2f}) x "
                      f"R{race2['race_id']}-{race2['number']}.Ayak-{race2['horse_no']} ({race2['odds']:.2f}) = {bet_info['odds']:.2f}")
            
            if len(self.cost_analysis) > display_count:
                print(f"... ve {len(self.cost_analysis) - display_count} kombinasyon daha")
            
            # İstatistikler
            total_combinations = len(self.cost_analysis)
            min_cost = self.cost_analysis[0]['bet_amount']
            max_cost = self.cost_analysis[-1]['bet_amount']
            avg_cost = sum(item['bet_amount'] for item in self.cost_analysis) / total_combinations
            
            print("-" * 80)
            print(f"📈 İSTATİSTİKLER:")
            print(f"   🎯 Toplam Kombinasyon: {total_combinations}")
            print(f"   💰 En Az Maliyet: {min_cost} TL")
            print(f"   💰 En Çok Maliyet: {max_cost} TL")
            print(f"   💰 Ortalama Maliyet: {avg_cost:.2f} TL")
            
        except Exception as e:
            print(f"❌ Maliyet özeti gösterimi hatası: {e}")
    
    def run(self):
        """Ana çalıştırma fonksiyonu"""
        try:
            print("💰 Bitalih Maliyet Analizi")
            print("=" * 50)
            print("Bu araç, iki Race ID ile tüm ayak kombinasyonlarının")
            print("maliyetlerini analiz eder ve en az toplam maliyetli ayak çiftini bulur.")
            print()
            
            # Maksimum kazanç limitini al
            while True:
                try:
                    max_win_input = input("💰 Maksimum kazanç limiti (TL) [varsayılan: 2500]: ").strip()
                    if not max_win_input:
                        max_win = 2500.0
                        break
                    else:
                        max_win = float(max_win_input)
                        if max_win > 0:
                            break
                        else:
                            print("❌ Maksimum kazanç limiti 0'dan büyük olmalıdır.")
                except ValueError:
                    print("❌ Lütfen geçerli bir sayı girin.")
                except KeyboardInterrupt:
                    print("\n⏹️ İşlem iptal edildi")
                    return
            
            print(f"✅ Maksimum kazanç limiti: {max_win} TL")
            print()
            
            # Race ID'leri al
            while True:
                try:
                    race_id_1 = input("🏁 İlk Race ID girin: ").strip()
                    if race_id_1.isdigit():
                        race_id_1 = int(race_id_1)
                        break
                    else:
                        print("❌ Lütfen geçerli bir sayı girin.")
                except KeyboardInterrupt:
                    print("\n⏹️ İşlem iptal edildi")
                    return
            
            while True:
                try:
                    race_id_2 = input("🏁 İkinci Race ID girin: ").strip()
                    if race_id_2.isdigit():
                        race_id_2 = int(race_id_2)
                        break
                    else:
                        print("❌ Lütfen geçerli bir sayı girin.")
                except KeyboardInterrupt:
                    print("\n⏹️ İşlem iptal edildi")
                    return
            
            print(f"\n⏰ Başlangıç Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Race verilerini al
            race_1_data = self.get_race_data(race_id_1)
            if not race_1_data:
                print(f"❌ Race ID {race_id_1} verileri alınamadı")
                return
            
            race_2_data = self.get_race_data(race_id_2)
            if not race_2_data:
                print(f"❌ Race ID {race_id_2} verileri alınamadı")
                return
            
            # En az toplam maliyetli ayak çiftini bul
            min_cost_pair = self.find_minimum_total_cost_race_pair(race_1_data, race_2_data, max_win)
            if not min_cost_pair:
                print("❌ En az toplam maliyetli ayak çifti bulunamadı")
                return
            
            # Tüm ayak çiftlerinin maliyet listesini oluştur
            race_pair_costs = []
            for race1 in race_1_data:
                for race2 in race_2_data:
                    cost_info = self.calculate_total_cost_for_race_pair(race1, race2, max_win)
                    if cost_info:
                        race_pair_costs.append(cost_info)
            
            # Toplam maliyete göre sırala
            race_pair_costs.sort(key=lambda x: x['total_cost'])
            
            # Ayak çifti maliyet özetini göster
            self.display_race_pair_cost_summary(race_pair_costs, 10)
            
            print(f"\n🎉 Analiz tamamlandı!")
            print(f"⏰ Bitiş Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
        except Exception as e:
            print(f"❌ Ana işlem hatası: {e}")


def main():
    """Ana fonksiyon"""
    try:
        analyzer = CostAnalyzer()
        analyzer.run()
    except KeyboardInterrupt:
        print("\n⏹️ Program kapatıldı")
    except Exception as e:
        print(f"❌ Program hatası: {e}")


if __name__ == "__main__":
    main()
