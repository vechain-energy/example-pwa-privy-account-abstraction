import type { AppProps } from 'next/app'
import Meta from '@/components/meta'
import '@/styles/globals.css'
import { PrivyProvider } from '@privy-io/react-auth'
import { VechainAccountProvider } from '../lib/hooks/useAccount'

const App = ({ Component, pageProps }: AppProps) => {
	return (
		<PrivyProvider
			appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
			config={{
				loginMethods: ['google', 'twitter', 'github'],
				embeddedWallets: {
					createOnLogin: 'all-users',
				}
			}}
		>
			<Meta />
			<VechainAccountProvider
				nodeUrl={process.env.NEXT_PUBLIC_NODE_URL ?? ''}
				delegatorUrl="https://sponsor-testnet.vechain.energy/by/90"
				accountFactory={process.env.NEXT_PUBLIC_AA_FACTORY ?? ''}
			>
				<Component {...pageProps} />
			</VechainAccountProvider>
		</PrivyProvider>
	)
}

export default App
