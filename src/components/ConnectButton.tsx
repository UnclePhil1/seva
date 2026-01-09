import { useWallet } from '@lazorkit/wallet'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export function ConnectButton() {
  const { connect, disconnect, isConnected, isConnecting, wallet } = useWallet()
  const navigate = useNavigate()

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard')
    }
  }, [isConnected, navigate])

  const handleConnect = async () => {
    try {
      await connect({ feeMode: 'paymaster' })
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
      <div className="connected-wallet">
        <div className="wallet-info">
          <span className="wallet-address">
            {wallet.smartWallet.slice(0, 6)}...{wallet.smartWallet.slice(-4)}
          </span>
          <button onClick={handleDisconnect} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <button 
      onClick={handleConnect} 
      disabled={isConnecting}
      className="connect-btn"
    >
      {isConnecting ? '🔐 Connecting...' : '🚀 Connect with Passkey'}
    </button>
  )
}