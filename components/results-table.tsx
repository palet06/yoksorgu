import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { QueryResult } from "@/types"

interface ResultsTableProps {
  results: QueryResult[]
}

export function ResultsTable({ results }: ResultsTableProps) {
  return (
    <div className="rounded-md border max-h-96 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kimlik No</TableHead>
            <TableHead>Sınıfı</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead>Öğrencilik Hakkı</TableHead>
            <TableHead>Öğrencilik Hakkı Bitiş Tarihi</TableHead>
            <TableHead>Ayrılma Nedeni</TableHead>
            <TableHead>Ayrılma Tarihi</TableHead>
            <TableHead>Statü</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono">{result.kimlikNo}</TableCell>
              <TableCell>{result.sinif}</TableCell>
              <TableCell>{result.kayitTarihi}</TableCell>
              <TableCell>{result.ogrencilikHakki}</TableCell>
              <TableCell>{result.ogrencilikHakkiBittigiTarih}</TableCell>
              <TableCell>{result.ayrilmaNedeni}</TableCell>
              <TableCell>{result.ayrilmaTarihi}</TableCell>
              <TableCell>{result.statu}</TableCell>
              <TableCell>
                <Badge variant={result.status === "Başarılı" ? "default" : "destructive"}>{result.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {results.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                Henüz sonuç yok
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
