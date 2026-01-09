import { useWallet } from '@lazorkit/wallet'
import { ReferralLink } from './ReferralLink'
import { TodoTask } from './TodoTask'
import { ConnectButton } from './ConnectButton'

export function Dashboard() {
  const { wallet } = useWallet()

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📊 Referral Dashboard</h1>
        <ConnectButton />
      </header>

      <div className="dashboard-content">
        <div className="user-info">
          <div className="avatar">
            {wallet?.accountName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2>Welcome, {wallet?.accountName || 'User'}!</h2>
            <p className="wallet-address">
              Smart Wallet: {wallet?.smartWallet.slice(0, 12)}...
            </p>
          </div>
        </div>

        <div className="dashboard-section">
          <ReferralLink />
        </div>

        <div className="dashboard-section">
          <TodoTask />
        </div>
      </div>
    </div>
  )
}