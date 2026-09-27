import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { JobsList } from './pages/JobsList';
import { CreateJob } from './pages/CreateJob';
import { JobDetails } from './pages/JobDetails';
import { ResumeUpload } from './pages/ResumeUpload';
import { CandidatesList } from './pages/CandidatesList';
import { CandidateDetails } from './pages/CandidateDetails';
import { ScreeningResults } from './pages/ScreeningResults';
import { ShortlistedCandidates } from './pages/ShortlistedCandidates';
import { ScreeningHistory } from './pages/ScreeningHistory';
import { SettingsPage } from './pages/SettingsPage';
import { TechnicalArchitecture } from './pages/TechnicalArchitecture';

const AppContent: React.FC = () => {
  const { user, isLoading, darkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [selectedScreeningId, setSelectedScreeningId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin"></div>
          <span>INITIALIZING SMARTHIRE CORE ENGINE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <Login />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab}
            setSelectedJobId={setSelectedJobId}
            setSelectedCandidateId={setSelectedCandidateId}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsList 
            setActiveTab={setActiveTab}
            onSelectJob={(id) => {
              setSelectedJobId(id);
              setActiveTab('job-details');
            }}
            onUploadForJob={(id) => {
              setSelectedJobId(id);
              setActiveTab('upload');
            }}
          />
        )}

        {activeTab === 'create-job' && (
          <CreateJob 
            setActiveTab={setActiveTab}
            onJobCreated={(id) => {
              setSelectedJobId(id);
              setActiveTab('job-details');
            }}
          />
        )}

        {activeTab === 'job-details' && selectedJobId && (
          <JobDetails 
            jobId={selectedJobId} 
            setActiveTab={setActiveTab}
            onSelectCandidate={(id) => {
              setSelectedCandidateId(id);
              setActiveTab('candidate-details');
            }}
            onUploadForJob={(id) => {
              setSelectedJobId(id);
              setActiveTab('upload');
            }}
          />
        )}

        {activeTab === 'upload' && (
          <ResumeUpload 
            selectedJobId={selectedJobId} 
            setActiveTab={setActiveTab}
            onScreeningComplete={() => {
              setActiveTab('screening');
            }}
          />
        )}

        {activeTab === 'candidates' && (
          <CandidatesList 
            setActiveTab={setActiveTab}
            onSelectCandidate={(id) => {
              setSelectedCandidateId(id);
              setActiveTab('candidate-details');
            }}
          />
        )}

        {activeTab === 'candidate-details' && (
          <CandidateDetails 
            candidateId={selectedCandidateId}
            screeningId={selectedScreeningId}
            setActiveTab={setActiveTab}
            onBack={() => {
              setActiveTab('screening');
            }}
          />
        )}

        {activeTab === 'screening' && (
          <ScreeningResults 
            selectedJobId={selectedJobId}
            onSelectCandidate={(id) => {
              setSelectedCandidateId(id);
              setActiveTab('candidate-details');
            }}
            onSelectScreening={(id) => {
              setSelectedScreeningId(id);
              setActiveTab('candidate-details');
            }}
          />
        )}

        {activeTab === 'shortlist' && (
          <ShortlistedCandidates 
            setActiveTab={setActiveTab}
            onSelectCandidate={(id) => {
              setSelectedCandidateId(id);
              setActiveTab('candidate-details');
            }}
            onSelectScreening={(id) => {
              setSelectedScreeningId(id);
              setActiveTab('candidate-details');
            }}
          />
        )}

        {activeTab === 'history' && (
          <ScreeningHistory />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}

        {activeTab === 'architecture' && (
          <TechnicalArchitecture />
        )}
      </main>

      {/* Minimal Monochrome Footer */}
      <footer className="border-t border-zinc-800/80 py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>SmartHire — Academic DBMS / DMGT / ADSA / OOPJ Recruitment Screening System</div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Decision Support Engine</span>
            <span>•</span>
            <span>Zero Mock Pre-Scores</span>
            <span>•</span>
            <button 
              onClick={() => setActiveTab('architecture')} 
              className="text-zinc-400 hover:text-white underline underline-offset-2"
            >
              Academic Architecture
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
