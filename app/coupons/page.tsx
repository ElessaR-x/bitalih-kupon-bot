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
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react"
import Sidebar from "@/components/sidebar"
import { 
  AiOutlineTrophy,
  AiOutlineUser,
  AiOutlineRight,
  AiOutlineDollar,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineWarning,
  AiOutlineInfo
} from "react-icons/ai"

interface BitalihAccount {
  account_name: string
  created_at: string
  last_used: string | null
  total_coupons_played: number
  successful_coupons: number
  total_bet_amount: number
  total_win_amount: number
}

interface Combination {
  race1: {
    race_id: number
    number: number
    race_name: string
    horse_no: number
    horse_name: string
    odds: number
  }
  race2: {
    race_id: number
    number: number
    race_name: string
    horse_no: number
    horse_name: string
    odds: number
  }
  combination_odds: number
}

interface BetInfo {
  bet_amount: number
  odds: number
  potential_win: number
  profit: number
}

interface CostAnalysisItem {
  index: number
  combination: Combination
  bet_info: BetInfo
  bet_amount: number
  potential_win: number
  profit: number
}

interface CostAnalysisResult {
  racePairCost: {
    race1: {
      race_id: number
      race_number: number
      race_name: string
      total_horses: number
    }
    race2: {
      race_id: number
      race_number: number
      race_name: string
      total_horses: number
    }
    total_combinations: number
    valid_combinations: number
    total_cost: number
    average_cost: number
  }
  costAnalysis: CostAnalysisItem[]
  summary: {
    total_combinations: number
    valid_combinations: number
    total_cost: number
    average_cost: number
    min_bet: number
    max_bet: number
  }
}

