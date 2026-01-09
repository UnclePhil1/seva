import { useWallet } from '@lazorkit/wallet'
import { useState } from 'react'
import { SystemProgram, PublicKey } from '@solana/web3.js'

export function ReferralLink() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet()
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Generate a unique referral code from wallet address
  const referralCode = smartWalletPubkey 
    ? `lazorkit_${smartWalletPubkey.toString().slice(0, 8)}`
    : 'connect-wallet-first'

  const referralLink = `${window.location.origin}/referral/${referralCode}`

  const handleGenerateReferral = async () => {
    if (!smartWalletPubkey) return
    
    setIsGenerating(true)
    try {
      // This is a mock transaction that would normally create a referral PDA
      // In a real implementation, you'd call your referral program
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: new PublicKey('referralProgramAddress'), // Mock
        lamports: 0 // Gasless transaction
      })

      // Sign and send the transaction (gasless via paymaster)
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          feeToken: 'USDC',
          computeUnitLimit: 100_000
        }
      })

      console.log('Referral link generated on-chain:', signature)
      
      // Mock: In a real app, this would update your contract state
      alert('✅ Referral link activated on-chain!')
    } catch (error) {
      console.error('Failed to generate referral:', error)
      alert('Failed to generate referral. Check console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    alert('📋 Link copied to clipboard!')
  }

  return (
    <div className="referral-section">
      <h3>🔗 Your Referral Link</h3>
      <p className="section-description">
        Share this link to invite friends. You earn points when they complete quests!
      </p>
      
      <div className="referral-link-container">
        <div className="referral-link-box">
          <code className="referral-link">{referralLink}</code>
          <button onClick={copyToClipboard} className="copy-btn">
            📋 Copy
          </button>
        </div>
        
        <div className="referral-actions">
          <button 
            onClick={handleGenerateReferral}
            disabled={isGenerating || !smartWalletPubkey}
            className="generate-btn"
          >
            {isGenerating ? 'Activating on-chain...' : '🚀 Activate On-chain'}
          </button>
          
          <div className="referral-stats">
            <span>👥 12 people joined via your link</span>
            <span>⭐ 450 points earned</span>
          </div>
        </div>
      </div>
    </div>
  )
}