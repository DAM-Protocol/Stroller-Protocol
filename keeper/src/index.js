require('dotenv').config()
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const StrollManagerABI = require('./abi/StrollManager.abi.json')

const accounts = require('./accounts.json')

const HTTP_RPC = process.env.HTTP_RPC
const PRIVATE_KEY = process.env.PRIVATE_KEY
const STROLL_MANAGER_ADDRESS = process.env.STROLL_MANAGER_ADDRESS

async function getUnderlyingToken(web3, superTokenAddress) {
	// get underlying token logic
	const getUnderlyingTokenABI = [
		{
			inputs: [],
			outputs: [{ name: '', type: 'address' }],
			name: 'getUnderlyingToken',
			stateMutability: 'view',
			type: 'function'
		}
	]
	const superTokenContract = new web3.eth.Contract(
		getUnderlyingTokenABI,
		superTokenAddress
	)
	return await superTokenContract.methods.getUnderlyingToken().call()
}

async function tryPerformTopUp(
	strollManager,
	from,
	account,
	superToken,
	underlyingToken
) {
	const topUpAmount = await strollManager.methods
		.checkTopUp(account, superToken, underlyingToken)
		.call()
		.then(amount => amount.toString())

	if (topUpAmount === '0') {
		console.log(`Account ${account}: Skipping top up.`)
		return
	}

	console.log(`Running Top Up for ${account} on ${superToken}`)

	try {
		const tx = await strollManager.methods
			.performTopUp(account, superToken, underlyingToken)
			.send({ from })
		console.log(`Top Up executed: ${tx.transactionHash}`)
	} catch (error) {
		console.error('TRANSACTION FAILED:', error)
		console.log('RETRYING:')

		const tx = await strollManager.methods
			.performTopUp(account, superToken, underlyingToken)
			.send({ from, gasPrice: '100000000000' })

		console.log(`Top Up executed: ${tx.transactionHash}`)
	}
}

async function main() {
	const provider = new HDWalletProvider(PRIVATE_KEY, HTTP_RPC)
	const web3 = new Web3(provider)
	const strollManager = new web3.eth.Contract(
		StrollManagerABI,
		STROLL_MANAGER_ADDRESS
	)

	for (const { account, superToken } of accounts) {
		const underlyingToken = await getUnderlyingToken(web3, superToken)
		await tryPerformTopUp(
			strollManager,
			provider.addresses[0],
			account,
			superToken,
			underlyingToken
		)
	}
}

main()
	.then(() => process.exit(0))
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
