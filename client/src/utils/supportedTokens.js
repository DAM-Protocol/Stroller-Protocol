const supportedTokens = {
	'0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F': {
		symbol: 'DAI',
		address: '0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F',
		aToken: '0x639cB7b21ee2161DF9c882483C9D55c90c20Ca3e',
		superToken: '0x06577b0B09e69148A45b866a0dE6643b6caC40Af',
		decimals: 18,
	},
	'0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e': {
		symbol: 'USDC',
		address: '0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e',
		aToken: '0x2271e3Fef9e15046d09E1d78a8FF038c691E9Cf9',
		superToken: '0x86beec8a6e0e0ded142998ed8ddcbce118f91864',
		decimals: 6,
	},
	'0xBD21A10F619BE90d6066c941b04e340841F1F989': {
		symbol: 'USDT',
		address: '0xBD21A10F619BE90d6066c941b04e340841F1F989',
		aToken: '0xF8744C0bD8C7adeA522d6DDE2298b17284A79D1b',
		superToken: '0x3a27ff22eef2db03e91613ca4ba37e21ee21458a',
		decimals: 8,
	},
	'0x341d1f30e77D3FBfbD43D17183E2acb9dF25574E': {
		symbol: 'AAVE',
		address: '0x341d1f30e77D3FBfbD43D17183E2acb9dF25574E',
		aToken: '0x7ec62b6fC19174255335C8f4346E0C2fcf870a6B',
		superToken: '0x98d12ca6c1ef4b99ce48cb616a3ac25806826cc8',
		decimals: 18,
	},
	'0x3C68CE8504087f89c640D02d133646d98e64ddd9': {
		symbol: 'WETH',
		address: '0x3C68CE8504087f89c640D02d133646d98e64ddd9',
		aToken: '0x7aE20397Ca327721F013BB9e140C707F82871b56',
		superToken: '0xe2cd1c038bd473c02b01fb355b58e0a6d7183dde',
		decimals: 18,
	},
	'0x0d787a4a1548f673ed375445535a6c7A1EE56180': {
		symbol: 'WBTC',
		address: '0x0d787a4a1548f673ed375445535a6c7A1EE56180',
		aToken: '0xc9276ECa6798A14f64eC33a526b547DAd50bDa2F',
		superToken: '0x0173d76385b5948560e4012ca63ff79de9f2da9e',
		decimals: 8,
	},
};
const supportedTokenAddresses = Object.keys(supportedTokens);
export { supportedTokens, supportedTokenAddresses };
