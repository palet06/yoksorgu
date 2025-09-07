import {
  kisaDonemNedenleri,
  uzunDonemTurkSoylu,
  insaniIkametNedenleri,
  aileDestekleyiciTur,
  ogrenciKalisNeden,
} from "./mappings"
import type { ApiResponse, QueryResult } from "@/types"

export function processApiResponse(kimlikNo: string, response: ApiResponse): QueryResult {
  console.log("[v0] processApiResponse called with:", { kimlikNo, response })

  if (!response.success || !response.data) {
    console.log("[v0] Response not successful or no data:", { success: response.success, hasData: !!response.data })
    return {
      ykn: kimlikNo,
      ad: "Veri Yok",
      soyad: "Veri Yok",
      izinTuru: "Veri Yok",
      gerekce: `API Hatası: ${response.message || "Bilinmeyen hata"}`,
      izinBitisTarihi: "Veri Yok",
      status: "Hata",
    }
  }

  const data = response.data
  console.log("[v0] Processing data:", data)

  // Basic info - fields are nested under data.kisi
  const kisi = data.kisi || {}
  const ykn = kisi.yabanciKimlikNo || kimlikNo
  const ad = kisi.ad || "Veri Yok"
  const soyad = kisi.soyad || "Veri Yok"

  console.log("[v0] Extracted basic info:", { ykn, ad, soyad })
  console.log("[v0] Raw field values:", {
    yabanciKimlikNo: kisi.yabanciKimlikNo,
    ad: kisi.ad,
    soyad: kisi.soyad,
    ikametOzetListExists: !!kisi.ikametOzetList,
    ikametOzetListLength: kisi.ikametOzetList?.length,
    ikametIzniBilgileriListExists: !!data.ikametIzniBilgileriList,
    ikametIzniBilgileriListLength: data.ikametIzniBilgileriList?.length,
  })

  // Find the latest record from ikametOzetList (under kisi)
  let latestOzetRecord = null
  let latestDate = new Date(0)

  if (kisi.ikametOzetList && kisi.ikametOzetList.length > 0) {
    console.log("[v0] Processing ikametOzetList:", kisi.ikametOzetList)
    for (const record of kisi.ikametOzetList) {
      console.log("[v0] Processing ozet record:", record)
      try {
        const date = new Date(record.bitisTarihi)
        if (!isNaN(date.getTime()) && date > latestDate) {
          latestDate = date
          latestOzetRecord = record
          console.log("[v0] Found newer ozet record:", { date, record })
        }
      } catch (error) {
        console.log("[v0] Error processing ozet record date:", error)
      }
    }
  }

  let izinTuru = "Veri Yok"
  let izinBitisTarihi = "Veri Yok"
  let gerekce = "Veri Yok"

  if (latestOzetRecord) {
    console.log("[v0] Using latest ozet record:", latestOzetRecord)
    izinTuru = latestOzetRecord.verilisNedeni || "Veri Yok"
    izinBitisTarihi = formatDate(latestOzetRecord.bitisTarihi)

    // Process gerekce according to complex rules
    gerekce = processGerekce(latestOzetRecord.verilisNedeni, data.ikametIzniBilgileriList)
    console.log("[v0] Processed values:", { izinTuru, izinBitisTarihi, gerekce })
  } else {
    console.log("[v0] No latest ozet record found")
  }

  const result = {
    ykn,
    ad,
    soyad,
    izinTuru,
    gerekce,
    izinBitisTarihi,
    status: "Başarılı",
  }

  console.log("[v0] Final processed result:", result)
  return result
}

function processGerekce(verilisNedeni: string, ikametIzniBilgileriList: any[]): string {
  console.log("[v0] processGerekce called with:", {
    verilisNedeni,
    ikametIzniBilgileriListLength: ikametIzniBilgileriList?.length,
  })

  if (!ikametIzniBilgileriList || ikametIzniBilgileriList.length === 0) {
    console.log("[v0] No ikametIzniBilgileriList data")
    return "Veri Yok"
  }

  // Find the latest record from ikametIzniBilgileriList
  let latestIzinRecord = null
  let latestDate = new Date(0)

  console.log("[v0] Processing ikametIzniBilgileriList:", ikametIzniBilgileriList)
  for (const record of ikametIzniBilgileriList) {
    console.log("[v0] Processing izin record:", record)
    try {
      const date = new Date(record.bitisTarihi)
      if (!isNaN(date.getTime()) && date > latestDate) {
        latestDate = date
        latestIzinRecord = record
        console.log("[v0] Found newer izin record:", { date, record })
      }
    } catch (error) {
      console.log("[v0] Error processing izin record date:", error)
    }
  }

  if (!latestIzinRecord) {
    console.log("[v0] No latest izin record found")
    return "Veri Yok"
  }

  console.log("[v0] Using latest izin record for gerekce:", latestIzinRecord)

  // Rule 1: If verilisNedeni is "Aile", check aileDestekleyiciTur first
  if (verilisNedeni === "Aile" && latestIzinRecord.aileDestekleyiciTur) {
    console.log("[v0] Checking aileDestekleyiciTur:", latestIzinRecord.aileDestekleyiciTur)
    const mapped = aileDestekleyiciTur[latestIzinRecord.aileDestekleyiciTur as keyof typeof aileDestekleyiciTur]
    if (mapped) {
      console.log("[v0] Found aileDestekleyiciTur mapping:", mapped)
      return mapped
    }
  }

  // Check other fields in priority order
  if (latestIzinRecord.kisaDonemKalisNeden) {
    console.log("[v0] Checking kisaDonemKalisNeden:", latestIzinRecord.kisaDonemKalisNeden)
    const mapped = kisaDonemNedenleri[latestIzinRecord.kisaDonemKalisNeden as keyof typeof kisaDonemNedenleri]
    if (mapped) {
      console.log("[v0] Found kisaDonemKalisNeden mapping:", mapped)
      return mapped + " (Kısa Dönem)"
    }
  }

  if (latestIzinRecord.ogrenciKalisNeden) {
    console.log("[v0] Checking ogrenciKalisNeden:", latestIzinRecord.ogrenciKalisNeden)
    const mapped = ogrenciKalisNeden[latestIzinRecord.ogrenciKalisNeden as keyof typeof ogrenciKalisNeden]
    if (mapped) {
      console.log("[v0] Found ogrenciKalisNeden mapping:", mapped)
      return mapped + " (Öğrenci)"
    }
  }

  if (latestIzinRecord.insaniIkametIzniKalisNeden) {
    console.log("[v0] Checking insaniIkametIzniKalisNeden:", latestIzinRecord.insaniIkametIzniKalisNeden)
    const mapped =
      insaniIkametNedenleri[latestIzinRecord.insaniIkametIzniKalisNeden as keyof typeof insaniIkametNedenleri]
    if (mapped) {
      console.log("[v0] Found insaniIkametIzniKalisNeden mapping:", mapped)
      return mapped + " (İnsani)"
    }
  }

  if (latestIzinRecord.turkSoylu) {
    console.log("[v0] Checking turkSoylu:", latestIzinRecord.turkSoylu)
    const mapped = uzunDonemTurkSoylu[latestIzinRecord.turkSoylu as keyof typeof uzunDonemTurkSoylu]
    if (mapped) {
      console.log("[v0] Found turkSoylu mapping:", mapped)
      return mapped + " (Uzun Dönem)"
    }
  }

  console.log("[v0] No gerekce mapping found, returning 'Veri Yok'")
  return "Veri Yok"
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Veri Yok"
    }

    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Istanbul",
    })
  } catch {
    return "Veri Yok"
  }
}
