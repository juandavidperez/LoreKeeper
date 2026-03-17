import { useState } from 'react'
import { MainLayout } from './components/MainLayout'
import { ReadingPlan } from './views/ReadingPlan'
import { ReadingLog } from './views/ReadingLog'
import { Encyclopedia } from './views/Encyclopedia'
import { ReloadPrompt } from './components/ReloadPrompt'

import { LorekeeperProvider } from './hooks/useLorekeeperState'
import { NotificationProvider } from './hooks/useNotification'

function App() {
  const [activeTab, setActiveTab] = useState('log')

  return (
    <NotificationProvider>
      <LorekeeperProvider>
        <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {activeTab === 'plan' && <ReadingPlan />}
          {activeTab === 'log' && <ReadingLog />}
          {activeTab === 'encyclopedia' && <Encyclopedia />}
          <ReloadPrompt />
        </MainLayout>
      </LorekeeperProvider>
    </NotificationProvider>
  )
}

export default App
