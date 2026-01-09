import { LazorkitProvider } from '@lazorkit/wallet'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { ConnectButton } from './components/ConnectButton'
import { useWallet } from '@lazorkit/wallet'
import './App.css'

const CONFIG = {
  RPC_URL: "https://api.devnet.solana.com",
  PORTAL_URL: "https://portal.lazor.sh",
  PAYMASTER: {
    paymasterUrl: "https://kora.devnet.lazorkit.com"
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet()
  return isConnected ? <>{children}</> : <Navigate to="/" />
}

function LandingPage() {
  return (
    <div className="landing">
      <div className="hero">
        <h1>🎯 Zealy-like Referral System</h1>
        <p className="subtitle">Powered by Lazorkit & Solana</p>
        <p className="description">
          Experience frictionless onboarding with passkey authentication, 
          generate referral links, and complete gasless quests.
        </p>
        <div className="cta">
          <ConnectButton />
        </div>
        <div className="features">
          <div className="feature">
            <div className="feature-icon">🔑</div>
            <h3>Passkey Authentication</h3>
            <p>Seedless, biometric login. No passwords, no extensions.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🎁</div>
            <h3>Gasless Transactions</h3>
            <p>Complete on-chain actions without SOL. Powered by paymaster.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>On-chain Tracking</h3>
            <p>Referrals tracked transparently on Solana Devnet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <LazorkitProvider
      rpcUrl={CONFIG.RPC_URL}
      portalUrl={CONFIG.PORTAL_URL}
      paymasterConfig={CONFIG.PAYMASTER}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/referral/:code" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </LazorkitProvider>
  )
}

export default App