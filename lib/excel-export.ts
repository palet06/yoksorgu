import * as XLSX from "xlsx"
import type { QueryResult } from "@/types"

export function exportToExcel(results: QueryResult[]) {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()

  // Prepare data for Excel
  const excelData = results.map((result) => ({
    YKN: result.ykn,
    Ad: result.ad,
    Soyad: result.soyad,
    "İzin Türü": result.izinTuru,
    Gerekçe: result.gerekce,
    "İzin Bitiş Tarihi": result.izinBitisTarihi,
    Durum: result.status,
  }))

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Set column widths
  const colWidths = [
    { wch: 15 }, // YKN
    { wch: 20 }, // Ad
    { wch: 20 }, // Soyad
    { wch: 15 }, // İzin Türü
    { wch: 40 }, // Gerekçe
    { wch: 20 }, // İzin Bitiş Tarihi
    { wch: 10 }, // Durum
  ]
  ws["!cols"] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Sorgu Sonuçları")

  // Generate filename with current date/time
  const now = new Date()
  const filename = `sorgu_sonucu_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}
