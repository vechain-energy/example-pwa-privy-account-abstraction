import AuthenticatedPage from '@/components/authenticated-page'
import Section from '@/components/section'
import { usePrivy } from '@privy-io/react-auth'
import { links } from '@/lib/links'
import { useVechainAccount } from '@/lib/hooks/useVechainAccount'

const Dashboard = () => {
	// You can also import other linking methods, like linkWallet, linkEmail, linkDiscord, etc.
	const { user, linkGithub, linkGoogle } = usePrivy()
	const { thor: _thor, sendTransaction: _sendTransaction, exportWallet: _exportWallet, ...vechainData } = useVechainAccount()

	return (
		<AuthenticatedPage>
			<Section>
				<p className='text-md mt-2 font-bold uppercase text-gray-300'>
					Your Vechain Account Abstraction
				</p>
				<p className='mt-2 text-sm text-gray-400'>
					You will be interacting with dApps using this address, while fees are paid by the delegatorUrl.
				</p>
				<textarea
					value={JSON.stringify(vechainData, null, 2)}
					className='mt-4 h-64 w-full rounded-md bg-slate-700 p-4 font-mono text-xs text-slate-50 disabled:opacity-25'
					rows={JSON.stringify(vechainData, null, 2).split('\n').length}
					readOnly
				/>
			</Section>
			<Section>
				<p className='text-md mt-2 font-bold uppercase text-gray-300'>
					Your Privy User Object
				</p>
				<p className='mt-2 text-sm text-gray-400'>
					Inspect your linked accounts, or{' '}
					<a
						href={links.docs.userObject}
						className='underline'
						target='_blank'
						rel='noreferrer noopener'
					>
						learn more
					</a>
					.
				</p>
				<textarea
					value={JSON.stringify(user, null, 2)}
					className='mt-4 h-64 w-full rounded-md bg-slate-700 p-4 font-mono text-xs text-slate-50 disabled:opacity-25'
					rows={JSON.stringify(user, null, 2).split('\n').length}
					readOnly
				/>
			</Section>
			<Section>
				<p className='text-md mt-8 font-bold uppercase text-gray-300'>
					Account Linking
				</p>
				<p className='mt-2 text-sm text-gray-400'>
					Link additional login methods, or{' '}
					<a
						href={links.docs.linking}
						className='underline'
						target='_blank'
						rel='noreferrer noopener'
					>
						learn more
					</a>
					.
				</p>
				<div className='flex flex-row gap-2'>
					<button
						className='my-4 w-1/3 rounded-md bg-orange-600 px-2 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-25'
						onClick={linkGoogle}
						disabled={!!user?.google}
					>
						Google
					</button>
					<button
						className='my-4 w-1/3 rounded-md bg-orange-600 px-2 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-25'
						onClick={linkGithub}
						disabled={!!user?.github}
					>
						GitHub
					</button>
				</div>
			</Section>
		</AuthenticatedPage>
	)
}

export default Dashboard
