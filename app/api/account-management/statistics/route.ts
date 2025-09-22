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

    // Hesap istatistiklerini hesapla
    let whereClause = {}
    if (accountName) {
      whereClause = { account_name: accountName }
    }

    // Genel istatistikler
    const totalAccounts = await prisma.bitalihAccount.count()
    const totalCoupons = await prisma.bitalihCouponHistory.count()
    const successfulCoupons = await prisma.bitalihCouponHistory.count({
      where: { success: true }
    })

    // Toplam bahis ve kazanç
    const betStats = await prisma.bitalihCouponHistory.aggregate({
      _sum: {
        bet_amount: true,
        potential_win: true
      }
    })

    const totalBetAmount = betStats._sum.bet_amount || 0
    const totalWinAmount = betStats._sum.potential_win || 0
    const netProfit = totalWinAmount - totalBetAmount

    // Hesap bazında istatistikler
    const accountStats = await prisma.bitalihAccount.findMany({
      where: whereClause,
      select: {
        account_name: true,
        total_coupons_played: true,
        successful_coupons: true,
        total_bet_amount: true,
        total_win_amount: true,
        created_at: true,
        last_used: true
      },
      orderBy: {
        total_coupons_played: 'desc'
      }
    })

    // En aktif hesaplar
    const mostActiveAccounts = await prisma.bitalihAccount.findMany({
      orderBy: {
        total_coupons_played: 'desc'
      },
      take: 5,
      select: {
        account_name: true,
        total_coupons_played: true,
        successful_coupons: true
      }
    })

    // En karlı hesaplar
    const mostProfitableAccounts = await prisma.bitalihAccount.findMany({
      orderBy: {
        total_win_amount: 'desc'
      },
      take: 5,
      select: {
        account_name: true,
        total_bet_amount: true,
        total_win_amount: true
      }
    })

    // Başarı oranı hesapla
    const successRate = totalCoupons > 0 ? (successfulCoupons / totalCoupons) * 100 : 0

    const statistics = {
      general: {
        total_accounts: totalAccounts,
        total_coupons: totalCoupons,
        successful_coupons: successfulCoupons,
        success_rate: successRate,
        total_bet_amount: totalBetAmount,
        total_win_amount: totalWinAmount,
        net_profit: netProfit
      },
      accounts: accountStats.map(account => ({
        account_name: account.account_name,
        total_coupons_played: account.total_coupons_played,
        successful_coupons: account.successful_coupons,
        success_rate: account.total_coupons_played > 0 
          ? (account.successful_coupons / account.total_coupons_played) * 100 
          : 0,
        total_bet_amount: account.total_bet_amount,
        total_win_amount: account.total_win_amount,
        net_profit: account.total_win_amount - account.total_bet_amount,
        created_at: account.created_at.toISOString(),
        last_used: account.last_used?.toISOString() || null
      })),
      rankings: {
        most_active: mostActiveAccounts.map(account => ({
          account_name: account.account_name,
          total_coupons_played: account.total_coupons_played,
          successful_coupons: account.successful_coupons,
          success_rate: account.total_coupons_played > 0 
            ? (account.successful_coupons / account.total_coupons_played) * 100 
            : 0
        })),
        most_profitable: mostProfitableAccounts.map(account => ({
          account_name: account.account_name,
          total_bet_amount: account.total_bet_amount,
          total_win_amount: account.total_win_amount,
          net_profit: account.total_win_amount - account.total_bet_amount
        }))
      }
    }

    return NextResponse.json({ 
      success: true, 
      statistics 
    })

  } catch (error: any) {
    console.error('İstatistik API hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    }, { status: 500 })
  }
}
