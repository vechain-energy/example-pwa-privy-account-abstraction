import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePrivy, useWallets, type ConnectedWallet } from '@privy-io/react-auth'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { encodeFunctionData } from 'viem'
import type { Abi } from 'viem/_types'
import { clauseBuilder, FunctionFragment } from '@vechain/sdk-core'
import { ThorClient, VeChainProvider, ProviderInternalBaseWallet, signerUtils } from '@vechain/sdk-network'

interface VeChainAccountContextType {
    address: string | undefined;
    embeddedWallet: ConnectedWallet | undefined;
    sendTransaction: (tx: { to?: string; value?: string | number | bigint; data?: string | { abi: Abi[] | readonly unknown[]; functionName: string; args: any[] } }) => Promise<string>;
    exportWallet: () => Promise<void>;
    thor: ThorClient;
    nodeUrl: string
    delegatorUrl: string
    accountFactory: string
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

const VechainAccountContext = createContext<VeChainAccountContextType | null>(null)

export const VeChainAccountProvider = ({ children, nodeUrl, delegatorUrl, accountFactory }: { children: React.ReactNode, nodeUrl: string, delegatorUrl: string, accountFactory: string }) => {
    const { signTypedData, exportWallet } = usePrivy()
    const { wallets } = useWallets()
    const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy')
    const [address, setAddress] = useState<string | undefined>()
    const thor = ThorClient.fromUrl(nodeUrl)

    /**
     * load the address of the account abstraction wallet identified by the embedded wallets address
     * it is the origin for on-chain-interaction with other parties
     * */
    useEffect(() => {
        if (!embeddedWallet) { return }

        thor.contracts.executeCall(
            accountFactory,
            'function getAddress(address owner, uint256 salt) public view returns (address)' as unknown as FunctionFragment,
            [embeddedWallet.address, BigInt(embeddedWallet.address)]
        )
            .then(accountAddress => setAddress(String(accountAddress[0])))
            .catch(() => {/* ignore */ })
    }, [embeddedWallet, thor, accountFactory])

    // reset address when embedded wallet vanishes
    useEffect(() => {
        if (!embeddedWallet) { setAddress(undefined) }
    }, [embeddedWallet])

    const sendTransaction = async ({
        to,
        value = 0,
        data: funcData = '0x',
        title = 'Sign Transaction',
        description,
        buttonText = 'Sign'
    }:
        {
            to?: string,
            value?: number | string | bigint,
            data?: string | {
                abi: Abi[] | readonly unknown[],
                functionName: string,
                args: any[]
            }
            validAfter?: number
            validBefore?: number,
            title?: string,
            description?: string,
            buttonText?: string
        }): Promise<string> => {

        if (!address || !embeddedWallet) {
            throw new Error('Address or embedded wallet is missing');
        }


        /**
         * identify the current chain from its genesis block
         */
        const genesis = await thor.blocks.getGenesisBlock()
        if (!genesis) { throw new Error('Unable to identify chainId') }
        const chainId = BigInt(genesis.id)


        // build the object to be signed, containing all information & instructions
        const data = {
            /**
             * the domain is configured in the contracts by this call:
             *  __EIP712_init("Wallet", "1") 
             */
            domain: {
                name: "Wallet",
                version: "1",
                chainId: String(chainId) as unknown as number,  // work around the viem limitation that chainId must be a number but its too big to be handled as such
                verifyingContract: address
            },

            // type definitions, can be multiples, can be put into a configurational scope
            types: {
                /**
                 * the ExecuteWithAuthorization is basically the function definition of 
                 */
                ExecuteWithAuthorization: [
                    { name: "to", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "data", type: "bytes" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" }
                ],
            },
            primaryType: "ExecuteWithAuthorization",

            /**
             * the message to sign, it is basically the instructions for an execute command
             * to, value and data are transaction relevant
             * validAfter & validBefore are good to limit authorization and will be checked with block.timestamp
             */
            message: {
                // valid by default right now, could also limit for future use
                validAfter: 0,

                // valid for an hour
                validBefore: Math.floor(Date.now() / 1000) + 3600,

                // the transaction instructions
                to,
                value: String(value),

                // decide if the data needs to be encoded first or can be passed directly
                data: typeof (funcData) === 'object' && 'abi' in funcData ? encodeFunctionData(funcData) : funcData,
            },
        }

        /**
         * request a signature using privy
         * the information is show to the user in a modal
         */
        const signature = await signTypedData(data, {
            title,
            description: description ?? (typeof (funcData) === 'object' && 'functionName' in funcData ? funcData.functionName : ' '),
            buttonText
        })

        /**
         * start building the clauses for the transaction
         */
        const clauses = []

        /**
         * if the account address has no code yet, its not been deployed/created yet
         * so we'll instructt the factory to create a wallet
         */
        const { hasCode: isDeployed } = await thor.accounts.getAccount(address)
        if (!isDeployed) {
            clauses.push(clauseBuilder.functionInteraction(
                accountFactory,
                'function createAccount(address owner,uint256 salt)' as unknown as FunctionFragment,

                // as identifier/salt we'll use the embedded wallets address, who will also be the owner
                [
                    embeddedWallet.address,
                    BigInt(embeddedWallet.address)
                ]
            ))
        }

        /**
         * build the transaction call to the SimpleAccount
         * by passing in all dynamic data that was signed
         * which includes the to be executed transaction instructions
         */
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

        // estimate the gas fees for the transaction
        const gasResult = await thor.gas.estimateGas(clauses)

        // .. and build the transaction in VeChain format, with delegation enabled
        const txBody = await thor.transactions.buildTransactionBody(
            clauses,
            gasResult.totalGas,
            { isDelegated: true, }
        )

        /**
         * sign the transaction
         * and request the fee delegator to pay the gas fees in the proccess
         */
        const wallet = new ProviderInternalBaseWallet(
            [{ privateKey: Buffer.from(randomTransactionUser.privateKey.slice(2), 'hex'), address: randomTransactionUser.address }],
            { delegator: { delegatorUrl } }
        )
        const providerWithDelegationEnabled = new VeChainProvider(thor, wallet, true)
        const signer = await providerWithDelegationEnabled.getSigner(randomTransactionUser.address)
        const txInput = signerUtils.transactionBodyToTransactionRequestInput(txBody, randomTransactionUser.address)
        const rawDelegateSigned = await signer!.signTransaction(txInput)

        /**
         * publish the hexlified signed transaction directly on the node api
         */
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
        <VechainAccountContext.Provider value={{
            address,
            accountFactory,
            nodeUrl,
            delegatorUrl,
            embeddedWallet,
            sendTransaction,
            exportWallet,
            thor
        }}>
            {children}
        </VechainAccountContext.Provider>
    )
}

export const useVeChainAccount = () => {
    const context = useContext(VechainAccountContext)
    if (!context) {
        throw new Error('useVeChainAccount must be used within a VeChainAccountProvider')
    }
    return context
}
