import React from 'react';
import { PlannerProvider } from './context/PlannerContext';
import Sidebar from './components/Sidebar';
import Board from './components/Board';
import './index.css';

function App() {
    return (
        <PlannerProvider>
            <div className="app-container" style={{ display: 'flex', width: '100%', height: '100vh' }}>
                <Sidebar />
                <main style={{
                    flex: 1,
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Board />
                </main>
            </div>
        </PlannerProvider>
    );
}

export default App;
