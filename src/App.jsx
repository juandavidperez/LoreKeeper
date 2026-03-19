import { useState } from 'react'
import { MainLayout } from './components/MainLayout'
import { ReadingPlan } from './views/ReadingPlan'
import { ReadingLog } from './views/ReadingLog'
import { Encyclopedia } from './views/Encyclopedia'
import { ReloadPrompt } from './components/ReloadPrompt'

import { LorekeeperProvider, useLorekeeperState } from './hooks/useLorekeeperState'
import { NotificationProvider } from './hooks/useNotification'
import { AuthProvider } from './hooks/useAuth'
import { SyncProvider } from './hooks/useSync'
import { MigrationGuard } from './components/MigrationGuard'
import { SyncTracker } from './components/SyncTracker'

function AppContent() {
  const [activeTab, setActiveTab] = useState('log')
  const { stateSetters } = useLorekeeperState()

  return (
    <SyncProvider stateSetters={stateSetters}>
      <MigrationGuard />
      <SyncTracker />
      <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'plan' && <ReadingPlan />}
        {activeTab === 'log' && <ReadingLog />}
        {activeTab === 'encyclopedia' && <Encyclopedia />}
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
