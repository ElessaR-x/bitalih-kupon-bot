import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 })
    }

    // Tüm Bitalih hesaplarını getir
    const accounts = await prisma.bitalihAccount.findMany({
      orderBy: {
        created_at: 'desc'
      }
    })

    // Hesap verilerini düzenle
    const formattedAccounts = accounts.map(account => ({
      account_name: account.account_name,
      created_at: account.created_at.toISOString(),
      last_used: account.last_used?.toISOString() || null,
      total_coupons_played: account.total_coupons_played,
      successful_coupons: account.successful_coupons,
      total_bet_amount: account.total_bet_amount,
      total_win_amount: account.total_win_amount
    }))

    return NextResponse.json({ 
      success: true, 
      accounts: formattedAccounts 
    })

  } catch (error: any) {
    console.error('Hesap listesi API hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    }, { status: 500 })
  }
}
