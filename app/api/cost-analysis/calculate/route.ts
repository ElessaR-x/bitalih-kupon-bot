import { NextRequest, NextResponse } from 'next/server'

interface Horse {
  horse_no: number
  horse_name: string
  odds: number
  jockey: string
  trainer: string
  weight: number
  age: string
  sex: string
}

interface RaceData {
  race_id: number
  race_number: number
  race_name: string
  race_time: string
  horses: Horse[]
  total_horses: number
}

interface Combination {
  race1: {
    race_id: number
    number: number
    race_name: string
    horse_no: number
    horse_name: string
    odds: number
  }
  race2: {
    race_id: number
    number: number
    race_name: string
    horse_no: number
    horse_name: string
    odds: number
  }
  combination_odds: number
}

interface BetInfo {
  bet_amount: number
  odds: number
  potential_win: number
  profit: number
}

interface CostAnalysisItem {
  index: number
  combination: Combination
  bet_info: BetInfo
  bet_amount: number
  potential_win: number
  profit: number
}

interface RacePairCost {
  race1: RaceData
  race2: RaceData
  total_combinations: number
  valid_combinations: number
  total_cost: number
  average_cost: number
}

function calculateOptimalBet(combination: Combination, maxWin: number): BetInfo | null {
  try {
    const odds = combination.combination_odds
    
    // Optimal bahis miktarını hesapla
    let optimalBet = maxWin / odds
    
    // Minimum 1 TL bahis
    const minBet = 1.0
    if (optimalBet < minBet) {
      optimalBet = minBet
    }
    
    // Bahis miktarını düzenle
    let betAmount = Math.round(optimalBet * 100) / 100
    
    // 10 TL'nin altındaki bahisler 10 TL yap
    if (betAmount < 10) {
      betAmount = 10.0
    }
    
    // Küsüratlı bahisleri bir üst tam sayıya tamamla
    if (betAmount !== Math.floor(betAmount)) {
      betAmount = Math.floor(betAmount) + 1
    }
    
    const actualWin = betAmount * odds
    
    return {
      bet_amount: betAmount,
      odds: odds,
      potential_win: Math.round(actualWin * 100) / 100,
      profit: Math.round((actualWin - betAmount) * 100) / 100
    }
    
  } catch (error) {
    console.error('Bahis hesaplama hatası:', error)
    return null
  }
}

function calculateCombinationsForTwoRaces(race1: RaceData, race2: RaceData): Combination[] {
  try {
    const combinations: Combination[] = []
    
    // Her at kombinasyonunu hesapla
    for (const horse1 of race1.horses) {
      for (const horse2 of race2.horses) {
        try {
          const odds1 = parseFloat(horse1.odds.toString())
          const odds2 = parseFloat(horse2.odds.toString())
          
          if (odds1 > 0 && odds2 > 0) {
            const combinationOdds = odds1 * odds2
            
            const combination: Combination = {
              race1: {
                race_id: race1.race_id,
                number: race1.race_number,
                race_name: race1.race_name,
                horse_no: horse1.horse_no,
                horse_name: horse1.horse_name,
                odds: odds1
              },
              race2: {
                race_id: race2.race_id,
                number: race2.race_number,
                race_name: race2.race_name,
                horse_no: horse2.horse_no,
                horse_name: horse2.horse_name,
                odds: odds2
              },
              combination_odds: combinationOdds
            }
            
            combinations.push(combination)
          }
        } catch (error) {
          continue
        }
      }
    }
    
    return combinations
    
  } catch (error) {
    console.error('İki ayak kombinasyon hesaplama hatası:', error)
    return []
  }
}

function calculateTotalCostForRacePair(race1: RaceData, race2: RaceData, maxWin: number): RacePairCost | null {
  try {
    // Bu iki ayak için tüm at kombinasyonlarını hesapla
    const combinations = calculateCombinationsForTwoRaces(race1, race2)
    
    if (!combinations.length) {
      return null
    }
    
    let totalCost = 0
    const totalCombinations = combinations.length
    let validCombinations = 0
    
    // Her kombinasyon için maliyet hesapla
    for (const combo of combinations) {
      const betInfo = calculateOptimalBet(combo, maxWin)
      if (betInfo) {
        totalCost += betInfo.bet_amount
        validCombinations++
      }
    }
    
    return {
      race1,
      race2,
      total_combinations: totalCombinations,
      valid_combinations: validCombinations,
      total_cost: Math.round(totalCost * 100) / 100,
      average_cost: validCombinations > 0 ? Math.round((totalCost / validCombinations) * 100) / 100 : 0
    }
    
  } catch (error) {
    console.error('İki ayak toplam maliyet hesaplama hatası:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { race1Data, race2Data, maxWin = 2500 } = body
    
    if (!race1Data || !race2Data) {
      return NextResponse.json(
        { success: false, error: 'Race verileri eksik' },
        { status: 400 }
      )
    }
    
    console.log('Maliyet analizi başlatılıyor...')
    console.log(`Race 1: ${race1Data.race_id}-${race1Data.race_number}, Race 2: ${race2Data.race_id}-${race2Data.race_number}`)
    console.log(`Maksimum kazanç: ${maxWin} TL`)
    
    // İki ayak için toplam maliyet hesapla
    const racePairCost = calculateTotalCostForRacePair(race1Data, race2Data, maxWin)
    
    if (!racePairCost) {
      return NextResponse.json(
        { success: false, error: 'Maliyet hesaplanamadı' },
        { status: 400 }
      )
    }
    
    // Tüm kombinasyonları hesapla
    const combinations = calculateCombinationsForTwoRaces(race1Data, race2Data)
    
    // Her kombinasyon için maliyet analizi yap
    const costAnalysis: CostAnalysisItem[] = []
    
    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i]
      const betInfo = calculateOptimalBet(combo, maxWin)
      
      if (betInfo) {
        costAnalysis.push({
          index: i + 1,
          combination: combo,
          bet_info: betInfo,
          bet_amount: betInfo.bet_amount,
          potential_win: betInfo.potential_win,
          profit: betInfo.profit
        })
      }
    }
    
    // Bet miktarına göre sırala
    costAnalysis.sort((a, b) => a.bet_amount - b.bet_amount)
    
    console.log(`✅ ${costAnalysis.length} kombinasyon analiz edildi`)
    console.log(`💰 Toplam maliyet: ${racePairCost.total_cost} TL`)
    
    return NextResponse.json({
      success: true,
      data: {
        racePairCost,
        costAnalysis,
        summary: {
          total_combinations: combinations.length,
          valid_combinations: costAnalysis.length,
          total_cost: racePairCost.total_cost,
          average_cost: racePairCost.average_cost,
          min_bet: costAnalysis.length > 0 ? costAnalysis[0].bet_amount : 0,
          max_bet: costAnalysis.length > 0 ? costAnalysis[costAnalysis.length - 1].bet_amount : 0
        }
      }
    })
    
  } catch (error) {
    console.error('Maliyet analizi hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Maliyet analizi sırasında hata oluştu' },
      { status: 500 }
    )
  }
}
