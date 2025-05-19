
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";
import RevenueChart from "@/components/admin/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Sample data
const platformData = [
  { name: "Netflix", users: 542, revenue: 4500 },
  { name: "Disney+", users: 380, revenue: 2300 },
  { name: "HBO Max", users: 290, revenue: 2100 },
  { name: "Prime", users: 240, revenue: 1200 },
  { name: "Spotify", users: 180, revenue: 700 },
];

const recentTransactions = [
  { id: 1, user: "Carlos Méndez", platform: "Netflix", amount: "$7.99", date: "Hoy, 14:23", status: "completado" },
  { id: 2, user: "Laura Torres", platform: "HBO Max", amount: "$6.99", date: "Hoy, 12:05", status: "completado" },
  { id: 3, user: "Javier Ruiz", platform: "Disney+", amount: "$5.99", date: "Ayer, 18:45", status: "completado" },
  { id: 4, user: "María González", platform: "Prime Video", amount: "$4.99", date: "Ayer, 15:30", status: "completado" },
  { id: 5, user: "Roberto Sánchez", platform: "Spotify Premium", amount: "$3.99", date: "21 May, 09:15", status: "completado" },
];

export default function Dashboard() {
  const [platforms] = useState(platformData);
  const [transactions] = useState(recentTransactions);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard de administración</h1>
        
        {/* Stats cards */}
        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Revenue chart */}
          <RevenueChart />

          {/* Platform stats */}
          <Card className="col-span-1 lg:col-span-3 border border-nytrix-purple/20">
            <CardHeader>
              <CardTitle>Distribución de Plataformas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={platforms}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="name" tick={{ fill: "#9b87f5" }} />
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
                  <Bar dataKey="users" fill="#9b87f5" name="Usuarios" />
                  <Bar dataKey="revenue" fill="#33C3F0" name="Ingresos ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card className="col-span-1 lg:col-span-2 border border-nytrix-purple/20">
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="border-b border-nytrix-purple/10 pb-2 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{transaction.user}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.platform} - {transaction.date}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.amount}</p>
                        <p className="text-xs text-right text-green-500">
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
