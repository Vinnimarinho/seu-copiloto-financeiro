import { AppSidebar } from "@/components/AppSidebar";
import { mockHistory, formatCurrency, formatPercent } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const chartData = [...mockHistory].reverse().map(h => ({
  date: h.date.slice(0, 7),
  value: h.value,
}));

export default function HistoryPage() {
  return (
    <AppSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-1">Evolução da carteira ao longo do tempo</p>
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h2 className="font-heading font-semibold text-sm text-foreground mb-4">Evolução do patrimônio</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="value" stroke="hsl(153, 60%, 32%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Data</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-4">Patrimônio</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-4">Variação</th>
              </tr>
            </thead>
            <tbody>
              {mockHistory.map((h) => (
                <tr key={h.date} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="text-sm text-foreground p-4">{h.date}</td>
                  <td className="text-sm text-foreground text-right p-4 font-medium">{formatCurrency(h.value)}</td>
                  <td className={`text-sm text-right p-4 font-medium ${h.change >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatPercent(h.change)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppSidebar>
  );
}
