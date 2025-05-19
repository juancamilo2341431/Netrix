import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import { CartProvider } from "./contexts/CartContext/CartContext";

// Client Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/client/Dashboard";
import ActiveAccounts from "./pages/client/ActiveAccounts";
import ExpiringAccounts from "./pages/client/ExpiringAccounts";
import ExpiredAccounts from "./pages/client/ExpiredAccounts";
import ChangePassword from "./pages/client/ChangePassword";
import Profile from "./pages/client/Profile";
import Platforms from "./pages/Platforms";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import PaymentSuccess from "./pages/payment/PaymentSuccess";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPlatforms from "./pages/admin/Platforms";
import AdminAccounts from "./pages/admin/Accounts";
import AdminStats from "./pages/admin/Statistics";
import AdminLogs from "./pages/admin/Audit";
import AdminTrash from "./pages/admin/Trash";
import AdminServices from "./pages/admin/Services";
import AdminCoupons from "./pages/admin/Coupons";
import AdminReview from "./pages/admin/Review";
import AdminPayments from "./pages/admin/Payments";
import AdminWarranty from "./pages/admin/Warranty";
import Corte from "./pages/admin/Corte";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <CartProvider>
        <AuthProvider>
          <TooltipProvider>
            <Sonner richColors position="bottom-right" closeButton />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/platforms" element={<Platforms />} />
              
              {/* Protected Client Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/client/accounts/active" element={<ActiveAccounts />} />
                <Route path="/client/accounts/expiring" element={<ExpiringAccounts />} />
                <Route path="/client/accounts/expired" element={<ExpiredAccounts />} />
                <Route path="/client/change-password" element={<ChangePassword />} />
                <Route path="/client/profile" element={<Profile />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
              </Route>
              
              {/* Admin Routes - protected by AdminRoute */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/platforms" element={<AdminPlatforms />} />
                <Route path="/admin/accounts" element={<AdminAccounts />} />
                <Route path="/admin/services" element={<AdminServices />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/trash" element={<AdminTrash />} />
                <Route path="/admin/stats" element={<AdminStats />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/admin/review" element={<AdminReview />} />
                <Route path="/admin/warranty" element={<AdminWarranty />} />
                <Route path="/admin/corte" element={<Corte />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
