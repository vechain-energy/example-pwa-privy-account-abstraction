import AuthenticatedPage from '@/components/authenticated-page'
import Section from '@/components/section'

const LoadAssets = () => {
	return (
		<AuthenticatedPage>
			<Section>
				<p className='text-md mt-2 font-bold uppercase text-gray-400'>
					Claim Testnet Faucet
				</p>
				<p className='mt-2 text-sm text-gray-300'>
					You can visit <a href="https://faucet.vecha.in" target='_blank' rel="noreferrer noopener">https://faucet.vecha.in</a> and claim free VET or VTHO for your developer wallet.
				</p>
				<p className='mt-2 text-sm text-gray-300'>
					Your Account Abstraction Wallet is a smart contract that can be instructed to interact on the users behalf. On the very first action, the contract is deployed.
				</p>
				<p className='mt-2 text-sm text-gray-300'>
					Only Privy has ownership and full access to the Account Abstraction Wallet.
				</p>
			</Section>
			<Section>
				<p className='text-md mt-2 font-bold uppercase text-gray-400'>
					How does it work
				</p>
				<p className='mt-2 text-sm text-gray-300'>
					<ul className='list-disc space-y-2 pl-4'>
						<li>Privy creates an embedded wallet that can be accessed through social logins.</li>
						<li>An account abstraction factory calculates the future account contract address using the embedded wallets address. This address is shown and used in the app.</li>
						<li>The embedded wallet signs transaction messages. These messages are verified and then executed in the account contract, originating from the account contracts address.</li>
						<li>The transaction is sent from a randomly generated account, and a delegation service pays the gas fees.</li>
						<li>The account contract is deployed during the first transaction, linking its ownership to the embedded wallets address.</li>
					</ul>
				</p>
			</Section>
		</AuthenticatedPage>
	)
}

export default LoadAssets
