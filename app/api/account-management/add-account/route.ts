import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Bitalih login testi için basit bir fonksiyon
async function testBitalihLogin(ssn: string, password: string): Promise<boolean> {
  try {
    // AbortController ile timeout implementasyonu
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 saniye timeout

    // Bitalih login API'sini test et
    const response = await fetch('https://www.bitalih.com/api/auth/login', {
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

    if (response.ok) {
      const result = await response.json()
      return result?.success && result?.data?.success
    }
    
    return false
  } catch (error) {
    console.error('Bitalih login test hatası:', error)
    // Timeout hatası kontrolü
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Login request timeout (10 saniye)')
    }
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 })
    }

    const { account_name, ssn, password, commission_enabled, daily_commission, notes } = await request.json()

    // Gerekli alanları kontrol et
    if (!account_name || !ssn || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tüm alanlar doldurulmalıdır' 
      }, { status: 400 })
    }

    // Hesap adının benzersiz olduğunu kontrol et
    const existingAccount = await prisma.bitalihAccount.findUnique({
      where: { account_name }
    })

    if (existingAccount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bu hesap adı zaten kullanılıyor' 
      }, { status: 400 })
    }

    console.log(`🔐 ${account_name} hesabı için Bitalih login testi başlatılıyor...`)

    // Bitalih login testini yap
    const loginTestResult = await testBitalihLogin(ssn, password)
    
    if (!loginTestResult) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bitalih login testi başarısız. TC kimlik no veya şifre hatalı olabilir.' 
      }, { status: 400 })
    }

    console.log(`✅ ${account_name} hesabı için Bitalih login testi başarılı`)

    // Hesabı veritabanına kaydet (şifreleme olmadan)
    const newAccount = await prisma.bitalihAccount.create({
      data: {
        account_name,
        ssn,
        password,
        commission_enabled: commission_enabled || false,
        daily_commission: daily_commission || 0,
        notes: notes || null,
        created_at: new Date(),
        total_coupons_played: 0,
        successful_coupons: 0,
        total_bet_amount: 0,
        total_win_amount: 0
      }
    })

    console.log(`✅ ${account_name} hesabı başarıyla eklendi`)

    return NextResponse.json({ 
      success: true, 
      message: 'Hesap başarıyla eklendi',
      account: {
        account_name: newAccount.account_name,
        created_at: newAccount.created_at.toISOString()
      }
    })

  } catch (error: any) {
    console.error('Hesap ekleme API hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    }, { status: 500 })
  }
}
