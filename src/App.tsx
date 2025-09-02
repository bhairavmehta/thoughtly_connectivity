
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/auth/AuthGuard";
import Home from "./pages/Index";
import Thread from "./pages/Thread";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }>
              <Route path="/home" element={<Home />} />
              <Route path="/thread/:id" element={<Thread />} />
            </Route>
            
            {/* Redirect root to home when authenticated */}
            <Route 
              path="/" 
              element={
                <AuthGuard>
                  <Navigate to="/home" replace />
                </AuthGuard>
              } 
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
