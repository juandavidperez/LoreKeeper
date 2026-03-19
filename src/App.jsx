import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { MainLayout } from './components/MainLayout'
import { ReloadPrompt } from './components/ReloadPrompt'
import { OnboardingOverlay } from './components/OnboardingOverlay'

import { LorekeeperProvider, useLorekeeperState } from './hooks/useLorekeeperState'
import { NotificationProvider, useNotification } from './hooks/useNotification'
import { AuthProvider } from './hooks/useAuth'
import { SyncProvider } from './hooks/useSync'
import { MigrationGuard } from './components/MigrationGuard'
import { SyncTracker } from './components/SyncTracker'

const ReadingPlan = lazy(() => import('./views/ReadingPlan').then(m => ({ default: m.ReadingPlan })))
const ReadingLog = lazy(() => import('./views/ReadingLog').then(m => ({ default: m.ReadingLog })))
const Encyclopedia = lazy(() => import('./views/Encyclopedia').then(m => ({ default: m.Encyclopedia })))

function ViewFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="text-zinc-600 font-serif italic text-sm">Cargando...</span>
    </div>
  )
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('log')
  const [entityFocus, setEntityFocus] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !window.localStorage.getItem('lore-onboarding-done')
  })
  const { stateSetters, entries } = useLorekeeperState()
  const notify = useNotification()

  // Navigate to encyclopedia and focus on a specific entity
  const navigateToEntity = useCallback((entityName) => {
    setEntityFocus(entityName)
    setActiveTab('encyclopedia')
  }, [])

  // Clear entity focus when leaving encyclopedia
  const handleSetActiveTab = useCallback((tab) => {
    if (tab !== 'encyclopedia') setEntityFocus(null)
    setActiveTab(tab)
  }, [])

  const completeOnboarding = useCallback(() => {
    window.localStorage.setItem('lore-onboarding-done', '1')
    setShowOnboarding(false)
  }, [])

  // Reading reminder: check on app open if user hasn't logged in 2+ days
  useEffect(() => {
    const reminderEnabled = window.localStorage.getItem('lore-reminder') === '1'
    if (!reminderEnabled || !entries.length) return

    const lastDate = entries.reduce((max, e) => e.date > max ? e.date : max, '')
    if (!lastDate) return

    const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
    if (daysSince >= 2) {
      notify(`El grimorio te extra\u00f1a... Han pasado ${daysSince} d\u00edas sin una cr\u00f3nica.`, 'info')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SyncProvider stateSetters={stateSetters}>
      <MigrationGuard />
      <SyncTracker />
      {showOnboarding && <OnboardingOverlay onComplete={completeOnboarding} />}
      <MainLayout activeTab={activeTab} setActiveTab={handleSetActiveTab}>
        <Suspense fallback={<ViewFallback />}>
          {activeTab === 'plan' && <ReadingPlan />}
          {activeTab === 'log' && <ReadingLog onNavigateToEntity={navigateToEntity} />}
          {activeTab === 'encyclopedia' && <Encyclopedia entityFocus={entityFocus} onClearFocus={() => setEntityFocus(null)} />}
        </Suspense>
        <ReloadPrompt />
      </MainLayout>
    </SyncProvider>
  )
}

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <LorekeeperProvider>
          <AppContent />
        </LorekeeperProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}

export default App
