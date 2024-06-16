import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { SimpleAccountFactory } from '../typechain-types'

const deployEntryPoint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { owner, deployer } = await hre.getNamedAccounts()

    const factory = await hre.ethers.getContract('SimpleAccountFactory') as SimpleAccountFactory
    // await factory.createAccount(owner, BigInt(owner))
    console.log('Owner Address', owner, await hre.deployments.read('SimpleAccountFactory', {}, 'getAddress', owner, BigInt(owner)))
    console.log('Owner Address', owner, await hre.deployments.read('SimpleAccountFactory', {}, 'getAddress', owner, 0))

    // await factory.createAccount(deployer, BigInt(deployer))
    console.log('Deployer Address', deployer, await hre.deployments.read('SimpleAccountFactory', {}, 'getAddress', deployer, BigInt(deployer)))
    console.log('Deployer Address', deployer, await hre.deployments.read('SimpleAccountFactory', {}, 'getAddress', deployer, 0))
}

export default deployEntryPoint
