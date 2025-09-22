import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountName = searchParams.get('account')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Kupon geçmişini getir
    let whereClause = {}
    if (accountName) {
      whereClause = { account_name: accountName }
    }

    const couponHistory = await prisma.bitalihCouponHistory.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    })

    // Kupon geçmişini formatla
    const formattedHistory = couponHistory.map(coupon => {
      let raceData
      try {
        raceData = JSON.parse(coupon.race_data)
      } catch (error) {
        raceData = { races: [] }
      }

      return {
        timestamp: coupon.timestamp.toISOString(),
        account_name: coupon.account_name,
        coupon_data: {
          races: raceData.races || [],
          bet_amount: coupon.bet_amount,
          odds: coupon.odds,
          potential_win: coupon.potential_win,
          profit: coupon.profit
        },
        result: {
          success: coupon.success,
          message: coupon.result_message
        },
        success: coupon.success
      }
    })

    return NextResponse.json({ 
      success: true, 
      history: formattedHistory 
    })

  } catch (error: any) {
    console.error('Kupon geçmişi API hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    }, { status: 500 })
  }
}
