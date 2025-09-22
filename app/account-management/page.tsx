"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Checkbox,
  Textarea
} from "@heroui/react"
import { title, subtitle } from "@/components/primitives"
import Sidebar from "@/components/sidebar"
import { 
  AiOutlinePlus,
  AiOutlineUser,
  AiOutlineDelete,
  AiOutlineEye,
  AiOutlineTrophy,
  AiOutlineDollar,
  AiOutlineCalendar,
  AiOutlineCheck,
  AiOutlineClose
} from "react-icons/ai"

interface Account {
  account_name: string
  created_at: string
  last_used: string | null
  total_coupons_played: number
  successful_coupons: number
  total_bet_amount: number
  total_win_amount: number
  commission_enabled: boolean
  daily_commission: number
  notes: string | null
}

interface CouponHistory {
  timestamp: string
  account_name: string
  coupon_data: {
    races: Array<{
      race_id: number
      number: number
      horse_no: number
      horse_name: string
      odds: number
    }>
    bet_amount: number
    odds: number
    potential_win: number
    profit: number
  }
  result: {
    success: boolean
    message: string
  }
  success: boolean
}

export default function AccountManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [couponHistory, setCouponHistory] = useState<CouponHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedTab, setSelectedTab] = useState("accounts")
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
  
  // Add account form
  const [newAccount, setNewAccount] = useState({
    account_name: "",
    ssn: "",
    password: "",
    commission_enabled: false,
    daily_commission: 0,
    notes: ""
  })
  const [isAddingAccount, setIsAddingAccount] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts()
    }
  }, [status])

  useEffect(() => {
    if (selectedAccount) {
      fetchCouponHistory(selectedAccount)
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/account-management/accounts')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAccounts(data.accounts || [])
        } else {
          setError(data.error || "Hesaplar alınamadı")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "API hatası")
      }
    } catch (err) {
      setError("Bağlantı hatası")
    } finally {
      setLoading(false)
    }
  }

  const fetchCouponHistory = async (accountName: string) => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch(`/api/account-management/coupon-history?account=${encodeURIComponent(accountName)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCouponHistory(data.history || [])
        } else {
          setError(data.error || "Kupon geçmişi alınamadı")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "API hatası")
      }
    } catch (err) {
      setError("Bağlantı hatası")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.account_name || !newAccount.ssn || !newAccount.password) {
      setError("Hesap adı, TC kimlik no ve şifre alanları doldurulmalıdır")
      return
    }

    if (newAccount.commission_enabled && newAccount.daily_commission <= 0) {
      setError("Komisyon aktifse günlük komisyon miktarı 0'dan büyük olmalıdır")
      return
    }

    setIsAddingAccount(true)
    setError("")
    
    try {
      const response = await fetch('/api/account-management/add-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNewAccount({ 
            account_name: "", 
            ssn: "", 
            password: "", 
            commission_enabled: false, 
            daily_commission: 0, 
            notes: "" 
          })
          setIsAddModalOpen(false)
          fetchAccounts()
        } else {
          setError(data.error || "Hesap eklenemedi")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "API hatası")
      }
    } catch (err) {
      setError("Bağlantı hatası")
    } finally {
      setIsAddingAccount(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return

    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/account-management/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_name: accountToDelete })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAccountToDelete(null)
          setIsDeleteModalOpen(false)
          fetchAccounts()
        } else {
          setError(data.error || "Hesap silinemedi")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "API hatası")
      }
    } catch (err) {
      setError("Bağlantı hatası")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (accountName: string) => {
    setAccountToDelete(accountName)
    setIsDeleteModalOpen(true)
  }

  const getSuccessRate = (successful: number, total: number) => {
    if (total === 0) return 0
    return (successful / total) * 100
  }

  const getProfit = (win: number, bet: number) => {
    return win - bet
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64 p-4 lg:p-6 pt-16 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <AiOutlineUser className="text-xl sm:text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Hesap Yönetimi
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  Bitalih hesaplarınızı yönetin ve kupon geçmişinizi inceleyin
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl mb-6">
            <CardBody className="p-0">
              <Tabs 
                selectedKey={selectedTab} 
                onSelectionChange={(key) => setSelectedTab(key as string)}
                classNames={{
                  tabList: "bg-gray-700/50",
                  tab: "text-gray-300 data-[selected=true]:text-white",
                  panel: "p-6"
                }}
              >
                <Tab key="accounts" title="Hesaplar">
                  <div className="space-y-6">
                    {/* Add Account Button */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Kayıtlı Hesaplar</h3>
                      <Button
                        color="success"
                        startContent={<AiOutlinePlus />}
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        Yeni Hesap Ekle
                      </Button>
                    </div>

                    {/* Accounts Table */}
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" color="primary" />
                      </div>
                    ) : accounts.length === 0 ? (
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardBody className="text-center py-8">
                          <AiOutlineUser className="text-4xl text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">Henüz kayıtlı hesap bulunmuyor</p>
                          <p className="text-sm text-gray-500 mt-2">Yeni hesap ekleyerek başlayın</p>
                        </CardBody>
                      </Card>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table aria-label="Hesaplar tablosu" className="min-w-full">
                          <TableHeader>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Hesap Adı</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Oluşturulma</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Son Kullanım</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Kuponlar</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Başarı Oranı</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Toplam Bahis</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Net Kar/Zarar</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">Komisyon</TableColumn>
                            <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">İşlemler</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {accounts.map((account) => (
                              <TableRow key={account.account_name} className="hover:bg-gray-700/30 transition-colors">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <AiOutlineUser className="text-blue-400" />
                                    <span className="text-white font-medium">{account.account_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-gray-300">
                                    {new Date(account.created_at).toLocaleDateString('tr-TR')}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-gray-300">
                                    {account.last_used 
                                      ? new Date(account.last_used).toLocaleDateString('tr-TR')
                                      : "Hiç kullanılmamış"
                                    }
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Chip color="primary" variant="flat" size="sm">
                                      {account.total_coupons_played}
                                    </Chip>
                                    <span className="text-green-400 text-sm">
                                      ({account.successful_coupons} başarılı)
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    color={getSuccessRate(account.successful_coupons, account.total_coupons_played) >= 70 ? "success" : 
                                           getSuccessRate(account.successful_coupons, account.total_coupons_played) >= 50 ? "warning" : "danger"}
                                    variant="flat"
                                    size="sm"
                                  >
                                    {getSuccessRate(account.successful_coupons, account.total_coupons_played).toFixed(1)}%
                                  </Chip>
                                </TableCell>
                                <TableCell>
                                  <span className="text-yellow-400 font-medium">
                                    {account.total_bet_amount.toFixed(2)} TL
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`font-medium ${
                                    getProfit(account.total_win_amount, account.total_bet_amount) >= 0 
                                      ? "text-green-400" 
                                      : "text-red-400"
                                  }`}>
                                    {getProfit(account.total_win_amount, account.total_bet_amount).toFixed(2)} TL
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {account.commission_enabled ? (
                                      <>
                                        <Chip color="success" variant="flat" size="sm">
                                          Aktif
                                        </Chip>
                                        <span className="text-yellow-400 text-xs">
                                          {account.daily_commission.toFixed(2)} TL/gün
                                        </span>
                                      </>
                                    ) : (
                                      <Chip color="default" variant="flat" size="sm">
                                        Pasif
                                      </Chip>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      color="primary"
                                      startContent={<AiOutlineEye />}
                                      onClick={() => {
                                        setSelectedAccount(account.account_name)
                                        setSelectedTab("history")
                                      }}
                                    >
                                      Geçmiş
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      color="danger"
                                      startContent={<AiOutlineDelete />}
                                      onClick={() => openDeleteModal(account.account_name)}
                                    >
                                      Sil
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </Tab>

                <Tab key="history" title="Kupon Geçmişi">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">
                        Kupon Geçmişi
                        {selectedAccount && (
                          <span className="text-blue-400 ml-2">- {selectedAccount}</span>
                        )}
                      </h3>
                      {selectedAccount && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedAccount(null)
                            setCouponHistory([])
                          }}
                        >
                          Tüm Hesaplar
                        </Button>
                      )}
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" color="primary" />
                      </div>
                    ) : couponHistory.length === 0 ? (
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardBody className="text-center py-8">
                          <AiOutlineTrophy className="text-4xl text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">Kupon geçmişi bulunmuyor</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {selectedAccount ? "Bu hesap için" : "Henüz"} oynanmış kupon bulunmuyor
                          </p>
                        </CardBody>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {couponHistory.map((coupon, index) => (
                          <Card key={index} className="bg-gray-700/50 border-gray-600">
                            <CardBody className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  {coupon.success ? (
                                    <AiOutlineCheck className="text-green-400 text-xl" />
                                  ) : (
                                    <AiOutlineClose className="text-red-400 text-xl" />
                                  )}
                                  <span className="text-white font-medium">
                                    {new Date(coupon.timestamp).toLocaleString('tr-TR')}
                                  </span>
                                  <Chip 
                                    color={coupon.success ? "success" : "danger"} 
                                    variant="flat" 
                                    size="sm"
                                  >
                                    {coupon.success ? "Başarılı" : "Başarısız"}
                                  </Chip>
                                </div>
                                <span className="text-gray-400 text-sm">{coupon.account_name}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="text-sm text-gray-400 mb-2">Kombinasyon</h4>
                                  <div className="space-y-1">
                                    {coupon.coupon_data.races.map((race, raceIndex) => (
                                      <div key={raceIndex} className="text-white text-sm">
                                        R{race.race_id}-{race.number}.Ayak-{race.horse_no} {race.horse_name}
                                        <span className="text-gray-400 ml-2">({race.odds.toFixed(2)})</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm text-gray-400 mb-2">Bahis Bilgileri</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="text-white">
                                      Bahis: <span className="text-yellow-400">{coupon.coupon_data.bet_amount} TL</span>
                                    </div>
                                    <div className="text-white">
                                      Oran: <span className="text-blue-400">{coupon.coupon_data.odds.toFixed(2)}</span>
                                    </div>
                                    <div className="text-white">
                                      Potansiyel Kazanç: <span className="text-green-400">{coupon.coupon_data.potential_win} TL</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm text-gray-400 mb-2">Sonuç</h4>
                                  <div className="text-sm text-gray-300">
                                    {coupon.result.message}
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/50 shadow-xl">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AiOutlineClose className="text-xl text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-300">Hata</h4>
                    <p className="text-red-200 mt-1">{error}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AiOutlinePlus className="text-blue-400" />
                  <span className="text-white">Yeni Hesap Ekle</span>
                </div>
                <p className="text-gray-400 text-sm">Hesap bilgilerini girin, login testi yapılacak</p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Hesap Adı"
                    placeholder="Hesap adını girin"
                    value={newAccount.account_name}
                    onChange={(e) => setNewAccount({...newAccount, account_name: e.target.value})}
                    variant="bordered"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "border-gray-600 bg-gray-700",
                      label: "text-gray-300",
                    }}
                  />
                  <Input
                    label="TC Kimlik No"
                    placeholder="TC kimlik numarasını girin"
                    value={newAccount.ssn}
                    onChange={(e) => setNewAccount({...newAccount, ssn: e.target.value})}
                    variant="bordered"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "border-gray-600 bg-gray-700",
                      label: "text-gray-300",
                    }}
                  />
                  <Input
                    label="Şifre"
                    type="password"
                    placeholder="Bitalih şifrenizi girin"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                    variant="bordered"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "border-gray-600 bg-gray-700",
                      label: "text-gray-300",
                    }}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        isSelected={newAccount.commission_enabled}
                        onValueChange={(checked) => setNewAccount({...newAccount, commission_enabled: checked})}
                        classNames={{
                          wrapper: "after:bg-blue-500 after:border-blue-500",
                          label: "text-gray-300"
                        }}
                      >
                        <span className="text-gray-300">Komisyon Alınacak</span>
                      </Checkbox>
                    </div>
                    
                    {newAccount.commission_enabled && (
                      <Input
                        label="Günlük Komisyon (TL)"
                        type="number"
                        placeholder="Günlük komisyon miktarını girin"
                        value={newAccount.daily_commission.toString()}
                        onChange={(e) => setNewAccount({...newAccount, daily_commission: parseFloat(e.target.value) || 0})}
                        variant="bordered"
                        classNames={{
                          input: "text-white",
                          inputWrapper: "border-gray-600 bg-gray-700",
                          label: "text-gray-300",
                        }}
                      />
                    )}
                    
                    <Textarea
                      label="Notlar (İsteğe Bağlı)"
                      placeholder="Hesap hakkında notlarınızı yazın..."
                      value={newAccount.notes}
                      onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                      variant="bordered"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "border-gray-600 bg-gray-700",
                        label: "text-gray-300",
                      }}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  İptal
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleAddAccount}
                  isLoading={isAddingAccount}
                  startContent={!isAddingAccount ? <AiOutlineCheck /> : undefined}
                >
                  {isAddingAccount ? "Test Ediliyor..." : "Hesap Ekle"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AiOutlineDelete className="text-red-400" />
                  <span className="text-white">Hesap Sil</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-300">
                  <span className="font-semibold text-white">{accountToDelete}</span> hesabını silmek istediğinizden emin misiniz?
                </p>
                <p className="text-red-400 text-sm mt-2">
                  Bu işlem geri alınamaz ve tüm kupon geçmişi silinecektir.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  İptal
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleDeleteAccount}
                  isLoading={loading}
                  startContent={!loading ? <AiOutlineDelete /> : undefined}
                >
                  {loading ? "Siliniyor..." : "Sil"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
