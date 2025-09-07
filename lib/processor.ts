import type { QueryResult } from "@/types"

export function processYokResponse(kimlikNo: string, apiResponse: any): QueryResult {
  console.log("[v0] Processing YÖK response for:", kimlikNo)
  console.log("[v0] Full API response:", JSON.stringify(apiResponse, null, 2))

  if (!apiResponse || !apiResponse.success || !apiResponse.data) {
    console.log("[v0] API response failed basic checks")
    return {
      kimlikNo,
      sinif: "Veri Yok",
      kayitTarihi: "Veri Yok",
      ogrencilikHakki: "Veri Yok",
      ogrencilikHakkiBittigiTarih: "Veri Yok",
      ayrilmaNedeni: "Veri Yok",
      ayrilmaTarihi: "Veri Yok",
      statu: "Veri Yok",
      status: "Hata",
    }
  }

  const data = apiResponse.data
  console.log("[v0] Data object:", data)
  console.log("[v0] ogrenciBilgisiList:", data.ogrenciBilgisiList)

  const ogrenciBilgisi = data.ogrenciBilgisiList?.[0] // İlk elemanı al
  console.log("[v0] First ogrenciBilgisi:", ogrenciBilgisi)

  if (!ogrenciBilgisi) {
    console.log("[v0] No ogrenciBilgisi found")
    return {
      kimlikNo,
      sinif: "Veri Yok",
      kayitTarihi: "Veri Yok",
      ogrencilikHakki: "Veri Yok",
      ogrencilikHakkiBittigiTarih: "Veri Yok",
      ayrilmaNedeni: "Veri Yok",
      ayrilmaTarihi: "Veri Yok",
      statu: "Veri Yok",
      status: "Hata",
    }
  }

  const ogrenciBilgileriData = ogrenciBilgisi.ogrenciBilgileri || {}

  console.log("[v0] ogrenciBilgileri:", ogrenciBilgileriData)

  const sinif = ogrenciBilgileriData.sinifi?.ad || "Veri Yok"
  const kayitTarihi = ogrenciBilgileriData.kayitTarihi || "Veri Yok"
  const ogrencilikHakki = ogrenciBilgileriData.ogrencilikHakki?.ad || "Veri Yok"
  const ogrencilikHakkiBittigiTarih = ogrenciBilgileriData.ogrencilikHakkiBittigiTarih || "Veri Yok"
  const ayrilmaNedeni = ogrenciBilgileriData.ayrilmaNedeni?.ad || "Veri Yok"
  const ayrilmaTarihi = ogrenciBilgileriData.ayrilmaTarihi || "Veri Yok"
  const statu = ogrenciBilgileriData.ogrencilikStatusu?.ad || "Veri Yok"

  console.log("[v0] Extracted fields:")
  console.log("[v0] - sinif:", sinif)
  console.log("[v0] - kayitTarihi:", kayitTarihi)
  console.log("[v0] - ogrencilikHakki:", ogrencilikHakki)
  console.log("[v0] - ogrencilikHakkiBittigiTarih:", ogrencilikHakkiBittigiTarih)
  console.log("[v0] - ayrilmaNedeni:", ayrilmaNedeni)
  console.log("[v0] - ayrilmaTarihi:", ayrilmaTarihi)
  console.log("[v0] - statu:", statu)

  const result = {
    kimlikNo,
    sinif,
    kayitTarihi,
    ogrencilikHakki,
    ogrencilikHakkiBittigiTarih,
    ayrilmaNedeni,
    ayrilmaTarihi,
    statu,
    status: "Başarılı",
  }

  console.log("[v0] Final processed result:", result)
  return result
}
