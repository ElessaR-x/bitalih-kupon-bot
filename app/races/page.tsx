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
  Chip
} from "@heroui/react"
import { title, subtitle } from "@/components/primitives"
import Sidebar from "@/components/sidebar"
import { 
  AiOutlineSearch,
  AiOutlineTrophy,
  AiOutlineUser,
  AiOutlineHome
} from "react-icons/ai"

interface Horse {
  horse_no: number
  horse_name: string
  odds: number
  jockey: string
  trainer: string
  weight: number
  age: string
  sex: string
}

interface Race {
  race_id: number
  race_number: number
  race_name: string
  race_time: string
  horses: Horse[]
  total_horses: number
}

interface RaceListItem {
  id: number
  name: string
  location: string
  startDate: string
  raceDay: string | null
  slug: string
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

interface RacePairCost {
  race1: Race
  race2: Race
  total_combinations: number
  valid_combinations: number
  total_cost: number
  average_cost: number
}

interface CostAnalysisResult {
  racePairCost: RacePairCost
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

export default function RacesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [raceId, setRaceId] = useState("")
  const [availableRaces, setAvailableRaces] = useState<number[]>([])
  const [raceData, setRaceData] = useState<Race[]>([])
  const [raceList, setRaceList] = useState<RaceListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRaceList, setLoadingRaceList] = useState(false)
  const [error, setError] = useState("")
  
