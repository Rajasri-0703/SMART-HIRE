import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  UploadCloud,
  Users,
  CheckCircle2,
  Sliders,
  Database,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  BarChart3,
  History,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onRefreshData }) => {
  const { user, logout, darkMode, toggleDarkMode, token } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState('');

  const handleSeedDemo = async () => {
    if (!token) return;
    setIsSeeding(true);
    setSeedSuccessMsg('');
    try {
      const res = await fetch('/api/seed/demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSeedSuccessMsg('Demo Resumes Processed');
        setTimeout(() => setSeedSuccessMsg(''), 4000);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Failed to seed demo data', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'upload', label: 'Bulk Upload', icon: UploadCloud },
    { id: 'screening', label: 'Screening & Ranking', icon: Sparkles },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'shortlist', label: 'Shortlist', icon: CheckCircle2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'architecture', label: 'Tech Architecture', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 light:bg-white light:border-zinc-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-extrabold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              SH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-zinc-100 dark:text-zinc-100 light:text-zinc-900 font-sans group-hover:text-indigo-400 transition-colors">
                  SmartHire
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  AI Screening
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 font-mono">
                <span className="text-sky-400 font-medium">DBMS</span> · <span className="text-amber-400 font-medium">DMGT</span> · <span className="text-emerald-400 font-medium">ADSA</span> · <span className="text-purple-400 font-medium">OOPJ</span> · <span className="text-cyan-400 font-medium">Python</span>
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden xl:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 dark:text-zinc-400 dark:hover:text-zinc-200 light:text-zinc-600 light:hover:text-zinc-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Demo Data Seeder Button */}
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            title="Load realistic sample resumes to test screening pipeline immediately"
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 hover:text-purple-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-purple-500/10"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin text-purple-400' : 'text-purple-400'}`} />
            <span>{isSeeding ? 'Processing Resumes...' : 'Seed Demo Data'}</span>
          </button>

          {seedSuccessMsg && (
            <span className="hidden lg:inline-block text-xs font-mono text-emerald-400 font-semibold animate-pulse">
              ✓ {seedSuccessMsg}
            </span>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors dark:border-zinc-800 dark:bg-zinc-900 light:border-zinc-200 light:bg-zinc-100 light:text-zinc-700"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile / Logout */}
          {user && (
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-800 dark:border-zinc-800 light:border-zinc-300">
              <div className="text-right">
                <div className="text-xs font-medium text-zinc-200 dark:text-zinc-200 light:text-zinc-900 leading-tight">
                  {user.full_name}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
                  {user.department}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign out HR session"
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drop */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-zinc-800 bg-zinc-950 p-4 space-y-1">
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              onClick={() => {
                handleSeedDemo();
                setMobileMenuOpen(false);
              }}
              disabled={isSeeding}
              className="text-xs font-mono px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300"
            >
              ⚡ {isSeeding ? 'Processing...' : 'Load Academic Demo Data'}
            </button>
            {user && (
              <button
                onClick={logout}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
