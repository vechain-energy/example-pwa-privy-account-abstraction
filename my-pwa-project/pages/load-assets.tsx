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
					You can visit https://faucet.vecha.in and claim free VET or VTHO to your developer wallet.
				</p>
			</Section>
		</AuthenticatedPage>
	)
}

export default LoadAssets
