import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePrivy, useWallets, type ConnectedWallet } from '@privy-io/react-auth'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { encodeFunctionData } from 'viem'
import type { Abi } from 'viem/_types'
import { clauseBuilder, FunctionFragment } from '@vechain/sdk-core'
import { ThorClient, VeChainProvider, ProviderInternalBaseWallet, signerUtils } from '@vechain/sdk-network'

interface VechainAccountContextType {
    address: string | undefined;
    embeddedWallet: ConnectedWallet | undefined;
    sendTransaction: (tx: { to?: string; value?: string | number | bigint; data?: string | { abi: Abi[] | readonly unknown[]; functionName: string; args: any[] } }) => Promise<string>;
    exportWallet: () => Promise<void>;
    thor: ThorClient;
}

const randomTransactionUser = (() => {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    return {
        privateKey,
        account,
        address: account.address
    }
})()

const VechainAccountContext = createContext<VechainAccountContextType | null>(null)

export const VechainAccountProvider = ({ children, nodeUrl, delegatorUrl, accountFactory }: { children: React.ReactNode, nodeUrl: string, delegatorUrl: string, accountFactory: string }) => {
    const { signTypedData, exportWallet } = usePrivy()
    const { wallets } = useWallets()
    const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy')
    const [address, setAddress] = useState<string | undefined>()
    const thor = ThorClient.fromUrl(nodeUrl)

    useEffect(() => {
        if (!embeddedWallet) { return }
        void (async () => {
            const accountAddress = await thor.contracts.executeCall(accountFactory, 'function getAddress(address owner,uint256 salt) public view returns (address)' as unknown as FunctionFragment, [embeddedWallet.address, BigInt(embeddedWallet.address)])
            setAddress(String(accountAddress[0]))
        })()
    }, [embeddedWallet, thor, accountFactory])

    useEffect(() => {
        if (!embeddedWallet) {
            setAddress(undefined)
        }
    }, [embeddedWallet])

    const sendTransaction = async ({ data: funcData, ...message }: { to?: string, value?: number | string | bigint, data?: string | { abi: Abi[] | readonly unknown[], functionName: string, args: any[] } }): Promise<string> => {
        if (!address || !embeddedWallet) {
            throw new Error('Address or embedded wallet is missing');
        }

        const data = {
            domain: {
                name: 'Wallet',
                version: '1',
                chainId: "1176455790972829965191905223412607679856028701100105089447013101863" as unknown as number,
                verifyingContract: address
            },
            types: {
                ExecuteWithAuthorization: [
                    { name: "to", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "data", type: "bytes" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" }
                ],
            },
            primaryType: "ExecuteWithAuthorization",
            message: {
                validAfter: 0,
                validBefore: Math.floor(Date.now() / 1000) + 3600, // Valid for an hour
                value: 0,
                data: typeof (funcData) === 'object' && 'abi' in funcData ? encodeFunctionData(funcData) : funcData ?? '0x',
                ...message,
            },
        }

        const description = typeof (funcData) === 'object' && 'functionName' in funcData ? funcData.functionName : ' '
        const signature = await signTypedData(data, {
            title: 'Sign Transaction',
            description,
            buttonText: 'Sign'
        })

        const clauses = []
        const { hasCode: isDeployed } = await thor.accounts.getAccount(address)
        if (!isDeployed) {
            clauses.push(clauseBuilder.functionInteraction(
                accountFactory,
                'function createAccount(address owner,uint256 salt)' as unknown as FunctionFragment,
                [
                    embeddedWallet.address,
                    BigInt(embeddedWallet.address)
                ]
            ))
        }

        clauses.push(clauseBuilder.functionInteraction(
            address,
            'function executeWithAuthorization(address to, uint256 value, bytes calldata data, uint256 validAfter, uint256 validBefore, bytes calldata signature)' as unknown as FunctionFragment,
            [
                data.message.to as `0x${string}`,
                BigInt(data.message.value),
                data.message.data as `0x${string}`,
                BigInt(data.message.validAfter),
                BigInt(data.message.validBefore),
                signature as `0x${string}`
            ]
        ))
        const gasResult = await thor.gas.estimateGas(clauses)

        // build a transaction
        const txBody = await thor.transactions.buildTransactionBody(
            clauses,
            gasResult.totalGas,
            { isDelegated: true, }
        )

        // sign the transaction
        const wallet = new ProviderInternalBaseWallet(
            [{ privateKey: Buffer.from(randomTransactionUser.privateKey.slice(2), 'hex'), address: randomTransactionUser.address }],
            {
                delegator: {
                    delegatorUrl
                },
            }
        )

        // Create the provider (used in this case to sign the transaction with getSigner() method)
        const providerWithDelegationEnabled = new VeChainProvider(thor, wallet, true)
        const signer = await providerWithDelegationEnabled.getSigner(randomTransactionUser.address)
        const txInput = signerUtils.transactionBodyToTransactionRequestInput(txBody, randomTransactionUser.address)
        const rawDelegateSigned = await signer!.signTransaction(txInput)

        const { id } = await fetch(`${nodeUrl}/transactions`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                raw: rawDelegateSigned
            })
        }).then(res => res.json()) as { id: string }

        return id
    }

    return (
        <VechainAccountContext.Provider value={{ address, embeddedWallet, sendTransaction, exportWallet, thor }}>
            {children}
        </VechainAccountContext.Provider>
    )
}

export const useVechainAccount = () => {
    const context = useContext(VechainAccountContext)
    if (!context) {
        throw new Error('useVechainAccount must be used within a VechainAccountProvider')
    }
    return context
}
