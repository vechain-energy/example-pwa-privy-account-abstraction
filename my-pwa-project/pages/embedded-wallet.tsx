import AuthenticatedPage from '@/components/authenticated-page'
import Section from '@/components/section'
import { links } from '@/lib/links'
import { useState, useEffect, useCallback } from 'react'
import { isAddress } from 'viem'
import { useVechainAccount } from '../lib/hooks/useAccount'
import type { FunctionFragment } from '@vechain/sdk-core';

const EmbeddedWallet = () => {
	const { address, embeddedWallet, sendTransaction, exportWallet, thor } = useVechainAccount()

	// Transaction state
	const [recipientAddress, setRecipientAddress] = useState<string | undefined>()
	const [txHash, setTxHash] = useState<string | undefined>()
	const [txIsLoading, setTxIsLoading] = useState(false)


	const onTransfer = async () => {
		if (!address) return
		try {

			// Send transaction using the viem wallet client. Alternatively, you
			// may use Privy's `sendTransaction` method. This is just an example
			// of the many ways to send a transaction from the wallet.
			setTxIsLoading(true)
			const _txHash = await sendTransaction({
				to: recipientAddress as `0x${string}`,
				value: BigInt(1 * 1e18).toString()
			})
			setTxHash(_txHash)
		} catch (e) {
			console.error('Transfer failed with error ', e)
		}
		setTxIsLoading(false)
	}


	const onFunction = async () => {
		if (!address) return
		try {

			// Send transaction using the viem wallet client. Alternatively, you
			// may use Privy's `sendTransaction` method. This is just an example
			// of the many ways to send a transaction from the wallet.
			setTxIsLoading(true)
			const _txHash = await sendTransaction({
				to: '0x8384738C995D49C5b692560ae688fc8b51af1059',
				value: 0,
				data: {
					abi: [{
						"inputs": [],
						"name": "increment",
						"outputs": [],
						"type": "function"
					}],
					functionName: "increment",
					args: []
				},
			})
			setTxHash(_txHash)
		} catch (e) {
			console.error('Function call failed with error ', e)
		}
		setTxIsLoading(false)
	}

	const updateCounter = useCallback(async (txHash?: string) => {
		if (!thor) { return }
		if (txHash) {
			await thor.transactions.waitForTransaction(txHash)
		}
		const counter = await thor.contracts.executeCall("0x8384738C995D49C5b692560ae688fc8b51af1059", 'function counter() public view returns (uint256)' as unknown as FunctionFragment, [])
		setCounter(BigInt(counter[0]))
	}, [thor])

	const [counter, setCounter] = useState(BigInt(0))
	useEffect(() => {
		void updateCounter(txHash)
	}, [updateCounter, txHash])

	return (
		<AuthenticatedPage>
			<Section>
				<p className='mt-2 text-sm text-gray-600'>
					Your On-Chain Wallet address: {address}
				</p>
				<p className='mt-2 text-sm text-gray-600'>
					Your Privy internal (owner) address: {embeddedWallet?.address}
				</p>
			</Section>
			<Section>
				<p className='text-md mt-8 font-bold uppercase text-gray-700'>
					Test Function
				</p>
				<p className='mt-2 text-sm text-gray-600'>
					Test a Function call by incrementing an on-chain-counter.
				</p>
				<p className='mt-2 text-sm text-gray-600'>
					Current Counter: {String(counter)}
				</p>
				<button
					type='button'
					className='mt-2 w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white shadow-sm disabled:bg-indigo-400'
					disabled={
						txIsLoading
					}
					onClick={onFunction}
				>
					Increment
				</button>
				{txHash && (
					<p className='mt-2 text-sm italic text-gray-600'>
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
				<p className='text-md mt-8 font-bold uppercase text-gray-700'>
					Transfer VET
				</p>
				<p className='mt-2 text-sm text-gray-600'>
					Transfer VET from your  wallet. Enter a valid recipient
					address to enable the button.
				</p>
				<p className='mt-2 text-sm text-gray-600'>
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
					className='mt-2 w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white shadow-sm disabled:bg-indigo-400'
					disabled={
						!recipientAddress || !isAddress(recipientAddress) || txIsLoading
					}
					onClick={onTransfer}
				>
					Transfer 1 VET
				</button>
				{txHash && (
					<p className='mt-2 text-sm italic text-gray-600'>
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
				<p className='text-md mt-8 font-bold uppercase text-gray-700'>
					Export your private key
				</p>
				<p className='mt-2 text-sm text-gray-600'>
					Export your embedded wallet&apos;s private key to use in another
					wallet client.
				</p>
				<button
					type='button'
					className='mt-2 w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white shadow-sm'
					onClick={exportWallet}
				>
					Export key
				</button>
			</Section>
			<Section>
				<p className='text-md mt-8 font-bold uppercase text-gray-700'>
					Learn more
				</p>
				<p className='mt-2 text-sm text-gray-600'>
					Read our{' '}
					<a
						className='underline'
						href={links.docs.embeddedWallets}
						target='_blank'
						rel='noreferrer noopener'
					>
						docs
					</a>{' '}
					to learn more about using embedded wallets in your app.
				</p>
			</Section>
		</AuthenticatedPage>
	)
}

export default EmbeddedWallet