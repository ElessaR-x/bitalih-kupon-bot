import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Bitalih kupon oynama fonksiyonu
async function playBitalihCoupon(ssn: string, password: string, combination: any, betAmount: number, odds: number) {
  try {
    // AbortController ile timeout implementasyonu
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 saniye timeout

    // Önce login yap
    const loginResponse = await fetch('https://www.bitalih.com/api/auth/login', {
      method: 'POST',
      headers: {
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
        'Priority': 'u=1, i',
        'Cookie': 'platform=web; MgidSensorNVis=1; MgidSensorHref=https://www.bitalih.com/; LaVisitorNew=Y; LaVisitorId_Yml0YWxpaC5sYWRlc2suY29tLw=sqvou6bqprs92ud41sfl69uj8b2d7efg; LaSID=89mdfne9nmzc918egyizfk1p79a3ku2h; LaUserDetails=%7B%7D'
      },
      body: JSON.stringify({
        ssn: ssn,
        password: password,
        remember: false
      }),
      signal: controller.signal
    })

    // Timeout'u temizle
    clearTimeout(timeoutId)

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.error('Login response error:', loginResponse.status, errorText)
      return { success: false, message: `Bitalih login başarısız (${loginResponse.status}): ${errorText}` }
    }

    const loginData = await loginResponse.json()
    console.log('Login response:', loginData)
    
    if (!loginData?.success || !loginData?.data?.success) {
      return { success: false, message: `Bitalih login başarısız: ${loginData?.message || 'Bilinmeyen hata'}` }
    }

    const token = loginData.data.data.token
    
    // Cookie'leri response header'larından al
    const setCookieHeader = loginResponse.headers.get('set-cookie')
    const cookies: { [key: string]: string } = {}
    
    if (setCookieHeader) {
      const cookieStrings = setCookieHeader.split(',')
      for (const cookieString of cookieStrings) {
        const [nameValue] = cookieString.split(';')
        const [name, value] = nameValue.split('=')
        if (name && value) {
          cookies[name.trim()] = value.trim()
        }
      }
    }
    
    console.log('Token:', token)
    console.log('Cookies:', cookies)

    // Runner'ları oluştur
    const runners = [
      {
        raceId: combination.combination.race1.race_id,
        runNo: combination.combination.race1.number,
        horseNo: combination.combination.race1.horse_no
      },
      {
        raceId: combination.combination.race2.race_id,
        runNo: combination.combination.race2.number,
        horseNo: combination.combination.race2.horse_no
      }
    ]

    // Kupon verisi hazırla
    const couponData = {
      runners: runners,
      amount: betAmount.toString(),
      multiplier: betAmount,
      complete: false,
      oddAtPlay: odds.toString(),
      count: 1
    }

    // Önce validate et
    const validateResponse = await fetch('https://www.bitalih.com/api/tjk/coupon/fob/play/validate', {
      method: 'POST',
      headers: {
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
        'Priority': 'u=1, i',
        'Authorization': `Bearer ${token}`,
        'Cookie': [
          ...Object.entries(cookies).map(([key, value]) => `${key}=${value}`),
          'platform=web',
          'LaVisitorNew=Y',
          'LaVisitorId_Yml0YWxpaC5sYWRlc2suY29tLw=sqvou6bqprs92ud41sfl69uj8b2d7efg',
          'LaSID=89mdfne9nmzc918egyizfk1p79a3ku2h',
          'MgidSensorNVis=4',
          'MgidSensorHref=https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/istanbul'
        ].join('; ')
      },
      body: JSON.stringify(couponData)
    })

    if (!validateResponse.ok) {
      const errorText = await validateResponse.text()
      console.error('Validate response error:', validateResponse.status, errorText)
      return { success: false, message: `Kupon doğrulaması başarısız (${validateResponse.status}): ${errorText}` }
    }

    const validateData = await validateResponse.json()
    console.log('Validate response:', validateData)
    
    if (!validateData?.success) {
      return { success: false, message: `Kupon doğrulaması başarısız: ${validateData?.message || 'Bilinmeyen hata'}` }
    }

    // Runner durumlarını kontrol et
    const data = validateData.data || []
    for (const item of data) {
      if (item.isStartedRun) {
        return { success: false, message: 'Yarış başlamış, kupon oynanamaz' }
      }
    }

    // Kuponu oyna
    const playResponse = await fetch('https://www.bitalih.com/api/tjk/coupon/fob/play', {
      method: 'POST',
      headers: {
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
        'Priority': 'u=1, i',
        'Authorization': `Bearer ${token}`,
        'Cookie': [
          ...Object.entries(cookies).map(([key, value]) => `${key}=${value}`),
          'platform=web',
          'LaVisitorNew=Y',
          'LaVisitorId_Yml0YWxpaC5sYWRlc2suY29tLw=sqvou6bqprs92ud41sfl69uj8b2d7efg',
          'LaSID=89mdfne9nmzc918egyizfk1p79a3ku2h',
          'MgidSensorNVis=4',
          'MgidSensorHref=https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/istanbul'
        ].join('; ')
      },
      body: JSON.stringify(couponData)
    })

    if (!playResponse.ok) {
      const errorText = await playResponse.text()
      console.error('Play response error:', playResponse.status, errorText)
      return { success: false, message: `Kupon oynama başarısız (${playResponse.status}): ${errorText}` }
    }

    const playData = await playResponse.json()
    console.log('Play response:', playData)
    
    if (!playData?.success) {
      return { success: false, message: `Kupon oynama başarısız: ${playData?.message || 'Bilinmeyen hata'}` }
    }

    return { 
      success: true, 
      message: 'Kupon başarıyla oynandı',
      result: playData
    }

  } catch (error) {
    console.error('Bitalih kupon oynama hatası:', error)
    return { success: false, message: 'Kupon oynama hatası' }
  }
}

