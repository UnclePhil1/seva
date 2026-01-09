import { LazorkitProvider, useWallet } from '@lazorkit/wallet'
import { HashRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'

const CONFIG = {
  RPC_URL: "https://api.devnet.solana.com",
  PORTAL_URL: "https://portal.lazor.sh",
  PAYMASTER: {
    paymasterUrl: "https://kora.devnet.lazorkit.com"
  }
}

// Connect Button Component
function ConnectButton() {
  const { connect, disconnect, isConnected, wallet } = useWallet()
  const navigate = useNavigate()
  
  const handleConnect = async () => {
    try {
      await connect({ feeMode: 'paymaster' })
      navigate('/dashboard') // Navigate to dashboard after connecting
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }
  
  const handleDisconnect = async () => {
    await disconnect()
    navigate('/') // Navigate to home after disconnecting
  }
  
  if (isConnected && wallet) {
    return (
      <div className="connected">
        <span>Wallet: {wallet.smartWallet.slice(0, 6)}...</span>
        <button onClick={handleDisconnect} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    )
  }
  
  return (
    <button onClick={handleConnect} className="connect-btn">
      🔐 Login with Passkey
    </button>
  )
}

// Home Page (Login Page)
function HomePage() {
  const { isConnected } = useWallet()
  const navigate = useNavigate()
  
  // If already connected, redirect to dashboard
  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard')
    }
  }, [isConnected, navigate])
  
  return (
    <div className="home">
      <header>
        <h1>🎯 Simple Lazorkit Demo</h1>
        <ConnectButton />
      </header>
      
      <div className="hero">
        <h2>Experience Passwordless Solana</h2>
        <p>Login with passkey, generate referral links, earn rewards</p>
        <div className="cta-container">
          <ConnectButton />
        </div>
      </div>
      
      <div className="features">
        <div className="feature">
          <div>🔑</div>
          <h3>Passkey Auth</h3>
          <p>Biometric login, no passwords</p>
        </div>
        <div className="feature">
          <div>🔗</div>
          <h3>Referral System</h3>
          <p>Share links, track on-chain</p>
        </div>
        <div className="feature">
          <div>⛽</div>
          <h3>Gasless</h3>
          <p>No SOL needed</p>
        </div>
      </div>
    </div>
  )
}

// Referral Landing Page (when someone clicks referral link)
function ReferralLanding() {
  const { refCode } = useParams<{ refCode: string }>()
  const navigate = useNavigate()
  const { connect, isConnected } = useWallet()
  
  // If already connected, redirect to dashboard
  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard')
    }
  }, [isConnected, navigate])
  
  const handleJoin = async () => {
    try {
      await connect({ feeMode: 'paymaster' })
      navigate('/dashboard')
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }
  
  return (
    <div className="referral-landing">
      <header>
        <h1>🎯 Simple Lazorkit Demo</h1>
        <ConnectButton />
      </header>
      
      <div className="referral-content">
        <h1>🎁 You're invited!</h1>
        <p>You were referred by: <strong>{refCode}</strong></p>
        
        <div className="referral-info">
          <p>Join using passkey authentication (no seed phrases!)</p>
          <button onClick={handleJoin} className="join-btn">
            Accept Invitation & Join
          </button>
        </div>
        
        <div className="referral-benefits">
          <h3>Benefits:</h3>
          <ul>
            <li>✅ No seed phrases - login with fingerprint/face ID</li>
            <li>✅ Gasless transactions - no SOL needed</li>
            <li>✅ Referral rewards for both you and your friend</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Dashboard Page
function Dashboard() {
  const { wallet, disconnect } = useWallet()
  const [copied, setCopied] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!wallet) {
      navigate('/')
    }
  }, [wallet, navigate])
  
  // Generate referral link
  const referralCode = wallet ? `ref_${wallet.smartWallet.slice(0, 8)}` : ''
  const referralLink = `${window.location.origin}/ref/${referralCode}`
  
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const claimBadge = async () => {
    if (!wallet) return
    
    setLoading(true)
    try {
      const { signMessage } = useWallet()
      await signMessage(`Claim badge: ${Date.now()}`)
      setClaimed(true)
      alert('✅ Badge claimed successfully!')
    } catch (error) {
      console.error('Failed:', error)
      alert('Failed to claim badge. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDisconnect = async () => {
    await disconnect()
    navigate('/') // Navigate to home after disconnecting
  }
  
  if (!wallet) {
    return null // Will redirect in useEffect
  }
  
  return (
    <div className="dashboard">
      <header>
        <h1>📊 Your Dashboard</h1>
        <div className="header-actions">
          <button onClick={handleDisconnect} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      </header>
      
      <div className="user-card">
        <div className="avatar">
          {wallet?.accountName?.charAt(0) || 'U'}
        </div>
        <div>
          <h2>Welcome back!</h2>
          <p className="wallet-address">
            {wallet?.smartWallet.slice(0, 12)}...
          </p>
        </div>
      </div>
      
      <div className="referral-section">
        <h3>📤 Your Referral Link</h3>
        <div className="link-box">
          <input 
            type="text" 
            value={referralLink} 
            readOnly 
            className="link-input"
          />
          <button onClick={copyLink} className="copy-btn">
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
        <p className="help-text">Share this link with friends to earn rewards</p>
        
        <div className="referral-stats">
          <div className="stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Referrals</span>
          </div>
          <div className="stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Points</span>
          </div>
        </div>
      </div>
      
      <div className="task-section">
        <h3>✅ Complete Tasks</h3>
        <div className="task">
          <div className="task-header">
            <span>Claim Welcome Badge</span>
            <span className="task-status">
              {claimed ? '✅ Completed' : '❌ Pending'}
            </span>
          </div>
          <button 
            onClick={claimBadge} 
            disabled={claimed || loading}
            className="task-btn"
          >
            {loading ? 'Claiming...' : claimed ? 'Claimed' : 'Claim Badge (Gasless)'}
          </button>
          <p className="task-note">Sign a message to claim your badge</p>
        </div>
      </div>
    </div>
  )
}

// Main App with Router
function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ref/:refCode" element={<ReferralLanding />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default function App() {
  return (
    <LazorkitProvider
      rpcUrl={CONFIG.RPC_URL}
      portalUrl={CONFIG.PORTAL_URL}
      paymasterConfig={CONFIG.PAYMASTER}
    >
      <AppContent />
    </LazorkitProvider>
  )
}