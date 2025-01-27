import React from 'react';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/toaster';
import { ProLicenseManager } from './ProLicenseManager';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="dev-tools-theme">
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <header className="container mx-auto py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              Developer Tools Hub
            </h1>
            <div className="w-[300px]">
              <ProLicenseManager />
            </div>
          </div>
        </header>
        
        <main className="container mx-auto py-8">
          {children}
        </main>
        
        <footer className="container mx-auto py-6 text-center text-gray-400">
          <p className="text-sm">
            Built with ❤️ by developers, for developers
          </p>
        </footer>
      </div>
      <Toaster />
    </ThemeProvider>
  );
} 