export default function CouponsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State'ler
  const [accounts, setAccounts] = useState<BitalihAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [costAnalysisResult, setCostAnalysisResult] = useState<CostAnalysisResult | null>(null)
  const [selectedCombinations, setSelectedCombinations] = useState<CostAnalysisItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Modal states
  const { isOpen: isPlayModalOpen, onOpen: onPlayModalOpen, onClose: onPlayModalClose } = useDisclosure()
  const [isPlayingCoupons, setIsPlayingCoupons] = useState(false)
  const [playResults, setPlayResults] = useState<any[]>([])
  
  // Multi-account task states
  const [taskResults, setTaskResults] = useState<{[accountName: string]: any[]}>({})
  const [taskProgress, setTaskProgress] = useState<{[accountName: string]: {current: number, total: number}}>({})
  const [taskStatus, setTaskStatus] = useState<{[accountName: string]: 'idle' | 'running' | 'completed' | 'error'}>({})

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts()
      // URL'den maliyet analizi sonucunu al
      loadCostAnalysisFromURL()
    }
  }, [status])

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

  const loadCostAnalysisFromURL = () => {
    // URL'den maliyet analizi sonucunu al (localStorage'dan veya query params'dan)
    const savedResult = localStorage.getItem('costAnalysisResult')
    if (savedResult) {
      try {
        const result = JSON.parse(savedResult)
        setCostAnalysisResult(result)
        // Tüm kombinasyonları otomatik seç
        setSelectedCombinations(result.costAnalysis)
      } catch (err) {
        console.error('Maliyet analizi sonucu yüklenemedi:', err)
      }
    }
  }



  const playCouponsForAccount = async (accountName: string) => {
    if (!costAnalysisResult || costAnalysisResult.costAnalysis.length === 0) {
      return []
    }

    const results = []
    const maxCoupons = costAnalysisResult.costAnalysis.length
    
    // Task progress'i güncelle
    setTaskProgress(prev => ({
      ...prev,
      [accountName]: { current: 0, total: maxCoupons }
    }))
    
    setTaskStatus(prev => ({
      ...prev,
      [accountName]: 'running'
    }))

    try {
      for (let i = 0; i < maxCoupons; i++) {
        const combination = costAnalysisResult.costAnalysis[i]
        
        console.log(`[${accountName}] Oynanıyor: ${i + 1}/${maxCoupons} - R${combination.combination.race1.race_id}-${combination.combination.race1.number}.Ayak-${combination.combination.race1.horse_no} x R${combination.combination.race2.race_id}-${combination.combination.race2.number}.Ayak-${combination.combination.race2.horse_no}`)
        
        try {
          const response = await fetch('/api/coupons/play', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              account_name: accountName,
              combination: combination,
              bet_amount: combination.bet_amount,
              odds: combination.combination.combination_odds
            })
          })

          const data = await response.json()
          console.log(`[${accountName}] Sonuç ${i + 1}:`, data)
          
          results.push({
            index: i + 1,
            combination: combination,
            success: data.success,
            message: data.message || (data.success ? "Kupon başarıyla oynandı" : "Kupon oynanamadı"),
            result: data.result
          })

          // Progress güncelle
          setTaskProgress(prev => ({
            ...prev,
            [accountName]: { current: i + 1, total: maxCoupons }
          }))

          // Rate limiting için bekleme
          await new Promise(resolve => setTimeout(resolve, 3000))
          
        } catch (err) {
          console.error(`[${accountName}] Hata ${i + 1}:`, err)
          results.push({
            index: i + 1,
            combination: combination,
            success: false,
            message: `Bağlantı hatası: ${err}`,
            result: null
          })
        }
      }

      // Task tamamlandı
      setTaskStatus(prev => ({
        ...prev,
        [accountName]: 'completed'
      }))

      return results
      
    } catch (err) {
      console.error(`[${accountName}] Genel hata:`, err)
      setTaskStatus(prev => ({
        ...prev,
        [accountName]: 'error'
      }))
      return results
    }
  }

  const startMultiAccountTask = async () => {
    if (selectedAccounts.length === 0) {
      setError("Lütfen en az bir hesap seçin")
      return
    }

    if (!costAnalysisResult || costAnalysisResult.costAnalysis.length === 0) {
      setError("Oynanacak kombinasyon bulunamadı")
      return
    }

    setIsPlayingCoupons(true)
    setError("")
    setTaskResults({})
    setTaskProgress({})
    setTaskStatus({})
    onPlayModalOpen()

    try {
      // Tüm hesaplar için paralel olarak kupon oynama başlat
      const promises = selectedAccounts.map(accountName => 
        playCouponsForAccount(accountName)
      )

      // Tüm hesapların sonuçlarını bekle
      const allResults = await Promise.all(promises)
      
      // Sonuçları state'e kaydet
      const resultsMap: {[accountName: string]: any[]} = {}
      selectedAccounts.forEach((accountName, index) => {
        resultsMap[accountName] = allResults[index]
      })
      
      setTaskResults(resultsMap)
      
      // Genel başarı istatistikleri
      const totalCoupons = selectedAccounts.length * costAnalysisResult.costAnalysis.length
      const totalSuccessful = allResults.flat().filter(r => r.success).length
      setSuccess(`${totalSuccessful}/${totalCoupons} kupon başarıyla oynandı (${selectedAccounts.length} hesap)`)
      
    } catch (err) {
      setError("Çoklu hesap kupon oynama hatası")
    } finally {
      setIsPlayingCoupons(false)
    }
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
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <AiOutlineTrophy className="text-xl sm:text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Kupon Oynama
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  Maliyet analizi sonuçlarından kupon oynayın
                </p>
              </div>
            </div>
          </div>

          {!costAnalysisResult ? (
            /* Maliyet Analizi Sonucu Yok */
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardBody className="p-6 lg:p-8 text-center">
                <AiOutlineInfo className="text-6xl text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Maliyet Analizi Sonucu Bulunamadı</h3>
                <p className="text-gray-400 mb-6">
                  Kupon oynayabilmek için önce maliyet analizi yapmanız gerekiyor.
                </p>
                <Button
                  color="primary"
                  size="lg"
                  onClick={() => router.push('/races')}
                  startContent={<AiOutlineTrophy />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  Maliyet Analizi Yap
                </Button>
              </CardBody>
            </Card>
          ) : (
            /* Maliyet Analizi Sonucu Var */
            <div className="space-y-6">
              {/* Race Info */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <AiOutlineTrophy className="text-xl text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Seçilen Ayaklar</h3>
                      <p className="text-gray-400 text-sm">Maliyet analizi yapılan ayaklar</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400 font-bold">1. AYAK</span>
                      </div>
                      <div className="text-white">
                        <div className="font-semibold">R{costAnalysisResult.racePairCost.race1.race_id}-{costAnalysisResult.racePairCost.race1.race_number}. Ayak</div>
                        <div className="text-sm text-gray-400">{costAnalysisResult.racePairCost.race1.race_name}</div>
                        <div className="text-sm text-blue-400">{costAnalysisResult.racePairCost.race1.total_horses} at</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-400 font-bold">2. AYAK</span>
                      </div>
                      <div className="text-white">
                        <div className="font-semibold">R{costAnalysisResult.racePairCost.race2.race_id}-{costAnalysisResult.racePairCost.race2.race_number}. Ayak</div>
                        <div className="text-sm text-gray-400">{costAnalysisResult.racePairCost.race2.race_name}</div>
                        <div className="text-sm text-green-400">{costAnalysisResult.racePairCost.race2.total_horses} at</div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Multi-Account Selection */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <AiOutlineUser className="text-xl text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Hesap Seçimi</h3>
                      <p className="text-gray-400 text-sm">Kuponları hangi hesaplarla oynayacaksınız? (Birden fazla seçebilirsiniz)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {accounts.map((account) => (
                      <div key={account.account_name} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.includes(account.account_name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAccounts([...selectedAccounts, account.account_name])
                              } else {
                                setSelectedAccounts(selectedAccounts.filter(name => name !== account.account_name))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate" title={account.account_name}>
                              {account.account_name}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              {account.total_coupons_played} kupon
                            </div>
                            <div className="text-sm text-gray-400">
                              {account.successful_coupons} başarılı
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">Başarı Oranı</div>
                          <div className="text-green-400 font-semibold text-sm">
                            {account.total_coupons_played > 0 
                              ? ((account.successful_coupons / account.total_coupons_played) * 100).toFixed(1)
                              : 0}%
                          </div>
                        </div>
                        
                        {selectedAccounts.includes(account.account_name) && (
                          <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-center">
                            <div className="text-blue-300 text-xs">✅ Seçildi</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {selectedAccounts.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-blue-300 text-sm font-medium mb-2">
                        ✅ {selectedAccounts.length} hesap seçildi
                      </div>
                      <div className="text-gray-400 text-sm">
                        {selectedAccounts.join(', ')}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* All Combinations Info */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <AiOutlineDollar className="text-xl text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Tüm Kombinasyonlar</h3>
                      <p className="text-gray-400 text-sm">Tüm kombinasyonlar otomatik olarak oynanacak</p>
                      <p className="text-blue-400 text-sm mt-1">
                        ⏱️ Rate limiting nedeniyle kuponlar arasında 3 saniye bekleme yapılacak
                      </p>
                      <p className="text-green-400 text-sm mt-1">
                        🎯 Tüm kombinasyonlar oynanacak
                      </p>
                      {costAnalysisResult.racePairCost.race1.race_id === costAnalysisResult.racePairCost.race2.race_id && (
                        <p className="text-yellow-400 text-sm mt-1">
                          ⚠️ Aynı hipodrom - Aynı ayak kombinasyonları filtrelendi
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="overflow-x-auto">
                    <Table aria-label="Kombinasyon listesi" className="min-w-full">
                      <TableHeader>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">#</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">1. AYAK</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">2. AYAK</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">ORAN</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">BAHİS</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">KAZANÇ</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">KAR</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {costAnalysisResult.costAnalysis.slice(0, 50).map((item, index) => (
                          <TableRow key={item.index} className="hover:bg-gray-700/30 transition-colors">
                            <TableCell>
                              <Chip 
                                color={index < 3 ? "success" : index < 10 ? "warning" : "default"} 
                                variant="flat"
                                className="font-bold"
                              >
                                {item.index}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <div className="text-white">
                                <div className="font-semibold text-blue-400">{item.combination.race1.horse_no}. {item.combination.race1.horse_name}</div>
                                <div className="text-sm text-gray-400">Oran: {item.combination.race1.odds.toFixed(2)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-white">
                                <div className="font-semibold text-green-400">{item.combination.race2.horse_no}. {item.combination.race2.horse_name}</div>
                                <div className="text-sm text-gray-400">Oran: {item.combination.race2.odds.toFixed(2)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                color={item.combination.combination_odds <= 10 ? "success" : item.combination.combination_odds <= 50 ? "warning" : "danger"}
                                variant="flat"
                                className="font-bold"
                              >
                                {item.combination.combination_odds.toFixed(2)}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <span className="text-white font-bold">{item.bet_amount.toFixed(2)} TL</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-400 font-bold">{item.potential_win.toFixed(2)} TL</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-blue-400 font-bold">{item.profit.toFixed(2)} TL</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {costAnalysisResult.costAnalysis.length > 50 && (
                    <div className="mt-4 text-center">
                      <p className="text-gray-400 text-sm">
                        ... ve {costAnalysisResult.costAnalysis.length - 50} kombinasyon daha
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Summary and Task Start Button */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardBody className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white mb-4">Görev Özeti</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-xl">
                          <div className="text-sm text-blue-300 font-medium">Seçili Hesap</div>
                          <div className="text-2xl font-bold text-white">{selectedAccounts.length}</div>
                        </div>
                        <div className="bg-purple-500/20 border border-purple-500/30 p-4 rounded-xl">
                          <div className="text-sm text-purple-300 font-medium">Toplam Kombinasyon</div>
                          <div className="text-2xl font-bold text-white">{costAnalysisResult.costAnalysis.length}</div>
                        </div>
                        <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-xl">
                          <div className="text-sm text-yellow-300 font-medium">Toplam Kupon</div>
                          <div className="text-2xl font-bold text-white">{selectedAccounts.length * costAnalysisResult.costAnalysis.length}</div>
                        </div>
                        <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-xl">
                          <div className="text-sm text-green-300 font-medium">Toplam Bahis</div>
                          <div className="text-2xl font-bold text-white">{(selectedAccounts.length * costAnalysisResult.summary.total_cost).toFixed(2)} TL</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button
                        color="success"
                        size="lg"
                        onClick={startMultiAccountTask}
                        isDisabled={selectedAccounts.length === 0}
                        startContent={<AiOutlineRight />}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 lg:px-8 py-3 shadow-lg w-full lg:w-auto"
                      >
                        Görev Başlat
                      </Button>
                      <div className="text-center">
                        <span className="text-sm text-gray-400">
                          {selectedAccounts.length > 0 
                            ? `${selectedAccounts.length} hesap seçildi` 
                            : "Hesap seçin"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

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

          {/* Success Message */}
          {success && (
            <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-500/50 shadow-xl">
              <CardBody className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <AiOutlineCheck className="text-xl text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-300">Başarılı</h4>
                    <p className="text-green-200 mt-1">{success}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Multi-Account Task Results Modal */}
      <Modal isOpen={isPlayModalOpen} onOpenChange={onPlayModalClose} size="5xl">
        <ModalContent className="bg-gray-800 text-white border border-gray-700">
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <AiOutlineRight className="text-green-400" />
              <span className="text-white">Çoklu Hesap Görev Sonuçları</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {isPlayingCoupons ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Spinner size="lg" color="primary" />
                  <p className="text-gray-400 mt-4">Görev çalışıyor...</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {selectedAccounts.length} hesap için kuponlar oynanıyor
                  </p>
                </div>
                
                {/* Progress for each account */}
                <div className="space-y-4">
                  {selectedAccounts.map(accountName => (
                    <Card key={accountName} className="bg-gray-700/50 border-gray-600">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              taskStatus[accountName] === 'running' ? 'bg-blue-400 animate-pulse' :
                              taskStatus[accountName] === 'completed' ? 'bg-green-400' :
                              taskStatus[accountName] === 'error' ? 'bg-red-400' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-white font-medium">{accountName}</span>
                            <Chip 
                              color={
                                taskStatus[accountName] === 'running' ? 'primary' :
                                taskStatus[accountName] === 'completed' ? 'success' :
                                taskStatus[accountName] === 'error' ? 'danger' : 'default'
                              } 
                              variant="flat" 
                              size="sm"
                            >
                              {taskStatus[accountName] === 'running' ? 'Çalışıyor' :
                               taskStatus[accountName] === 'completed' ? 'Tamamlandı' :
                               taskStatus[accountName] === 'error' ? 'Hata' : 'Bekliyor'}
                            </Chip>
                          </div>
                          <div className="text-sm text-gray-400">
                            {taskProgress[accountName] ? 
                              `${taskProgress[accountName].current}/${taskProgress[accountName].total}` : 
                              '0/0'
                            }
                          </div>
                        </div>
                        
                        {taskProgress[accountName] && (
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(taskProgress[accountName].current / taskProgress[accountName].total) * 100}%` 
                              }}
                            ></div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            ) : Object.keys(taskResults).length > 0 ? (
              <div className="space-y-6">
                {/* Summary */}
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardBody className="p-4">
                    <h4 className="text-lg font-bold text-white mb-3">Görev Özeti</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{selectedAccounts.length}</div>
                        <div className="text-sm text-gray-400">Hesap</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {Object.values(taskResults).flat().filter(r => r.success).length}
                        </div>
                        <div className="text-sm text-gray-400">Başarılı Kupon</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {Object.values(taskResults).flat().length}
                        </div>
                        <div className="text-sm text-gray-400">Toplam Kupon</div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Results for each account */}
                {selectedAccounts.map(accountName => (
                  <Card key={accountName} className="bg-gray-700/50 border-gray-600">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white">{accountName}</h4>
                        <div className="flex items-center gap-2">
                          <Chip 
                            color={taskStatus[accountName] === 'completed' ? 'success' : 'danger'} 
                            variant="flat" 
                            size="sm"
                          >
                            {taskStatus[accountName] === 'completed' ? 'Tamamlandı' : 'Hata'}
                          </Chip>
                          <span className="text-sm text-gray-400">
                            {taskResults[accountName]?.filter(r => r.success).length || 0}/
                            {taskResults[accountName]?.length || 0} başarılı
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {taskResults[accountName]?.slice(0, 5).map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-600/50 rounded">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <AiOutlineCheck className="text-green-400" />
                              ) : (
                                <AiOutlineClose className="text-red-400" />
                              )}
                              <span className="text-white text-sm">
                                {result.index}. Kupon
                              </span>
                            </div>
                            <span className="text-sm text-gray-400">
                              {result.combination.bet_amount.toFixed(2)} TL
                            </span>
                          </div>
                        ))}
                        {taskResults[accountName]?.length > 5 && (
                          <div className="text-center text-gray-400 text-sm">
                            ... ve {taskResults[accountName].length - 5} kupon daha
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AiOutlineWarning className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Henüz görev başlatılmadı</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={onPlayModalClose} className="text-gray-300 hover:bg-gray-700">
              Kapat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
