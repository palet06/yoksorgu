"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Play, Pause, Square, Upload } from "lucide-react"
import { ResultsTable } from "@/components/results-table"
import { QueryLogs } from "@/components/query-logs"
import { exportToExcel } from "@/lib/excel-export"
import { processApiResponse } from "@/lib/data-processor"
import { formatDateTime } from "@/lib/utils"
import type { QueryResult, LogEntry } from "@/types"

export default function HomePage() {
  const [identityNumbers, setIdentityNumbers] = useState<string[]>([])
  const [inputText, setInputText] = useState("")
  const [delay, setDelay] = useState(300)
  const [concurrency, setConcurrency] = useState(1)
  const [isQuerying, setIsQuerying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [results, setResults] = useState<QueryResult[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    progress: 0,
  })

  const isQueryingRef = useRef(false)
  const isPausedRef = useRef(false)

  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  const parseIdentityNumbers = useCallback((text: string) => {
    const numbers = text
      .split(/[\n,;|\s]+/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0)
      .filter((num) => /^\d{6,}$/.test(num)) // 6 veya daha fazla rakam kabul

    setIdentityNumbers(numbers)
    setStats((prev) => ({ ...prev, total: numbers.length }))

    console.log("[v0] Parsed identity numbers:", numbers)
  }, [])

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev.slice(0, 99)]) // Keep last 100 logs
  }, [])

  const queryIdentityNumber = async (kimlikNo: string): Promise<QueryResult> => {
    const startTime = Date.now()

    try {
      console.log("[v0] About to make fetch request for:", kimlikNo)
      console.log("[v0] Fetch URL:", "/api/query")
      console.log("[v0] Fetch body:", JSON.stringify({ kimlikNo }))

      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kimlikNo }),
      })

      console.log("[v0] Fetch response received:", response.status, response.statusText)

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        console.log("[v0] Response not OK:", response.status, response.statusText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Raw API response data:", JSON.stringify(data, null, 2))
      console.log("[v0] Response structure check:")
      console.log("  - data.success:", data.success)
      console.log("  - data.data exists:", !!data.data)
      if (data.data) {
        console.log("  - data.data.yabanciKimlikNo:", data.data.yabanciKimlikNo)
        console.log("  - data.data.ad:", data.data.ad)
        console.log("  - data.data.soyad:", data.data.soyad)
        console.log("  - data.data.ikametOzetList exists:", !!data.data.ikametOzetList)
        console.log("  - data.data.ikametOzetList length:", data.data.ikametOzetList?.length)
        console.log("  - data.data.ikametIzniBilgileriList exists:", !!data.data.ikametIzniBilgileriList)
        console.log("  - data.data.ikametIzniBilgileriList length:", data.data.ikametIzniBilgileriList?.length)
      }

      addLog({
        kimlikNo,
        status: "success",
        responseCode: response.status,
        responseTime,
        timestamp: new Date(),
      })

      const processedResult = processApiResponse(kimlikNo, data)
      console.log("[v0] Processed result:", processedResult)

      return processedResult
    } catch (error) {
      console.error("[v0] Error in queryIdentityNumber:", error)
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata"

      addLog({
        kimlikNo,
        status: "error",
        responseCode: 0,
        responseTime,
        error: errorMessage,
        timestamp: new Date(),
      })

      return {
        ykn: kimlikNo,
        ad: "Veri Yok",
        soyad: "Veri Yok",
        izinTuru: "Veri Yok",
        gerekce: `API Hatası: ${errorMessage}`,
        izinBitisTarihi: "Veri Yok",
        status: "Hata",
      }
    }
  }

  const startQuery = async () => {
    console.log("[v0] startQuery called, identityNumbers:", identityNumbers)
    if (identityNumbers.length === 0) {
      alert("Lütfen geçerli kimlik numaraları girin!")
      return
    }

    setIsQuerying(true)
    isQueryingRef.current = true
    setIsPaused(false)
    isPausedRef.current = false
    setResults([])
    setStats((prev) => ({ ...prev, completed: 0, failed: 0, progress: 0 }))
    setStartTime(new Date())
    setEndTime(null)

    try {
      for (let i = 0; i < identityNumbers.length; i++) {
        if (isPausedRef.current) {
          // bekleme döngüsü ref üzerinden kontrol ediliyor
          while (isPausedRef.current && isQueryingRef.current) {
            await new Promise((r) => setTimeout(r, 100))
          }
        }

        if (!isQueryingRef.current) break

        const kimlikNo = identityNumbers[i]
        console.log("[v0] Processing identity number:", kimlikNo, `(${i + 1}/${identityNumbers.length})`)

        const result = await queryIdentityNumber(kimlikNo)
        console.log("[v0] Query result:", result)

        setResults((prev) => [...prev, result])

        setStats((prev) => {
          const completed = prev.completed + 1
          const failed = result.status === "Hata" ? prev.failed + 1 : prev.failed
          const progress = (completed / prev.total) * 100
          return { ...prev, completed, failed, progress }
        })

        if (i < identityNumbers.length - 1 && delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    } finally {
      setIsQuerying(false)
      isQueryingRef.current = false
      setEndTime(new Date())
    }
  }

  const pauseQuery = () => {
    setIsPaused((prev) => {
      const next = !prev
      isPausedRef.current = next
      return next
    })
  }

  const stopQuery = () => {
    setIsQuerying(false)
    isQueryingRef.current = false
    setIsPaused(false)
    isPausedRef.current = false
    setEndTime(new Date())
  }

  const handleExport = () => {
    if (results.length === 0) return
    exportToExcel(results)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setInputText(text)
      parseIdentityNumbers(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">İkamet İzni Sorgulama Sistemi</h1>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Sorgu Başlangıç Zamanı:</span> {startTime ? formatDateTime(startTime) : "-"}
          </div>
          <div>
            <span className="font-medium">Sorgu Bitiş Zamanı:</span> {endTime ? formatDateTime(endTime) : "-"}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Kimlik Numaraları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder={`Kimlik numaralarını girin (her satıra bir numara veya virgülle ayırın)
Örnek:
12345678901
98765432109
11223344556`}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                parseIdentityNumbers(e.target.value)
              }}
              rows={6}
              disabled={isQuerying}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={isQuerying}
              >
                <Upload className="w-4 h-4 mr-2" />
                CSV/TXT Yükle
              </Button>
              <input id="file-upload" type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </div>
            <div className="text-sm text-muted-foreground">
              Geçerli kimlik numaraları: {identityNumbers.length} adet
              {inputText && identityNumbers.length === 0 && (
                <span className="text-destructive ml-2">⚠️ Geçerli kimlik numarası bulunamadı (11 haneli olmalı)</span>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Gecikme (ms)</label>
              <Input
                type="number"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                min={0}
                max={5000}
                disabled={isQuerying}
                className="w-24"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Eşzamanlılık</label>
              <Input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Math.min(3, Math.max(1, Number(e.target.value))))}
                min={1}
                max={3}
                disabled={isQuerying}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>İlerleme Durumu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Toplam: {stats.total}</span>
              <span>Tamamlanan: {stats.completed}</span>
              <span>Başarısız: {stats.failed}</span>
            </div>
            <Progress value={stats.progress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">%{stats.progress.toFixed(1)} tamamlandı</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontroller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {!isQuerying ? (
                <Button
                  onClick={() => {
                    console.log("[v0] Start button clicked")
                    console.log("[v0] Current identityNumbers:", identityNumbers)
                    console.log("[v0] identityNumbers.length:", identityNumbers.length)
                    startQuery().catch((error) => {
                      console.error("[v0] Unhandled error in startQuery:", error)
                      alert(`Beklenmeyen hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`)
                      setIsQuerying(false)
                    })
                  }}
                  disabled={identityNumbers.length === 0}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Sorgulamayı Başlat
                </Button>
              ) : (
                <>
                  <Button onClick={pauseQuery} variant="outline" className="flex-1 bg-transparent">
                    <Pause className="w-4 h-4 mr-2" />
                    {isPaused ? "Devam Et" : "Duraklat"}
                  </Button>
                  <Button onClick={stopQuery} variant="destructive" className="flex-1">
                    <Square className="w-4 h-4 mr-2" />
                    Durdur
                  </Button>
                </>
              )}
            </div>
            <Button
              onClick={handleExport}
              disabled={results.length === 0}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel Olarak İndir
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResultsTable results={results} />
        </div>
        <div>
          <QueryLogs logs={logs} />
        </div>
      </div>
    </div>
  )
}
