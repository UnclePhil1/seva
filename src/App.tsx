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

// Store referral counts in localStorage for demo
const getReferralCount = (walletAddress: string): number => {
  try {
    const counts = JSON.parse(localStorage.getItem('referralCounts') || '{}')
    return counts[walletAddress] || 0
  } catch {
    return 0
  }
}

const incrementReferralCount = (walletAddress: string) => {
  try {
    const counts = JSON.parse(localStorage.getItem('referralCounts') || '{}')
    counts[walletAddress] = (counts[walletAddress] || 0) + 1
    localStorage.setItem('referralCounts', JSON.stringify(counts))
    return counts[walletAddress]
  } catch {
    return 0
  }
}

// Connect Button Component
function ConnectButton() {
  const { connect, disconnect, isConnected, wallet } = useWallet()
  const navigate = useNavigate()
  
  const handleConnect = async () => {
    try {
      await connect({ feeMode: 'paymaster' })
      navigate('/dashboard')
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }
  
  const handleDisconnect = async () => {
    await disconnect()
    navigate('/')
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
  
  // Track referral visit
  useEffect(() => {
    if (refCode) {
      // Store the referrer code for when user signs up
      localStorage.setItem('referrer', refCode)
      console.log(`Referral visit from: ${refCode}`)
    }
  }, [refCode])
  
  useEffect(() => {
    if (isConnected) {
      // Get referrer from localStorage
      const referrer = localStorage.getItem('referrer')
      if (referrer && referrer.startsWith('ref_')) {
        // Extract wallet address from ref_abc123def format
        const referrerWallet = referrer.replace('ref_', '')
        
        // In a real app, you'd send this to your backend/on-chain
        console.log(`User connected via referral from: ${referrerWallet}`)
        
        // Increment referral count for the referrer
        incrementReferralCount(referrerWallet)
        
        // Clear the referrer after processing
        localStorage.removeItem('referrer')
      }
      
      navigate('/dashboard')
    }
  }, [isConnected, navigate])
  
  const handleJoin = async () => {
    try {
      await connect({ feeMode: 'paymaster' })
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
  const { wallet, disconnect, signMessage } = useWallet()
  const [copied, setCopied] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const navigate = useNavigate()
  
  // Load referral count from localStorage
  useEffect(() => {
    if (wallet) {
      const count = getReferralCount(wallet.smartWallet)
      setReferralCount(count)
    }
  }, [wallet])
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!wallet) {
      navigate('/')
    }
  }, [wallet, navigate])
  
  // Generate referral link with HashRouter format
  const referralCode = wallet ? `ref_${wallet.smartWallet.slice(0, 8)}` : ''
  const referralLink = `${window.location.origin}/#/ref/${referralCode}`
  
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const claimBadge = async () => {
    if (!wallet || loading) return
    
    setLoading(true)
    try {
      // Fixed: Call signMessage directly from the hook
      const message = `Claim Welcome Badge for wallet: ${wallet.smartWallet} at ${Date.now()}`
      console.log('Signing message:', message)
      
      const result = await signMessage(message)
      console.log('Signature received:', result.signature)
      
      setClaimed(true)
      alert('✅ Badge claimed successfully!\nSignature: ' + result.signature.slice(0, 20) + '...')
    } catch (error: any) {
      console.error('Failed to claim badge:', error)
      
      if (error.message?.includes('WebAuthn') || error.message?.includes('TLS')) {
        alert('❌ WebAuthn requires HTTPS. Make sure you are using HTTPS for this demo.')
      } else {
        alert(`Failed to claim badge: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }
  
  const handleDisconnect = async () => {
    await disconnect()
    navigate('/')
  }
  
  if (!wallet) return null
  
  // Calculate points (10 points per referral)
  const points = referralCount * 10
  
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
        <p className="help-text">Share this link with friends. When they join, your count increases!</p>
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
        
        <div className="referral-stats">
          <div className="stat">
            <span className="stat-number">{referralCount}</span>
            <span className="stat-label">Referrals</span>
          </div>
          <div className="stat">
            <span className="stat-number">{points}</span>
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
            {loading ? 'Signing...' : claimed ? '✅ Claimed' : '🖋️ Sign Message (Gasless)'}
          </button>
          <p className="task-note">Signs a message with your passkey. No SOL required.</p>
        </div>
      </div>
    </div>
  )
}

// Main App with HashRouter
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