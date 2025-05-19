
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";

// Sample data
const monthlyRevenueData = [
  { month: "Ene", value: 4500 },
  { month: "Feb", value: 5200 },
  { month: "Mar", value: 6100 },
  { month: "Abr", value: 5800 },
  { month: "May", value: 7200 },
  { month: "Jun", value: 8400 },
];

const platformDistributionData = [
  { name: "Netflix", value: 35 },
  { name: "Disney+", value: 20 },
  { name: "HBO Max", value: 15 },
  { name: "Prime Video", value: 10 },
  { name: "Spotify", value: 12 },
  { name: "Otros", value: 8 },
];

const conversionRateData = [
  { day: "Lun", visits: 120, conversions: 24 },
  { day: "Mar", visits: 145, conversions: 32 },
  { day: "Mie", visits: 135, conversions: 28 },
  { day: "Jue", visits: 160, conversions: 35 },
  { day: "Vie", visits: 180, conversions: 45 },
  { day: "Sab", visits: 140, conversions: 38 },
  { day: "Dom", visits: 115, conversions: 25 },
];

const renewalRateData = [
  { month: "Ene", rate: 75 },
  { month: "Feb", rate: 78 },
  { month: "Mar", rate: 82 },
  { month: "Abr", rate: 80 },
  { month: "May", rate: 85 },
  { month: "Jun", rate: 86 },
];

const COLORS = ["#9b87f5", "#7E69AB", "#1EAEDB", "#33C3F0", "#D6BCFA", "#8B5CF6"];

export default function Statistics() {
  const [timeRange, setTimeRange] = useState("6months");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] border-nytrix-purple/20">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent className="bg-card border-nytrix-purple/20">
              <SelectItem value="30days">Últimos 30 días</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <Card className="border border-nytrix-purple/20">
            <CardHeader>
              <CardTitle>Ingresos Mensuales</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="month" tick={{ fill: "#9b87f5" }} />
                  <YAxis tick={{ fill: "#9b87f5" }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, "Ingresos"]}
                    contentStyle={{
                      backgroundColor: "#1A1F2C",
                      border: "1px solid rgba(155, 135, 245, 0.3)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "#9b87f5" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#9b87f5" 
                    strokeWidth={2}
                    dot={{ fill: "#9b87f5", r: 5 }}
                    activeDot={{ fill: "#9b87f5", r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card className="border border-nytrix-purple/20">
            <CardHeader>
              <CardTitle>Distribución por Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <Pie
                    data={platformDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {platformDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Porcentaje"]}
                    contentStyle={{
                      backgroundColor: "#1A1F2C",
                      border: "1px solid rgba(155, 135, 245, 0.3)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "#9b87f5" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="border border-nytrix-purple/20">
            <CardHeader>
              <CardTitle>Tasa de Conversión</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionRateData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="day" tick={{ fill: "#9b87f5" }} />
                  <YAxis tick={{ fill: "#9b87f5" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1F2C",
                      border: "1px solid rgba(155, 135, 245, 0.3)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "#9b87f5" }}
                  />
                  <Legend />
                  <Bar dataKey="visits" name="Visitas" fill="#9b87f5" />
                  <Bar dataKey="conversions" name="Conversiones" fill="#1EAEDB" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Renewal Rate */}
          <Card className="border border-nytrix-purple/20">
            <CardHeader>
              <CardTitle>Tasa de Renovación</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={renewalRateData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="month" tick={{ fill: "#9b87f5" }} />
                  <YAxis tick={{ fill: "#9b87f5" }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Tasa de Renovación"]}
                    contentStyle={{
                      backgroundColor: "#1A1F2C",
                      border: "1px solid rgba(155, 135, 245, 0.3)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "#9b87f5" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#1EAEDB" 
                    strokeWidth={2} 
                    dot={{ fill: "#1EAEDB", r: 5 }}
                    activeDot={{ fill: "#1EAEDB", r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
