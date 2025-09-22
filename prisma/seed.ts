import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Şifreleri hash'le
  const testPassword = await bcrypt.hash('123456', 12)
  const adminPassword = await bcrypt.hash('admin123', 12)

  // Test kullanıcısı oluştur
  const testUser = await prisma.user.upsert({
    where: { email: 'test@bitalih.com' },
    update: {},
    create: {
      email: 'test@bitalih.com',
      name: 'Test User',
      password: testPassword,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Test user created:', testUser.email, '(Password: 123456)')

  // Admin kullanıcısı oluştur
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bitalih.com' },
    update: {},
    create: {
      email: 'admin@bitalih.com',
      name: 'Admin User',
      password: adminPassword,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user created:', adminUser.email, '(Password: admin123)')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
