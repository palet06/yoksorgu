



import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { kimlikNo } = await request.json()

    if (!kimlikNo) {
      return NextResponse.json({ success: false, message: "Kimlik numarası gerekli" }, { status: 400 })
    }

    // Kimlik numarası validasyonu (11 haneli olmalı)
    if (!/^\d{11}$/.test(kimlikNo)) {
      return NextResponse.json({ success: false, message: "Geçersiz kimlik numarası formatı" }, { status: 400 })
    }

  
 const apiEndpoint = process.env.YOK_API_ENDPOINT 
    const apiKey = process.env.YOK_API_KEY
   

   
    
    // YÖK API'sine istek gönder
  const yokResponse = await fetch(`${apiEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", 
        ApiKey:`${apiKey}`

      },
      body: JSON.stringify({       
        kimlikNo: kimlikNo        
      }),
    })

    console.log("[v0] API response status:", yokResponse.status)
    console.log("[v0] API response ok:", yokResponse.ok)

    if (!yokResponse.ok) {
      console.log("[v0] API response not ok, status:", yokResponse.status)
      const errorText = await yokResponse.text()
      console.log("[v0] API error response:", errorText)

      if (yokResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message:
              "API endpoint bulunamadı. Lütfen YOK_API_ENDPOINT environment variable'ını doğru API URL'i ile ayarlayın.",
          },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: `YÖK API hatası: ${yokResponse.status} - ${errorText}`,
        },
        { status: yokResponse.status },
      )
    }

    const yokData = await yokResponse.json()

    console.log("[v0] Raw YÖK API response:", JSON.stringify(yokData, null, 2))

    // YÖK API yanıtını standart formata dönüştür
    return NextResponse.json({
      success: true,
      message: "Operation Success",
      data: {
        ogrenciBilgisiList: yokData.data.ogrenciBilgisiList || [],
        sonuc: {
          sonuc: true,
          sonucMesaj: "İşlem başarıyla gerçekleştirilmiştir.",
        },
      },
    })
  } catch (error: any) {
    console.error("[v0] YÖK API error:", error)
    console.error("[v0] Error details:", error.message)

    if (error.code === "ENOTFOUND" || error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "API endpoint'ine ulaşılamıyor. Lütfen YOK_API_ENDPOINT environment variable'ını doğru API URL'i ile ayarlayın.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: `Sunucu hatası: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
