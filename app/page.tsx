"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@heroui/button"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { title, subtitle } from "@/components/primitives"
import Sidebar from "@/components/sidebar"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth" })
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64 p-4 lg:p-6 pt-16 lg:pt-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={title({ color: "foreground", size: "lg" })}>
              Bitalih Dashboard
            </h1>
            <p className={subtitle({ class: "mt-4 text-gray-400" })}>
              At yarışı verilerinize hoş geldiniz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <h3 className="text-xl font-semibold text-white">Hoş Geldiniz</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300">
                  Merhaba <strong>{session.user?.name || session.user?.email}</strong>! 
                  Bitalih Dashboard'a başarıyla giriş yaptınız.
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <h3 className="text-xl font-semibold text-white">At Yarışı Verileri</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300">
                  Bulletin API ile at yarışı verilerini ve sabit oranları görüntüleyebilirsiniz.
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <h3 className="text-xl font-semibold text-white">Kupon Oynama</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300">
                  Coupon API ile güvenli şekilde kupon oynayabilir ve bahis yapabilirsiniz.
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <h3 className="text-xl font-semibold text-white">Login Yönetimi</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300">
                  Login API ile token yönetimi ve session kontrolü yapabilirsiniz.
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <h3 className="text-xl font-semibold text-white">Sistem Durumu</h3>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Sistem Aktif</span>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <h3 className="text-xl font-semibold text-white">API Entegrasyonu</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300">
                  Tüm Bitalih API'leri entegre edilmiş ve kullanıma hazır durumda.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
