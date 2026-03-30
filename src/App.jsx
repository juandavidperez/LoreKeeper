import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
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
    return ['plan', 'log', 'encyclopedia', 'oracle', 'map'].includes(hash) ? hash : 'log'
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
    if (tab !== 'log') setLogDraft(null)
    if (tab !== 'oracle' && tab !== 'map') setOracleFocus(null)
    setActiveTab(tab)
  }, [setActiveTab])

  // Sync hash to state on back/forward
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1)
      if (['plan', 'log', 'encyclopedia', 'oracle', 'map'].includes(hash)) {
        setActiveTabRaw(hash)
      }
    }
    window.addEventListener('hashchange', handlePopState)
    return () => window.removeEventListener('hashchange', handlePopState)
  }, [])

  const navigateToOracle = useCallback((entity) => {
    setOracleFocus(entity)
    setActiveTab('oracle')
  }, [])

  const handleLogFromPlan = useCallback((data) => {
    setLogDraft(data)
    setActiveTab('log')
  }, [])

  const completeOnboarding = useCallback(() => {
    window.localStorage.setItem('lore-onboarding-done', '1')
    setShowOnboarding(false)
  }, [])

  // Reading reminder: on-open warning + timed push notifications
  const reminderFired = useRef(false)
  useEffect(() => {
    const enabled = window.localStorage.getItem('lore-reminder') === '1'
    if (!enabled) return

    // On-open: warn if grimoire has been dormant 2+ days
    if (entries.length > 0) {
      const lastDate = entries.reduce((max, e) => e.date > max ? e.date : max, '')
      if (lastDate) {
        const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
        if (daysSince >= 2) {
          notify(`El grimorio te extra\u00f1a... Han pasado ${daysSince} d\u00edas sin una cr\u00f3nica.`, 'info')
        }
      }
    }

    // Timed notification: check every minute if it's past the set reminder time
    const check = () => {
      if (reminderFired.current) return
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const time = window.localStorage.getItem('lore-reminder-time') || '21:00'
      const now = new Date()
      const [h, m] = time.split(':').map(Number)
      const today = now.toISOString().split('T')[0]

      try {
        const stored = JSON.parse(window.localStorage.getItem('reading-entries') || '[]')
        if (stored.some(e => e.date === today)) { reminderFired.current = true; return }
      } catch { return }

      if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
        reminderFired.current = true
        const opts = {
          body: '\u00bfLe\u00edste hoy, archivero? El grimorio aguarda tu cr\u00f3nica.',
          icon: '/pwa-192.png',
          badge: '/pwa-192.png',
          tag: 'reading-reminder',
        }
        navigator.serviceWorker?.ready
          .then(reg => reg.showNotification('Lorekeeper', opts))
          .catch(() => {})
      }
    }

    check()
    const interval = setInterval(check, 60_000)

    // Reset fired flag at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const midnightTimer = setTimeout(() => { reminderFired.current = false }, tomorrow - now)

    return () => { clearInterval(interval); clearTimeout(midnightTimer) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SyncProvider stateSetters={stateSetters}>
      <MigrationGuard />
      <SyncTracker />
      {showOnboarding && <OnboardingOverlay onComplete={completeOnboarding} />}
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
          {activeTab === 'map' && <WisdomMap />}
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
