import { useWallet } from '@lazorkit/wallet'
import { useState } from 'react'
import { SystemProgram, PublicKey } from '@solana/web3.js'

export function TodoTask() {
  const { signAndSendTransaction, smartWalletPubkey, signMessage } = useWallet()
  const [isClaiming, setIsClaiming] = useState(false)
  const [badgeClaimed, setBadgeClaimed] = useState(false)

  const handleClaimBadge = async () => {
    if (!smartWalletPubkey) return
    
    setIsClaiming(true)
    try {
      // Option 1: Sign a message (gasless, free)
      const message = `Claim referral badge for wallet: ${smartWalletPubkey.toString()}`
      const { signature } = await signMessage(message)
      console.log('Message signed:', signature)

      // Option 2: Send a gasless transaction (sponsored by paymaster)
      // This simulates a real on-chain action
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: new PublicKey('badgeProgramAddress'), // Mock badge program
        lamports: 0 // Gasless
      })

      const txSignature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          feeToken: 'USDC',
          computeUnitLimit: 200_000,
          clusterSimulation: 'devnet'
        }
      })

      console.log('Badge claimed! TX:', txSignature)
      setBadgeClaimed(true)
      
      alert('🎉 Badge claimed successfully! Transaction was gasless.')
    } catch (error) {
      console.error('Failed to claim badge:', error)
      alert('Failed to claim badge. Check console for details.')
    } finally {
      setIsClaiming(false)
    }
  }

  const tasks = [
    { id: 1, title: 'Connect with Passkey', completed: true },
    { id: 2, title: 'Generate Referral Link', completed: true },
    { id: 3, title: 'Claim Welcome Badge', completed: badgeClaimed },
    { id: 4, title: 'Invite 3 Friends', completed: false },
    { id: 5, title: 'Complete First Quest', completed: false },
  ]

  return (
    <div className="todo-section">
      <h3>🎯 Complete Tasks, Earn Rewards</h3>
      <p className="section-description">
        Complete these tasks to earn points and badges. All transactions are gasless!
      </p>
      
      <div className="tasks-list">
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            <div className="task-checkbox">
              {task.completed ? '✅' : '◻️'}
            </div>
            <div className="task-content">
              <div className="task-title">{task.title}</div>
              {task.id === 3 && !task.completed && (
                <button 
                  onClick={handleClaimBadge}
                  disabled={isClaiming || !smartWalletPubkey}
                  className="claim-btn"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Badge (Gasless)'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="reward-info">
        <div className="reward-badge">
          <span className="badge-icon">🏆</span>
          <div>
            <h4>Welcome Badge</h4>
            <p>Claim this badge to earn 100 points. Transaction is completely gasless!</p>
          </div>
        </div>
        
        <div className="gasless-demo">
          <h4>🧪 Gasless Transaction Demo</h4>
          <p>
            This demo uses Lazorkit's paymaster to sponsor gas fees. 
            You don't need SOL in your wallet to complete actions!
          </p>
          <div className="demo-steps">
            <div className="step">1. User signs with passkey</div>
            <div className="step">2. Paymaster covers SOL fees</div>
            <div className="step">3. Transaction executes on-chain</div>
          </div>
        </div>
      </div>
    </div>
  )
}