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

// Simple referral tracking system using localStorage
interface ReferralData {
  // Store which wallet referred which new users
  referrals: Record<string, string[]>; // referrerWallet -> array of referred wallet addresses
  // Store which referrer a user came from
  referrers: Record<string, string>; // userWallet -> referrerWallet
}

const getReferralData = (): ReferralData => {
  try {
    const data = localStorage.getItem('referralData')
    return data ? JSON.parse(data) : { referrals: {}, referrers: {} }
  } catch {
    return { referrals: {}, referrers: {} }
  }
}

const saveReferralData = (data: ReferralData) => {
  localStorage.setItem('referralData', JSON.stringify(data))
}

const trackReferral = (referrerWallet: string, newUserWallet: string) => {
  const data = getReferralData()
  
  // Track which referrer this user came from
  data.referrers[newUserWallet] = referrerWallet
  
  // Add this user to the referrer's list
  if (!data.referrals[referrerWallet]) {
    data.referrals[referrerWallet] = []
  }
  
  // Only add if not already tracked (prevent duplicates)
  if (!data.referrals[referrerWallet].includes(newUserWallet)) {
    data.referrals[referrerWallet].push(newUserWallet)
  }
  
  saveReferralData(data)
  console.log(`Tracked referral: ${referrerWallet} -> ${newUserWallet}`)
}

const getReferralCount = (walletAddress: string): number => {
  const data = getReferralData()
  return data.referrals[walletAddress]?.length || 0
}

const getReferrer = (walletAddress: string): string | null => {
  const data = getReferralData()
  return data.referrers[walletAddress] || null
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
  
  // Store the referrer code when page loads
  useEffect(() => {
    if (refCode && refCode.startsWith('ref_')) {
      // Store the referrer code in sessionStorage (clears when tab closes)
      sessionStorage.setItem('pendingReferrer', refCode)
      console.log(`Set pending referrer: ${refCode}`)
    }
  }, [refCode])
  
  // When user connects, track the referral
  useEffect(() => {
    const trackReferralOnConnect = async () => {
      if (isConnected) {
        const pendingReferrer = sessionStorage.getItem('pendingReferrer')
        
        if (pendingReferrer && pendingReferrer.startsWith('ref_')) {
          // Extract the referrer's wallet address from ref_abc123def format
          const referrerWallet = pendingReferrer.replace('ref_', '')
          
          // Get current user's wallet
          const { wallet } = useWallet()
          if (wallet) {
            // Track the referral
            trackReferral(referrerWallet, wallet.smartWallet)
            
            // Clear the pending referrer
            sessionStorage.removeItem('pendingReferrer')
            console.log(`Tracked referral from ${referrerWallet} to ${wallet.smartWallet}`)
          }
        }
        
        navigate('/dashboard')
      }
    }
    
    trackReferralOnConnect()
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
        
        <div className="referral-debug">
          <p><small>Debug: Referral code stored: {sessionStorage.getItem('pendingReferrer') || 'none'}</small></p>
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
  const [referredBy, setReferredBy] = useState<string | null>(null)
  const navigate = useNavigate()
  
  // Load referral data
  useEffect(() => {
    if (wallet) {
      const count = getReferralCount(wallet.smartWallet)
      setReferralCount(count)
      
      const referrer = getReferrer(wallet.smartWallet)
      setReferredBy(referrer)
      
      console.log(`Wallet ${wallet.smartWallet} has ${count} referrals`)
      console.log(`Referred by: ${referrer || 'No one'}`)
    }
  }, [wallet])
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!wallet) {
      navigate('/')
    }
  }, [wallet, navigate])
  
  // Generate referral link
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
      const message = `Claim Welcome Badge for wallet: ${wallet.smartWallet} at ${Date.now()}`
      console.log('Signing message:', message)
      
      const result = await signMessage(message)
      console.log('Signature received:', result.signature)
      
      setClaimed(true)
      alert('✅ Badge claimed successfully!\nSignature: ' + result.signature.slice(0, 20) + '...')
    } catch (error: any) {
      console.error('Failed to claim badge:', error)
      alert(`Failed to claim badge: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDisconnect = async () => {
    await disconnect()
    navigate('/')
  }
  
  // const handleTestReferral = () => {
  //   // Create a test referral (for demo purposes)
  //   if (wallet) {
  //     const testWallet = 'test_wallet_' + Date.now()
  //     trackReferral(wallet.smartWallet, testWallet)
  //     setReferralCount(prev => prev + 1)
  //     alert('✅ Test referral added! Refresh to see actual referrals from links.')
  //   }
  // }
  
  // const handleResetData = () => {
  //   if (window.confirm('Reset all referral data? This cannot be undone.')) {
  //     localStorage.removeItem('referralData')
  //     setReferralCount(0)
  //     setReferredBy(null)
  //     alert('Referral data reset!')
  //   }
  // }
  
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
          {referredBy && (
            <p className="referred-by">
              👥 Referred by: {referredBy.slice(0, 8)}...
            </p>
          )}
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
          <div className="stat">
            <span className="stat-number">{referredBy ? 'Yes' : 'No'}</span>
            <span className="stat-label">Referred</span>
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