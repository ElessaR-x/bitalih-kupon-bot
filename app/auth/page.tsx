"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react"
import { title, subtitle } from "@/components/primitives"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const toggleVisibility = () => setIsVisible(!isVisible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      })

      if (result?.error) {
        setError("Geçersiz email veya şifre")
      } else if (result?.ok) {
        // Başarılı giriş - ana sayfaya yönlendir
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700">
          <CardBody className="gap-6 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  isRequired
                  variant="bordered"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "border-gray-600 bg-gray-700",
                    label: "text-gray-300",
                  }}
                />
              </div>

              <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                <Input
                  label="Şifre"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  isRequired
                  variant="bordered"
                  endContent={
                    <button
                      className="focus:outline-none hover:bg-gray-600 rounded-full p-1 transition-colors"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <AiOutlineEyeInvisible className="text-xl text-gray-400" />
                      ) : (
                        <AiOutlineEye className="text-xl text-gray-400" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "border-gray-600 bg-gray-700",
                    label: "text-gray-300",
                  }}
                />
              </div>

              {error && (
                <div className="text-red-300 text-sm text-center bg-red-900/20 border border-red-700 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold"
                isLoading={isLoading}
                disabled={!email || !password}
              >
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
