import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDateTime } from "@/lib/time"
import type { QueryLog } from "@/types"

interface QueryLogsProps {
  logs: QueryLog[]
}

export function QueryLogs({ logs }: QueryLogsProps) {
  return (
    <ScrollArea className="h-96">
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div key={index} className="p-3 border rounded-lg text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono">{log.kimlikNo || "Sistem"}</span>
              <Badge
                variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}
              >
                {log.status === "success" ? "Başarılı" : log.status === "error" ? "Hata" : "Bilgi"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>{log.message}</div>
              {log.responseTime && <div>Süre: {log.responseTime}ms</div>}
              <div>{formatDateTime(log.timestamp)}</div>
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="text-center text-muted-foreground py-8">Henüz log yok</div>}
      </div>
    </ScrollArea>
  )
}
