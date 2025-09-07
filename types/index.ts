export interface QueryResult {
  kimlikNo: string
  ad: string
  soyad: string
  tcKimlikNo: string
  ogrenciNo: string
  fakulte: string
  bolum: string
  sinif: string
  durum: string
  kayitTarihi: string
  mezuniyetTarihi: string
  status: "Başarılı" | "Hata"
}

export interface QueryLog {
  kimlikNo: string
  status: "success" | "error" | "info"
  message: string
  responseTime?: number
  timestamp: Date
}

export interface QueryStats {
  total: number
  completed: number
  failed: number
  startTime: Date | null
  endTime: Date | null
  eta: number | null
}

export interface ResidenceQueryResult {
  ykn: string
  ad: string
  soyad: string
  izinTuru: string
  gerekce: string
  izinBitisTarihi: string
  status: "Başarılı" | "Hata"
}

export interface LogEntry {
  kimlikNo: string
  status: "success" | "error"
  responseCode: number
  responseTime: number
  timestamp: Date
  error?: string
}

export interface ApiResponse {
  success: boolean
  message?: string
  data?: {
    yabanciKimlikNo: string
    ad: string
    soyad: string
    ikametOzetList: Array<{
      verilisNedeni: string
      bitisTarihi: string
    }>
    ikametIzniBilgileriList: Array<{
      bitisTarihi: string
      aileDestekleyiciTur?: number
      kisaDonemKalisNeden?: number
      ogrenciKalisNeden?: number
      insaniIkametIzniKalisNeden?: number
      turkSoylu?: number
    }>
  }
}
