const supportedTokens = {
	'0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f': {
		symbol: 'DAI',
		address: '0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f',
		aToken: '0x639cb7b21ee2161df9c882483c9d55c90c20ca3e',
		superToken: '0x06577b0b09e69148a45b866a0de6643b6cac40af',
		decimals: 18,
		logoURI:
			'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
	},
	'0x2058a9d7613eee744279e3856ef0eada5fcbaa7e': {
		symbol: 'USDC',
		address: '0x2058a9d7613eee744279e3856ef0eada5fcbaa7e',
		aToken: '0x2271e3fef9e15046d09e1d78a8ff038c691e9cf9',
		superToken: '0x86beec8a6e0e0ded142998ed8ddcbce118f91864',
		decimals: 6,
		logoURI: 'https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png',
	},
	'0xbd21a10f619be90d6066c941b04e340841f1f989': {
		symbol: 'USDT',
		address: '0xbd21a10f619be90d6066c941b04e340841f1f989',
		aToken: '0xf8744c0bd8c7adea522d6dde2298b17284a79d1b',
		superToken: '0x3a27ff22eef2db03e91613ca4ba37e21ee21458a',
		decimals: 8,
		logoURI:
			'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
	},
	'0x341d1f30e77d3fbfbd43d17183e2acb9df25574e': {
		symbol: 'AAVE',
		address: '0x341d1f30e77d3fbfbd43d17183e2acb9df25574e',
		aToken: '0x7ec62b6fc19174255335c8f4346e0c2fcf870a6b',
		superToken: '0x98d12ca6c1ef4b99ce48cb616a3ac25806826cc8',
		decimals: 18,
	},
	'0x3c68ce8504087f89c640d02d133646d98e64ddd9': {
		symbol: 'WETH',
		address: '0x3c68ce8504087f89c640d02d133646d98e64ddd9',
		aToken: '0x7ae20397ca327721f013bb9e140c707f82871b56',
		superToken: '0xe2cd1c038bd473c02b01fb355b58e0a6d7183dde',
		decimals: 18,
	},
	'0x0d787a4a1548f673ed375445535a6c7a1ee56180': {
		symbol: 'WBTC',
		address: '0x0d787a4a1548f673ed375445535a6c7a1ee56180',
		aToken: '0xc9276eca6798a14f64ec33a526b547dad50bda2f',
		superToken: '0x0173d76385b5948560e4012ca63ff79de9f2da9e',
		decimals: 8,
		logoURI:
			'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYcrhn8T5brbrrkIt1MMgDxA6sVWYAbOZAHw&usqp=CAU',
	},
};
const supportedTokenAddresses = Object.keys(supportedTokens);
const supportedSuperTokenAddresses = Object.values(supportedTokens).map(
	({ superToken }) => superToken
);
export {
	supportedTokens,
	supportedTokenAddresses,
	supportedSuperTokenAddresses,
};