export async function POST(request: Request) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 })
    }

    const { account_name, combination, bet_amount, odds } = await request.json()

    // Gerekli alanları kontrol et
    if (!account_name || !combination || !bet_amount || !odds) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tüm alanlar doldurulmalıdır' 
      }, { status: 400 })
    }

    // Hesabı bul
    const account = await prisma.bitalihAccount.findUnique({
      where: { account_name }
    })

    if (!account) {
      return NextResponse.json({ 
        success: false, 
        error: 'Hesap bulunamadı' 
      }, { status: 404 })
    }

    // Kuponu oyna
    const result = await playBitalihCoupon(
      account.ssn,
      account.password,
      combination,
      bet_amount,
      odds
    )

    // Kupon kaydını tut
    const couponData = {
      races: [
        {
          race_id: combination.combination.race1.race_id,
          number: combination.combination.race1.number,
          horse_no: combination.combination.race1.horse_no,
          horse_name: combination.combination.race1.horse_name,
          odds: combination.combination.race1.odds
        },
        {
          race_id: combination.combination.race2.race_id,
          number: combination.combination.race2.number,
          horse_no: combination.combination.race2.horse_no,
          horse_name: combination.combination.race2.horse_name,
          odds: combination.combination.race2.odds
        }
      ],
      bet_amount: bet_amount,
      odds: odds,
      potential_win: combination.potential_win,
      profit: combination.profit
    }

    // Kupon geçmişini kaydet
    await prisma.bitalihCouponHistory.create({
      data: {
        account_name: account_name,
        race_data: JSON.stringify(couponData.races),
        bet_amount: bet_amount,
        odds: odds,
        potential_win: combination.potential_win,
        profit: combination.profit,
        success: result.success,
        result_message: result.message
      }
    })

    // Hesap istatistiklerini güncelle
    await prisma.bitalihAccount.update({
      where: { account_name },
      data: {
        total_coupons_played: { increment: 1 },
        successful_coupons: result.success ? { increment: 1 } : undefined,
        total_bet_amount: { increment: bet_amount },
        total_win_amount: result.success ? { increment: combination.potential_win } : undefined,
        last_used: new Date()
      }
    })

    return NextResponse.json({ 
      success: result.success,
      message: result.message,
      result: result.result
    })

  } catch (error) {
    console.error('Kupon oynama API hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Kupon oynama hatası' 
    }, { status: 500 })
  }
}