  // Maliyet analizi state'leri
  const [secondRaceId, setSecondRaceId] = useState("")
  const [secondAvailableRaces, setSecondAvailableRaces] = useState<number[]>([])
  const [secondRaceData, setSecondRaceData] = useState<Race[]>([])
  const [maxWin, setMaxWin] = useState(2500)
  const [costAnalysisResult, setCostAnalysisResult] = useState<CostAnalysisResult | null>(null)
  const [loadingCostAnalysis, setLoadingCostAnalysis] = useState(false)
  const [allRaceData, setAllRaceData] = useState<Race[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth")
    }
  }, [status, router])

  const fetchAllRaceData = async (raceId: string) => {
    if (!raceId) return []
    
    setLoading(true)
    setError("")
    
    try {
      // Önce mevcut ayakları al
      const racesResponse = await fetch(`/api/bulletin/races/${raceId}`)
      if (!racesResponse.ok) {
        throw new Error("Ayak listesi alınamadı")
      }
      
      const racesData = await racesResponse.json()
      if (!racesData.success) {
        throw new Error(racesData.error || "Ayak listesi alınamadı")
      }
      
      const raceNumbers = racesData.race_numbers || []
      const allRaceData: Race[] = []
      
      // Her ayak için veri al
      for (const raceNumber of raceNumbers) {
        try {
          const response = await fetch(`/api/bulletin/race/${raceId}/${raceNumber}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              allRaceData.push(data)
            }
          }
        } catch (err) {
          console.error(`Race ${raceId}-${raceNumber} verisi alınamadı:`, err)
        }
      }
      
      return allRaceData
      
    } catch (err) {
      setError("Bağlantı hatası")
      return []
    } finally {
      setLoading(false)
    }
  }


  const fetchRaceList = async () => {
    setLoadingRaceList(true)
    setError("")
    
    try {
      const response = await fetch('/api/bulletin/race-list')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const races = data.races || []
          setRaceList(races)
          
          // İlk hipodromu otomatik seç
          if (races.length > 0 && !raceId) {
            setRaceId(races[0].id.toString())
          }
        } else {
          setError(data.error || "Yarış listesi alınamadı")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "API hatası")
      }
    } catch (err) {
      setError("Bağlantı hatası")
    } finally {
      setLoadingRaceList(false)
    }
  }

  useEffect(() => {
    fetchRaceList()
  }, [])

  const calculateCostAnalysis = async () => {
    if (!raceData.length || !secondRaceData.length) {
      setError("Her iki hipodrom için de veri seçilmelidir")
      return
    }
    
    setLoadingCostAnalysis(true)
    setError("")
    
    try {
      // Tüm ayak kombinasyonlarını hesapla
      let bestCombination = null
      let minTotalCost = Infinity
      let bestAnalysis = null
      
      for (const race1 of raceData) {
        for (const race2 of secondRaceData) {
          // Aynı hipodrom seçildiyse aynı ayak kombinasyonlarını filtrele
          if (raceId === secondRaceId && race1.race_number === race2.race_number) {
            continue
          }
          
          const response = await fetch('/api/cost-analysis/calculate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              race1Data: race1,
              race2Data: race2,
              maxWin: maxWin
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data.racePairCost.total_cost < minTotalCost) {
              minTotalCost = data.data.racePairCost.total_cost
              bestCombination = { race1, race2 }
              bestAnalysis = data.data
            }
          }
        }
      }
      
      if (bestAnalysis) {
        setCostAnalysisResult(bestAnalysis)
        // Sonucu localStorage'a kaydet (kupon sayfası için)
        localStorage.setItem('costAnalysisResult', JSON.stringify(bestAnalysis))
      } else {
        setError("Maliyet analizi yapılamadı")
      }
    } catch (err) {
      setError("Bağlantı hatası")
    } finally {
      setLoadingCostAnalysis(false)
    }
  }

  useEffect(() => {
    if (raceId) {
      fetchAllRaceData(raceId).then(data => {
        setRaceData(data)
      })
    }
  }, [raceId])

  useEffect(() => {
    if (secondRaceId) {
      fetchAllRaceData(secondRaceId).then(data => {
        setSecondRaceData(data)
      })
    }
  }, [secondRaceId])

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
                <AiOutlineTrophy className="text-xl sm:text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Maliyet Analizi
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  İki ayak arasındaki tüm kombinasyonların maliyet analizini yapın
                </p>
              </div>
            </div>
          </div>

          {/* Race Selection */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 mb-6 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <AiOutlineTrophy className="text-xl text-blue-400" />
                  </div>
                  <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">İki Hipodrom Seçimi</h3>
                <p className="text-sm text-gray-400">
                  İki hipodrom seçin, tüm ayak kombinasyonları analiz edilsin
                  {raceId === secondRaceId && raceId && secondRaceId && (
                    <span className="block text-yellow-400 mt-1">
                      ⚠️ Aynı hipodrom seçildi - Aynı ayak kombinasyonları filtrelenecek
                    </span>
                  )}
                </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchRaceList}
                  isLoading={loadingRaceList}
                  startContent={<AiOutlineSearch />}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 w-full sm:w-auto"
                >
                  Yenile
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* İlk Hipodrom */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">İlk Hipodrom</h4>
                  </div>
                  <div>
                    <Select
                      label="Hipodrom Seçin"
                      placeholder={loadingRaceList ? "Yarışlar yükleniyor..." : "Hipodrom seçin"}
                      selectedKeys={raceId ? [raceId] : []}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string
                        setRaceId(value || "")
                        setRaceData([])
                      }}
                      isDisabled={loadingRaceList}
                      classNames={{
                        trigger: "border-gray-600 bg-gray-700 text-white",
                        label: "text-gray-300",
                        value: "text-white",
                        listbox: "bg-gray-800 border-gray-600",
                        popoverContent: "bg-gray-800 border-gray-600"
                      }}
                      renderValue={(items) => {
                        return items.map((item) => {
                          const race = raceList.find(r => r.id.toString() === item.key)
                          return (
                            <span key={item.key} className="text-white font-medium">
                              {race?.name}
                            </span>
                          )
                        })
                      }}
                    >
                      {raceList.map((race) => (
                        <SelectItem key={race.id.toString()} textValue={race.name}>
                          <span className="text-white">{race.name}</span>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  {raceId && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                      <div className="text-sm text-blue-300">
                        {loading ? "Veriler yükleniyor..." : `${raceData.length} ayak verisi yüklendi`}
                      </div>
                    </div>
                  )}
                </div>

                {/* İkinci Hipodrom */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">İkinci Hipodrom</h4>
                  </div>
                  <div>
                    <Select
                      label="Hipodrom Seçin"
                      placeholder={loadingRaceList ? "Yarışlar yükleniyor..." : "Hipodrom seçin"}
                      selectedKeys={secondRaceId ? [secondRaceId] : []}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string
                        setSecondRaceId(value || "")
                        setSecondRaceData([])
                      }}
                      isDisabled={loadingRaceList}
                      classNames={{
                        trigger: "border-gray-600 bg-gray-700 text-white",
                        label: "text-gray-300",
                        value: "text-white",
                        listbox: "bg-gray-800 border-gray-600",
                        popoverContent: "bg-gray-800 border-gray-600"
                      }}
                      renderValue={(items) => {
                        return items.map((item) => {
                          const race = raceList.find(r => r.id.toString() === item.key)
                          return (
                            <span key={item.key} className="text-white font-medium">
                              {race?.name}
                            </span>
                          )
                        })
                      }}
                    >
                      {raceList.map((race) => (
                        <SelectItem key={race.id.toString()} textValue={race.name}>
                          <span className="text-white">{race.name}</span>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  {secondRaceId && (
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                      <div className="text-sm text-green-300">
                        {loading ? "Veriler yükleniyor..." : `${secondRaceData.length} ayak verisi yüklendi`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Maksimum Kazanç ve Analiz Butonu */}
              <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-600">
                <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-xl p-4 lg:p-6">
                  <div className="flex flex-col gap-4 lg:gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-yellow-500/20 rounded">
                          <AiOutlineTrophy className="text-yellow-400 text-sm" />
                        </div>
                        <label className="text-sm font-medium text-gray-300">Maksimum Kazanç (TL)</label>
                      </div>
                      <Input
                        type="number"
                        value={maxWin.toString()}
                        onChange={(e) => setMaxWin(parseFloat(e.target.value) || 2500)}
                        variant="bordered"
                        placeholder="2500"
                        classNames={{
                          input: "text-white text-lg font-semibold",
                          inputWrapper: "border-gray-600 bg-gray-700 hover:border-gray-500 focus-within:border-yellow-500",
                          label: "text-gray-300",
                        }}
                      />
                    </div>
                    <Button
                      color="success"
                      size="lg"
                      onClick={calculateCostAnalysis}
                      isLoading={loadingCostAnalysis}
                      isDisabled={raceData.length === 0 || secondRaceData.length === 0}
                      startContent={<AiOutlineTrophy />}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 lg:px-8 py-3 shadow-lg w-full lg:w-auto"
                    >
                      {loadingCostAnalysis ? "Analiz Yapılıyor..." : "Maliyet Analizi Yap"}
                    </Button>
                  </div>
                  
                  {/* Status Indicators */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${raceData.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${raceData.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">1. Hipodrom ({raceData.length} ayak)</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${secondRaceData.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${secondRaceData.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">2. Hipodrom ({secondRaceData.length} ayak)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Cost Analysis Results */}
          {costAnalysisResult && (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                      <AiOutlineTrophy className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Maliyet Analizi Özeti</h2>
                      <p className="text-gray-400 text-sm">İki ayak arasındaki tüm kombinasyonların analizi</p>
                      {raceId === secondRaceId && (
                        <p className="text-yellow-400 text-sm mt-1">
                          ⚠️ Aynı hipodrom seçildi - Aynı ayak kombinasyonları filtrelendi
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div className="text-sm text-blue-300 font-medium">Toplam Kombinasyon</div>
                      </div>
                      <div className="text-3xl font-bold text-white">{costAnalysisResult.summary.total_combinations}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div className="text-sm text-green-300 font-medium">Geçerli Kombinasyon</div>
                      </div>
                      <div className="text-3xl font-bold text-white">{costAnalysisResult.summary.valid_combinations}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <div className="text-sm text-yellow-300 font-medium">Toplam Maliyet</div>
                      </div>
                      <div className="text-3xl font-bold text-white">{costAnalysisResult.summary.total_cost.toFixed(2)} TL</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <div className="text-sm text-purple-300 font-medium">Ortalama Maliyet</div>
                      </div>
                      <div className="text-3xl font-bold text-white">{costAnalysisResult.summary.average_cost.toFixed(2)} TL</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <div className="text-sm text-emerald-300 font-medium">En Düşük Bahis</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{costAnalysisResult.summary.min_bet.toFixed(2)} TL</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <div className="text-sm text-red-300 font-medium">En Yüksek Bahis</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{costAnalysisResult.summary.max_bet.toFixed(2)} TL</div>
                    </div>
                  </div>
                  
                  {/* Kupon Oyna Butonu */}
                  <div className="mt-6 pt-6 border-t border-gray-600">
                    <div className="text-center">
                      <Button
                        color="success"
                        size="lg"
                        onClick={() => router.push('/coupons')}
                        startContent={<AiOutlineTrophy />}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-8 py-3 shadow-lg"
                      >
                        Kupon Oyna
                      </Button>
                      <p className="text-gray-400 text-sm mt-2">
                        Bu kombinasyonlarla kupon oynamak için tıklayın
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Race Pair Info */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <AiOutlineHome className="text-xl text-blue-400" />
                    </div>
                    <div>
                    <h3 className="text-xl font-bold text-white">Seçilen Hipodromlar</h3>
                    <p className="text-gray-400 text-sm">En ucuz kombinasyonu bulunan ayakların detayları</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-4 lg:p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">1</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">İlk Hipodrom</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Hipodrom:</span>
                          <span className="text-white font-medium">{raceList.find(race => race.id.toString() === raceId)?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Ayak:</span>
                          <span className="text-white font-medium">{costAnalysisResult.racePairCost.race1.race_number}. Ayak</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Yarış:</span>
                          <span className="text-white font-medium">{costAnalysisResult.racePairCost.race1.race_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">At Sayısı:</span>
                          <span className="text-blue-400 font-bold">{costAnalysisResult.racePairCost.race1.total_horses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Toplam Ayak:</span>
                          <span className="text-blue-400 font-bold">{raceData.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 p-4 lg:p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">İkinci Hipodrom</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Hipodrom:</span>
                          <span className="text-white font-medium">{raceList.find(race => race.id.toString() === secondRaceId)?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Ayak:</span>
                          <span className="text-white font-medium">{costAnalysisResult.racePairCost.race2.race_number}. Ayak</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Yarış:</span>
                          <span className="text-white font-medium">{costAnalysisResult.racePairCost.race2.race_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">At Sayısı:</span>
                          <span className="text-green-400 font-bold">{costAnalysisResult.racePairCost.race2.total_horses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Toplam Ayak:</span>
                          <span className="text-green-400 font-bold">{secondRaceData.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Top Combinations */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <AiOutlineTrophy className="text-xl text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">En Düşük Maliyetli Kombinasyonlar</h3>
                      <p className="text-gray-400 text-sm">İlk 10 kombinasyon (maliyet sırasına göre)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="overflow-x-auto">
                    <Table aria-label="Kombinasyon listesi" className="min-w-full text-sm lg:text-base">
                      <TableHeader>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">#</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">1. AYAK</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">2. AYAK</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">KOMBİNASYON ORANI</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">BAHİS</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">POTANSİYEL KAZANÇ</TableColumn>
                        <TableColumn className="bg-gray-700/50 text-gray-300 font-semibold">KAR</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {costAnalysisResult.costAnalysis.slice(0, 10).map((item, index) => (
                          <TableRow key={item.index} className="hover:bg-gray-700/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <Chip 
                                  color={index < 3 ? "success" : index < 7 ? "warning" : "default"} 
                                  variant="flat"
                                  className="font-bold"
                                >
                                  {item.index}
                                </Chip>
                              </div>
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
                              <span className="text-white font-bold text-lg">{item.bet_amount.toFixed(2)} TL</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-green-400 font-bold text-lg">{item.potential_win.toFixed(2)} TL</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-blue-400 font-bold text-lg">{item.profit.toFixed(2)} TL</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300">Düşük Oran (≤10)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-300">Orta Oran (10-50)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-300">Yüksek Oran (&gt;50)</span>
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
                    <AiOutlineTrophy className="text-xl text-red-400" />
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
    </div>
  )
}
