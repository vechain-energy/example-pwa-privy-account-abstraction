import type { AppProps } from 'next/app'
import Meta from '@/components/meta'
import '@/styles/globals.css'
import { PrivyProvider } from '@privy-io/react-auth'
import { VeChainAccountProvider } from '../lib/useVeChainAccount'

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
			<VeChainAccountProvider
				nodeUrl={process.env.NEXT_PUBLIC_NODE_URL as string}
				delegatorUrl={process.env.NEXT_PUBLIC_DELEGATOR_URL as string}
				accountFactory={process.env.NEXT_PUBLIC_AA_FACTORY as string}
			>
				<Component {...pageProps} />
			</VeChainAccountProvider>
		</PrivyProvider>
	)
}

export default App
