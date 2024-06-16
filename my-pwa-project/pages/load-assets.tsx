import AuthenticatedPage from '@/components/authenticated-page'
import Section from '@/components/section'
import { useVechainAccount } from '@/lib/hooks/useVechainAccount'

const LoadAssets = () => {
	const { address } = useVechainAccount()

	return (
		<AuthenticatedPage>
			<Section>
				<p className='text-md mt-2 font-bold uppercase text-gray-400'>
					Claim Testnet Faucet
				</p>
				<p className='mt-2 text-sm text-gray-300'>
					You can visit https://faucet.vecha.in and claim free VET or VTHO for your developer wallet.
				</p>
				<p className='mt-2 text-sm text-gray-300'>
					Your Account Abstraction Wallet is a smart contract that can be instructed to interact on the users behalf. On the very first action, the contract is deployed.
				</p>
				<p className='mt-2 text-sm text-gray-300'>
					Only Privy has ownership and full access to the Account Abstraction Wallet.
				</p>
			</Section>
		</AuthenticatedPage>
	)
}

export default LoadAssets
