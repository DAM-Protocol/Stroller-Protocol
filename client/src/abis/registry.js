export const REGISTRY_ABI = [
	{
		inputs: [
			{
				internalType: 'contract IStrollResolver',
				name: '_strollResolver',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: '_scanLength',
				type: 'uint256',
			},
		],
		stateMutability: 'nonpayable',
		type: 'constructor',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'previousOwner',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'newOwner',
				type: 'address',
			},
		],
		name: 'OwnershipTransferred',
		type: 'event',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_index',
				type: 'uint256',
			},
		],
		name: 'checkTopUp',
		outputs: [
			{
				internalType: 'bool',
				name: '',
				type: 'bool',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'bytes',
				name: 'checkData',
				type: 'bytes',
			},
		],
		name: 'checkUpkeep',
		outputs: [
			{
				internalType: 'bool',
				name: 'upkeepNeeded',
				type: 'bool',
			},
			{
				internalType: 'bytes',
				name: 'performData',
				type: 'bytes',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_superToken',
				type: 'address',
			},
			{
				internalType: 'address',
				name: '_strategy',
				type: 'address',
			},
			{
				internalType: 'address',
				name: '_liquidityToken',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: '_time',
				type: 'uint256',
			},
		],
		name: 'createTopUp',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256[]',
				name: '_indices',
				type: 'uint256[]',
			},
		],
		name: 'deleteBatch',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_user',
				type: 'address',
			},
			{
				internalType: 'address',
				name: '_superToken',
				type: 'address',
			},
		],
		name: 'deleteTopUp',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_index',
				type: 'uint256',
			},
		],
		name: 'deleteTopUp',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_user',
				type: 'address',
			},
			{
				internalType: 'address',
				name: '_superToken',
				type: 'address',
			},
		],
		name: 'getTopUp',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
			{
				internalType: 'contract ISuperToken',
				name: '',
				type: 'address',
			},
			{
				components: [
					{
						internalType: 'contract IStrategy',
						name: 'strategyAddress',
						type: 'address',
					},
					{
						internalType: 'address',
						name: 'token',
						type: 'address',
					},
				],
				internalType: 'struct Registry.Strategy',
				name: '',
				type: 'tuple',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_index',
				type: 'uint256',
			},
		],
		name: 'getTopUpByIndex',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
			{
				internalType: 'contract ISuperToken',
				name: '',
				type: 'address',
			},
			{
				components: [
					{
						internalType: 'contract IStrategy',
						name: 'strategyAddress',
						type: 'address',
					},
					{
						internalType: 'address',
						name: 'token',
						type: 'address',
					},
				],
				internalType: 'struct Registry.Strategy',
				name: '',
				type: 'tuple',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_user',
				type: 'address',
			},
			{
				internalType: 'address',
				name: '_superToken',
				type: 'address',
			},
		],
		name: 'getTopUpIndex',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'getTotalTopUps',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'owner',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_index',
				type: 'uint256',
			},
		],
		name: 'performTopUp',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'bytes',
				name: 'performData',
				type: 'bytes',
			},
		],
		name: 'performUpkeep',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [],
		name: 'renounceOwnership',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [],
		name: 'scanLength',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_scanLength',
				type: 'uint256',
			},
		],
		name: 'setScanLength',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: 'newOwner',
				type: 'address',
			},
		],
		name: 'transferOwnership',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
];
