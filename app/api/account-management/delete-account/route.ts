import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request: Request) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 })
    }

    const { account_name } = await request.json()

    // Hesap adını kontrol et
    if (!account_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Hesap adı gerekli' 
      }, { status: 400 })
    }

    // Hesabın var olup olmadığını kontrol et
    const existingAccount = await prisma.bitalihAccount.findUnique({
      where: { account_name },
      include: {
        coupon_history: true
      }
    })

    if (!existingAccount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Hesap bulunamadı' 
      }, { status: 404 })
    }

    console.log(`🗑️ ${account_name} hesabı siliniyor...`)
    console.log(`   • Kupon geçmişi kayıtları: ${existingAccount.coupon_history.length}`)

    // Hesabı ve ilişkili kupon geçmişini sil (cascade delete)
    await prisma.bitalihAccount.delete({
      where: { account_name }
    })

    console.log(`✅ ${account_name} hesabı başarıyla silindi`)

    return NextResponse.json({ 
      success: true, 
      message: 'Hesap başarıyla silindi'
    })

  } catch (error: any) {
    console.error('Hesap silme API hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    }, { status: 500 })
  }
}
