
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const dummyData = [
  { name: "Ene", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 5000 },
  { name: "Abr", revenue: 7000 },
  { name: "May", revenue: 6000 },
  { name: "Jun", revenue: 8000 },
  { name: "Jul", revenue: 10000 },
  { name: "Ago", revenue: 9000 },
  { name: "Sep", revenue: 11000 },
  { name: "Oct", revenue: 14000 },
  { name: "Nov", revenue: 12000 },
  { name: "Dic", revenue: 15000 },
];

export default function RevenueChart() {
  const [period, setPeriod] = useState("year");
  const [chartData, setChartData] = useState(dummyData);

  // Filter data based on selected period
  useEffect(() => {
    if (period === "year") {
      setChartData(dummyData);
    } else if (period === "quarter") {
      setChartData(dummyData.slice(-3));
    } else if (period === "month") {
      setChartData(dummyData.slice(-1));
    }
  }, [period]);

  return (
    <Card className="col-span-4 border border-nytrix-purple/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Ingresos</CardTitle>
          <CardDescription>
            La tendencia de ingresos para el período seleccionado
          </CardDescription>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] border border-nytrix-purple/20">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-nytrix-purple/20">
            <SelectItem value="month">Últimos 30 días</SelectItem>
            <SelectItem value="quarter">Último trimestre</SelectItem>
            <SelectItem value="year">Último año</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              stroke="#9b87f5" 
              tick={{ fill: "#9b87f5", fontSize: 12 }}
              axisLine={{ stroke: "rgba(155, 135, 245, 0.3)" }}
            />
            <YAxis 
              stroke="#9b87f5" 
              tick={{ fill: "#9b87f5", fontSize: 12 }}
              axisLine={{ stroke: "rgba(155, 135, 245, 0.3)" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1F2C",
                border: "1px solid rgba(155, 135, 245, 0.3)",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "#9b87f5" }}
              formatter={(value) => [`$${value}`, "Ingresos"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#9b87f5"
              activeDot={{ r: 6, fill: "#9b87f5" }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
