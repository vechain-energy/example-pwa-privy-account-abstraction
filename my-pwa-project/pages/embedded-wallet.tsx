import AuthenticatedPage from '@/components/authenticated-page'
import Section from '@/components/section'
import { useState } from 'react'
import { isAddress, parseEther } from 'viem'
import { useVeChainAccount } from '@/lib/useVeChainAccount'
import Counter from '@/components/Counter'

const EmbeddedWallet = () => {
	const vechain = useVeChainAccount()

	// Transaction state
	const [recipientAddress, setRecipientAddress] = useState<string | undefined>()
	const [txHash, setTxHash] = useState<string | undefined>()
	const [txIsLoading, setTxIsLoading] = useState(false)


	const onTransfer = async () => {
		if (!vechain.address) return
		try {
			setTxIsLoading(true)
			const _txHash = await vechain.sendTransaction({
				to: recipientAddress as `0x${string}`,
				value: parseEther('0.004'),
			})
			setTxHash(_txHash)
		} catch (e) {
			console.error('Transfer failed with error ', e)
			setTxIsLoading(false)
		}
	}

	return (
		<AuthenticatedPage>
			<Section>
				<p className='text-md mt-2 font-bold uppercase text-gray-300'>
					Your VeChain Address
				</p>
				<textarea
					value={vechain.address}
					className='mt-4 h-12 w-full rounded-md bg-slate-700 p-4 font-mono text-xs text-slate-50 disabled:opacity-25'
					rows={1}
					readOnly
				/>
			</Section>
			<Counter />
			<Section>
				<p className='text-md mt-8 font-bold uppercase text-gray-300'>
					Transfer VET
				</p>
				<p className='mt-2 text-sm text-gray-400'>
					Transfer VET from your  wallet. Enter a valid recipient
					address to enable the button.
				</p>
				<p className='mt-2 text-sm text-gray-400'>
					Fund your wallet first:
				</p>
				<input
					type='text'
					id='recipient-address'
					placeholder='0x123...'
					autoComplete='off'
					onChange={(e: React.FormEvent<HTMLInputElement>) =>
						setRecipientAddress(e.currentTarget.value)
					}
					className='form-input mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3'
				/>
				<button
					type='button'
					className='mt-2 w-full rounded-md bg-orange-600 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-25'
					disabled={
						!recipientAddress || !isAddress(recipientAddress) || txIsLoading
					}
					onClick={onTransfer}
				>
					Transfer 0.004 VET
				</button>
				{txHash && (
					<p className='mt-2 text-sm italic text-gray-400'>
						See your transaction on{' '}
						<a
							className='underline'
							href={`https://explore-testnet.vechain.org/transactions/${txHash}`}
							target='_blank'
							rel='noreferrer noopener'
						>
							explorer
						</a>
						.
					</p>
				)}
			</Section>
			<Section>
				<p className='text-md mt-8 font-bold uppercase text-gray-300'>
					Export your private key
				</p>
				<p className='mt-2 text-sm text-gray-400'>
					Export your embedded wallet&apos;s private key to use in another
					wallet client.
				</p>
				<button
					type='button'
					className='mt-2 w-full rounded-md bg-orange-600 py-2 text-sm font-semibold text-white shadow-sm'
					onClick={vechain.exportWallet}
				>
					Export key
				</button>
			</Section>
		</AuthenticatedPage>
	)
}

export default EmbeddedWallet
