import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Meals from "./pages/Meals";
import MealDetail from "./pages/MealDetail";
import ChefDashboard from "./pages/ChefDashboard";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";
import Chefs from "./pages/Chefs";
import ChefProfile from "./pages/ChefProfile";
import Partner from "./pages/Partner";
import Admin from "./pages/Admin";
import Subscriptions from "./pages/Subscriptions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/meals/:id" element={<MealDetail />} />
          <Route path="/chefs" element={<Chefs />} />
          <Route path="/chefs/:id" element={<ChefProfile />} />
          <Route path="/chef/dashboard" element={<ChefDashboard />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
