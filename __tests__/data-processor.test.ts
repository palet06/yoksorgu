import { processApiResponse } from "@/lib/data-processor"
import type { ApiResponse } from "@/types"

describe("Data Processor", () => {
  it("should process successful API response correctly", () => {
    const mockResponse: ApiResponse = {
      success: true,
      data: {
        yabanciKimlikNo: "123456",
        ad: "hasan hüseyin",
        soyad: "hasan",
        ikametOzetList: [
          {
            verilisNedeni: "Aile",
            bitisTarihi: "2026-10-18T00:00:00",
          },
        ],
        ikametIzniBilgileriList: [
          {
            bitisTarihi: "2026-10-18T00:00:00",
            aileDestekleyiciTur: 1,
          },
        ],
      },
    }

    const result = processApiResponse("123456", mockResponse)

    expect(result).toEqual({
      ykn: "123456",
      ad: "hasan hüseyin",
      soyad: "hasan",
      izinTuru: "Aile",
      gerekce: "Destekleyicinin Eşi",
      izinBitisTarihi: expect.stringContaining("18.10.2026"),
      status: "Başarılı",
    })
  })

  it("should handle API error response", () => {
    const mockResponse: ApiResponse = {
      success: false,
      message: "Kayıt bulunamadı",
    }

    const result = processApiResponse("123456", mockResponse)

    expect(result).toEqual({
      ykn: "123456",
      ad: "Veri Yok",
      soyad: "Veri Yok",
      izinTuru: "Veri Yok",
      gerekce: "API Hatası: Kayıt bulunamadı",
      izinBitisTarihi: "Veri Yok",
      status: "Hata",
    })
  })

  it("should handle missing data gracefully", () => {
    const mockResponse: ApiResponse = {
      success: true,
      data: {
        yabanciKimlikNo: "123456",
        ad: "",
        soyad: "",
        ikametOzetList: [],
        ikametIzniBilgileriList: [],
      },
    }

    const result = processApiResponse("123456", mockResponse)

    expect(result.ad).toBe("Veri Yok")
    expect(result.soyad).toBe("Veri Yok")
    expect(result.izinTuru).toBe("Veri Yok")
    expect(result.gerekce).toBe("Veri Yok")
    expect(result.status).toBe("Başarılı")
  })
})
