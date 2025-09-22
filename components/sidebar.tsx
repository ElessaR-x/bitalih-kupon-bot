"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  Button,
  User
} from "@heroui/react"
import { 
  AiOutlineHome,
  AiOutlineTrophy,
  AiOutlineCreditCard,
  AiOutlineLogin,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineMenu,
  AiOutlineClose
} from "react-icons/ai"

const menuItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <AiOutlineHome className="text-xl" />,
    href: "/"
  },
  {
    key: "races",
    label: "At Yarışları",
    icon: <AiOutlineTrophy className="text-xl" />,
    href: "/races"
  },
  {
    key: "coupons",
    label: "Kupon Oynama",
    icon: <AiOutlineCreditCard className="text-xl" />,
    href: "/coupons"
  },
  {
    key: "account-management",
    label: "Hesap Yönetimi",
    icon: <AiOutlineLogin className="text-xl" />,
    href: "/account-management"
  },
  {
    key: "settings",
    label: "Ayarlar",
    icon: <AiOutlineSetting className="text-xl" />,
    href: "/settings"
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth" })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
      >
        {isMobileMenuOpen ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-gray-800 border-r border-gray-700 h-screen flex flex-col fixed left-0 top-0 z-50
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>

      {/* User Info */}
      {session && (
        <div className="p-4 border-b border-gray-700">
          <User
            name={session.user?.name || session.user?.email}
            description="Bitalih Kullanıcısı"
            avatarProps={{
              src: session.user?.image || undefined,
              name: session.user?.name || session.user?.email || undefined
            }}
            classNames={{
              base: "justify-start",
              name: "text-white text-sm",
              description: "text-gray-400 text-xs"
            }}
          />
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.key}
                variant={isActive ? "solid" : "ghost"}
                color={isActive ? "primary" : "default"}
                className={`w-full justify-start ${
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
                startContent={item.icon}
                onClick={() => {
                  router.push(item.href)
                  setIsMobileMenuOpen(false) // Mobile'da menüyü kapat
                }}
              >
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          color="danger"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          startContent={<AiOutlineLogout className="text-xl" />}
          onClick={handleLogout}
        >
          Çıkış Yap
        </Button>
      </div>
      </div>
    </>
  )
}
