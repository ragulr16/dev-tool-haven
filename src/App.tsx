import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProLicenseProvider } from "@/contexts/ProLicenseContext";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ProLicenseProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
          </Routes>
        </Layout>
        <Toaster />
        <Sonner />
      </ProLicenseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
