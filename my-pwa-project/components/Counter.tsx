import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { } from '@heroicons/react/24/outline'
import type { FunctionFragment } from '@vechain/sdk-core';
import { useVeChainAccount } from '@/lib/useVeChainAccount'
import Section from '@/components/section'
import dynamic from "next/dynamic";
const AnimatedNumbers = dynamic(() => import("react-animated-numbers"), {
    ssr: false,
});

export default function Counter() {
    const { sendTransaction, thor, address } = useVeChainAccount()
    const [txIsLoading, setTxIsLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const showModal = () => setOpen(true)
    const hideModal = () => setOpen(false)

    /**
     * update the current counter value
     */
    const [counter, setCounter] = useState(BigInt(0))
    const updateCounter = useCallback(async (txHash?: string) => {
        if (!thor) { return }
        const counter = await thor.contracts.executeCall("0x8384738C995D49C5b692560ae688fc8b51af1059", 'function counter() public view returns (uint256)' as unknown as FunctionFragment, [])
        setCounter(BigInt(counter[0]))
    }, [thor])
    useEffect(() => void updateCounter(), [updateCounter])

    /**
     * handle the increment by sending the transaction
     * and waiting for its success
     * then updating the counter
     */
    const handleIncrement = async () => {
        if (!address) return
        try {
            setTxIsLoading(true)
            const txId = await sendTransaction({
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
            await thor.transactions.waitForTransaction(txId, { intervalMs: 2000 })
        } catch (e) {
            console.error('Function call failed with error ', e)
        }
        finally {
            await updateCounter()
            hideModal()
            setTxIsLoading(false)
        }
    }


    return (
        <Section>
            <p className='text-md mt-8 font-bold uppercase text-gray-300'>
                Test Function
            </p>
            <p className='mt-2 text-sm text-gray-400'>
                Test a Function call by incrementing an on-chain-counter.
            </p>
            <p className='mt-2 text-sm text-gray-400 flex items-center space-x-1'>
                <span>Current Counter:</span>
                <AnimatedNumbers
                    includeComma
                    transitions={(index) => ({
                        type: "spring",
                        duration: index + 0.3,
                    })}
                    animateToNumber={Number(counter)}
                />
            </p>
            <button
                type='button'
                className='mt-2 w-full rounded-md bg-orange-600 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-25'
                disabled={
                    txIsLoading
                }
                onClick={showModal}
            >
                Increment
            </button>
            <Transition show={open}>
                <Dialog className="relative z-10" onClose={setOpen}>
                    <TransitionChild
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </TransitionChild>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <TransitionChild
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-zinc-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div>
                                        <div className="text-center">
                                            <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-200">
                                                Increment the Counter?
                                            </DialogTitle>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-400">
                                                    When you confirm, a transaction is sent to the blockchain in the background. You will experience a loading animation while the transaction is pending.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:col-start-2 disabled:opacity-60"
                                            onClick={handleIncrement}
                                            disabled={txIsLoading}
                                        >
                                            {txIsLoading
                                                ? <Loading />
                                                : "Yes, Increment"
                                            }
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                            onClick={hideModal}
                                            data-autofocus
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </Section>
    )
}


function Loading() {
    return (
        <div role="status" className='flex items-center space-x-2'>
            <svg className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-orange-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span>Pending..</span>
        </div>

    )
}