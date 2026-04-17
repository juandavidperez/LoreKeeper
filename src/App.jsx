import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { MainLayout } from './components/MainLayout'
import { ReloadPrompt } from './components/ReloadPrompt'
import { OnboardingOverlay } from './components/OnboardingOverlay'
import { InstallBanner } from './components/InstallBanner'

import { LorekeeperProvider, useLorekeeperState } from './hooks/useLorekeeperState'
import { NotificationProvider } from './hooks/useNotification'
import { useReadingReminder } from './hooks/useReadingReminder'
import { pruneOrphanedPanels } from './utils/imageStore'
import { AuthProvider } from './hooks/useAuth'
import { SyncProvider } from './hooks/useSync'
import { ThemeProvider } from './context/ThemeProvider'
import { SVGFilters } from './components/SVGFilters'

const ReadingPlan = lazy(() => import('./views/ReadingPlan').then(m => ({ default: m.ReadingPlan })))
const ReadingLog = lazy(() => import('./views/ReadingLog').then(m => ({ default: m.ReadingLog })))
const Encyclopedia = lazy(() => import('./views/Encyclopedia').then(m => ({ default: m.Encyclopedia })))
const OracleView = lazy(() => import('./views/OracleView').then(m => ({ default: m.OracleView })))
const WisdomMap = lazy(() => import('./views/WisdomMap').then(m => ({ default: m.WisdomMap })))

function ViewFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="text-stone-400 font-serif italic text-sm">Cargando...</span>
    </div>
  )
}

function AppContent() {
  const [activeTab, setActiveTabRaw] = useState(() => {
    const hash = window.location.hash.slice(1)
    return ['plan', 'log', 'encyclopedia', 'oracle'].includes(hash) ? hash : 'log'
  })

  const setActiveTab = useCallback((tab) => {
    setActiveTabRaw(tab)
    window.location.hash = tab
  }, [])
  const [entityFocus, setEntityFocus] = useState(null)
  const [oracleFocus, setOracleFocus] = useState(null)
  const [logDraft, setLogDraft] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !window.localStorage.getItem('lore-onboarding-done')
  })
  const { entries } = useLorekeeperState()
  useReadingReminder(entries)

  useEffect(() => {
    pruneOrphanedPanels(entries).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to encyclopedia and focus on a specific entity
  const navigateToEntity = useCallback((entityName) => {
    setEntityFocus(entityName)
    setActiveTab('encyclopedia')
  }, [setActiveTab])

  // Clear entity focus when leaving encyclopedia
  const handleSetActiveTab = useCallback((tab) => {
    if (tab !== 'encyclopedia') setEntityFocus(null)
    if (tab !== 'log') setLogDraft(null)
    if (tab !== 'oracle' && tab !== 'map') setOracleFocus(null)
    setActiveTab(tab)
  }, [setActiveTab])

  // Sync hash to state on back/forward
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1)
      if (['plan', 'log', 'encyclopedia', 'oracle'].includes(hash)) {
        setActiveTabRaw(hash)
      }
    }
    window.addEventListener('hashchange', handlePopState)
    return () => window.removeEventListener('hashchange', handlePopState)
  }, [])

  const navigateToOracle = useCallback((entity) => {
    setOracleFocus(entity)
    setActiveTab('oracle')
  }, [setActiveTab])

  const handleLogFromPlan = useCallback((data) => {
    setLogDraft(data)
    setActiveTab('log')
  }, [setActiveTab])

  const completeOnboarding = useCallback(() => {
    window.localStorage.setItem('lore-onboarding-done', '1')
    setShowOnboarding(false)
  }, [])

  return (
    <SyncProvider>
      {showOnboarding && <OnboardingOverlay onComplete={completeOnboarding} />}
      <InstallBanner />
      <MainLayout activeTab={activeTab} setActiveTab={handleSetActiveTab}>
        <Suspense fallback={<ViewFallback />}>
          {activeTab === 'plan' && <ReadingPlan onLogWeek={handleLogFromPlan} />}
          {activeTab === 'log' && (
            <ReadingLog 
              onNavigateToEntity={navigateToEntity} 
              onConsultOracle={navigateToOracle}
              prefilledData={logDraft}
              onClearPrefilled={() => setLogDraft(null)}
            />
          )}
          {activeTab === 'encyclopedia' && (
            <Encyclopedia 
              entityFocus={entityFocus} 
              onClearFocus={() => setEntityFocus(null)} 
              onConsultOracle={navigateToOracle}
            />
          )}
          {activeTab === 'oracle' && <OracleView initialFocus={oracleFocus} onClearFocus={() => setOracleFocus(null)} />}
        </Suspense>
        <ReloadPrompt />
      </MainLayout>
    </SyncProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <SVGFilters />
      <NotificationProvider>
        <AuthProvider>
          <LorekeeperProvider>
            <AppContent />
          </LorekeeperProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App
