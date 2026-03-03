import React from 'react';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import Sidebar from './components/Sidebar';
import Board from './components/Board';
import UsersModule from './components/UsersModule';
import AuthView from './components/AuthView';
import './index.css';

function App() {
    return (
        <PlannerProvider>
            <AppContent />
        </PlannerProvider>
    );
}

function AppContent() {
    const { currentUser } = usePlanner();
    const [currentView, setCurrentView] = React.useState('board');

    if (!currentUser) return <AuthView />;

    return (
        <div className="app-container" style={{ display: 'flex', width: '100%', height: '100vh' }}>
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <main style={{
                flex: 1,
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {currentView === 'users' && currentUser?.canViewAll ? <UsersModule /> : <Board />}
            </main>
        </div>
    );
}

export default App;
