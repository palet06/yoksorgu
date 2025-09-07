"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Play, Pause, Square, Download } from "lucide-react"
import { ResultsTable } from "@/components/results-table"
import { QueryLogs } from "@/components/query-logs"
import { exportToExcel } from "@/lib/excel-export"
import { processYokResponse } from "@/lib/processor"
import { formatDateTime } from "@/lib/time"
import { parseIdentityNumbers } from "@/lib/utils"
import type { QueryResult, QueryLog, QueryStats } from "@/types"

export default function YokQueryPage() {
  const [identityNumbers, setIdentityNumbers] = useState("")
  const [delay, setDelay] = useState(1000)
  const [concurrency, setConcurrency] = useState(1)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [results, setResults] = useState<QueryResult[]>([])
  const [logs, setLogs] = useState<QueryLog[]>([])
  const [stats, setStats] = useState<QueryStats>({
    total: 0,
    completed: 0,
    failed: 0,
    startTime: null,
    endTime: null,
    eta: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const pausedRef = useRef(false)
  const stoppedRef = useRef(false)
  const requestTimesRef = useRef<number[]>([])

  const addLog = useCallback((log: Omit<QueryLog, "timestamp">) => {
    const newLog: QueryLog = {
      ...log,
      timestamp: new Date(),
    }
    setLogs((prev) => [newLog, ...prev.slice(0, 99)]) // Keep only last 100 logs
  }, [])

  const calculateETA = useCallback((completed: number, total: number) => {
    if (completed === 0 || requestTimesRef.current.length === 0) return null

    const avgTime = requestTimesRef.current.reduce((a, b) => a + b, 0) / requestTimesRef.current.length
    const remaining = total - completed
    return Math.round((avgTime * remaining) / 1000) // Convert to seconds
  }, [])

  const queryIdentityNumber = async (kimlikNo: string): Promise<QueryResult> => {
    const startTime = Date.now()

    try {
      const response = await fetch("/api/yok-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kimlikNo }),
        signal: abortControllerRef.current?.signal,
      })

      const responseTime = Date.now() - startTime
      requestTimesRef.current.push(responseTime)
      if (requestTimesRef.current.length > 10) {
        requestTimesRef.current.shift() // Keep only last 10 for ETA calculation
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Raw API response for", kimlikNo, ":", JSON.stringify(data, null, 2))

      const result = processYokResponse(kimlikNo, data)
      console.log("[v0] Processed result for", kimlikNo, ":", JSON.stringify(result, null, 2))

      addLog({
        kimlikNo,
        status: result.status === "Başarılı" ? "success" : "error",
        message: result.status === "Başarılı" ? "Sorgu başarılı" : "Veri bulunamadı",
        responseTime,
      })

      return result
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      const result = processYokResponse(kimlikNo, null)

      addLog({
        kimlikNo,
        status: "error",
        message: error.name === "AbortError" ? "İptal edildi" : `Hata: ${error.message}`,
        responseTime,
      })

      return result
    }
  }

  const startQuery = async () => {
    const numbers = parseIdentityNumbers(identityNumbers)
    if (numbers.length === 0) {
      addLog({ kimlikNo: "", status: "error", message: "Geçerli kimlik numarası bulunamadı" })
      return
    }

    // Reset state
    setResults([])
    setLogs([])
    requestTimesRef.current = []
    abortControllerRef.current = new AbortController()
    pausedRef.current = false
    stoppedRef.current = false
    setIsRunning(true)
    setIsPaused(false)

    const startTime = new Date()
    setStats({
      total: numbers.length,
      completed: 0,
      failed: 0,
      startTime,
      endTime: null,
      eta: null,
    })

    addLog({ kimlikNo: "", status: "info", message: `${numbers.length} kimlik numarası için sorgu başlatıldı` })

    try {
      for (let i = 0; i < numbers.length; i++) {
        // Check for pause/stop
        while (pausedRef.current && !stoppedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        if (stoppedRef.current) break

        const kimlikNo = numbers[i]
        const result = await queryIdentityNumber(kimlikNo)

        setResults((prev) => [...prev, result])

        const completed = i + 1
        const failed = result.status === "Hata" ? 1 : 0

        setStats((prev) => ({
          ...prev,
          completed,
          failed: prev.failed + failed,
          eta: calculateETA(completed, numbers.length),
        }))

        // Apply delay between requests
        if (i < numbers.length - 1 && delay > 0 && !stoppedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        addLog({ kimlikNo: "", status: "error", message: `Genel hata: ${error.message}` })
      }
    } finally {
      const endTime = new Date()
      setStats((prev) => ({ ...prev, endTime, eta: null }))
      setIsRunning(false)
      setIsPaused(false)

      if (!stoppedRef.current) {
        addLog({ kimlikNo: "", status: "info", message: "Tüm sorgular tamamlandı" })
      }
    }
  }

  const pauseQuery = () => {
    pausedRef.current = true
    setIsPaused(true)
    addLog({ kimlikNo: "", status: "info", message: "Sorgu duraklatıldı" })
  }

  const resumeQuery = () => {
    pausedRef.current = false
    setIsPaused(false)
    addLog({ kimlikNo: "", status: "info", message: "Sorgu devam ettiriliyor" })
  }

  const stopQuery = () => {
    stoppedRef.current = true
    pausedRef.current = false
    abortControllerRef.current?.abort()
    setIsRunning(false)
    setIsPaused(false)
    addLog({ kimlikNo: "", status: "info", message: "Sorgu durduruldu" })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setIdentityNumbers(content)
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    if (results.length === 0) return

    const timestamp = formatDateTime(new Date()).replace(/[:.]/g, "").replace(/\s/g, "_")
    const filename = `yok_sorgu_${timestamp}.xlsx`

    exportToExcel(results, filename)
    addLog({ kimlikNo: "", status: "info", message: `Excel dosyası indirildi: ${filename}` })
  }

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">YÖK SORGULAMA SİSTEMİ</h1>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Sorgu Başlangıç Zamanı:</span>{" "}
            {stats.startTime ? formatDateTime(stats.startTime) : "-"}
          </div>
          <div>
            <span className="font-medium">Sorgu Bitiş Zamanı:</span>{" "}
            {stats.endTime ? formatDateTime(stats.endTime) : "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Kimlik Numaraları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Her satıra bir kimlik numarası girin veya virgülle ayırın&#10;Örnek:&#10;12345678901&#10;98765432109&#10;11223344556"
                value={identityNumbers}
                onChange={(e) => setIdentityNumbers(e.target.value)}
                rows={6}
                disabled={isRunning}
              />
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  disabled={isRunning}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={isRunning}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Dosya Yükle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Kontroller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">Gecikme (ms)</label>
                  <Input
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    min={0}
                    max={10000}
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Eşzamanlılık</label>
                  <Input
                    type="number"
                    value={concurrency}
                    onChange={(e) => setConcurrency(Math.min(3, Math.max(1, Number(e.target.value))))}
                    min={1}
                    max={3}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {!isRunning ? (
                  <Button onClick={startQuery} disabled={!identityNumbers.trim()}>
                    <Play className="w-4 h-4 mr-2" />
                    Başlat
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button onClick={pauseQuery} variant="outline">
                        <Pause className="w-4 h-4 mr-2" />
                        Duraklat
                      </Button>
                    ) : (
                      <Button onClick={resumeQuery}>
                        <Play className="w-4 h-4 mr-2" />
                        Devam Et
                      </Button>
                    )}
                    <Button onClick={stopQuery} variant="destructive">
                      <Square className="w-4 h-4 mr-2" />
                      Durdur
                    </Button>
                  </>
                )}

                <Button onClick={handleExport} disabled={results.length === 0} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Excel İndir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sonuçlar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsTable results={results} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Toplam</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Tamamlanan</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">Başarısız</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>İlerleme</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              {stats.eta !== null && (
                <div className="text-center">
                  <Badge variant="outline">
                    ETA: {Math.floor(stats.eta / 60)}:{(stats.eta % 60).toString().padStart(2, "0")}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Loglar</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryLogs logs={logs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
