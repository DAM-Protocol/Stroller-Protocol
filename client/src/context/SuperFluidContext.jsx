import { Framework } from '@superfluid-finance/sdk-core';
import { createContext, useState, useMemo } from 'react';
import { useMoralis, useMoralisWeb3Api } from 'react-moralis';
import { useEffect } from 'react';
import useDefaultERC20Tokens from '../hooks/useDefaultERC20Tokens';
import { useSfSubgraphLazyQuery } from '../hooks/useSfSubgraphQuery';
import GET_SUPER_TOKENS from '../queries/getSuperTokens';
import {
	supportedTokens,
	supportedTokenAddresses,
	supportedSuperTokenAddresses,
} from '../utils/supportedTokens';

const SuperFluidContext = createContext({
	sf: null,
	defaultTokenList: [],
	userTokenList: [],
	defaultTokenLookup: {},
	sfProvider: {},
});

const SuperFluidProvider = ({ children }) => {
	const { web3, isWeb3Enabled, Moralis } = useMoralis();
	window.web3 = web3;

	const [sf, setSf] = useState(null);
	const [sfProvider, setSfProvider] = useState(null);
	useEffect(() => {
		(async () => {
			if (!isWeb3Enabled) return null;
			const ethers = Moralis.web3Library;
			const mmProvider = new ethers.providers.Web3Provider(window.ethereum);

			const _sf = await Framework.create({
				networkName: 'mumbai',
				provider: mmProvider,
			});
			window.SfProvider = mmProvider;
			setSfProvider(mmProvider);
			setSf(_sf);
		})();
	}, [isWeb3Enabled, web3]);

	const { tokensLookup } = useDefaultERC20Tokens();

	const [defaultTokenList, setDefaultTokenList] = useState([]);
	const defaultTokenLookup = useMemo(() => {
		return defaultTokenList.reduce((acc, token) => {
			acc[token.id] = token;
			return acc;
		}, {});
	}, [defaultTokenList]);

	const [userTokenList, setUserTokenList] = useState([]);

	const [getSuperTokenList] = useSfSubgraphLazyQuery(GET_SUPER_TOKENS);

	useEffect(() => {
		(async () => {
			const { data: defaultSuperTokenData } = await getSuperTokenList({
				variables: {
					where: {
						id_in: supportedSuperTokenAddresses,
						underlyingAddress_not: '0x',
					},
				},
			});
			if (defaultSuperTokenData.tokens) {
				const tempTokenList = [];

				defaultSuperTokenData.tokens.forEach((token) => {
					tempTokenList.push({
						...token,
						tk: {
							...tokensLookup[token.underlyingAddress],
							...supportedTokens[token?.underlyingAddress],
							address: token?.underlyingAddress,
						},
					});
				});
				setDefaultTokenList(tempTokenList);
			}
		})();
	}, [getSuperTokenList, tokensLookup]);

	const Web3Api = useMoralisWeb3Api();

	useEffect(() => {
		(async () => {
			if (sf) {
				let pageResult = await sf.query?.listUserInteractedSuperTokens({
					account: web3?.provider?.selectedAddress?.toLowerCase(),
				});
				if (pageResult.data) {
					const data = pageResult.data;
					const superTokens = data.map((sfToken) => sfToken.token.id);
					// get underlying tokens to fetch metadata from moralis
					const underlyingTokens = data.map(
						(sfToken) => sfToken.token.underlyingAddress
					);

					if (underlyingTokens.length > 0) {
						const tokenMetadata = await Web3Api.token.getTokenMetadata({
							chain: 'mumbai',
							addresses: underlyingTokens,
						});
						// create a lookup table for token metadata
						const tokenMetadataLookup = {};
						tokenMetadata.forEach(({ decimals, name, symbol, address }) => {
							tokenMetadataLookup[address] = {
								decimals,
								name,
								symbol,
								address,
							};
						});

						// get supertoken data from the graph
						const { data: userTokenData } = await getSuperTokenList({
							variables: {
								where: {
									id_in: superTokens,
								},
							},
						});

						const tempTokenList = [];

						// add the user supertokens to the list
						const _userTokens = userTokenData.tokens;
						_userTokens.forEach((token) => {
							tempTokenList.push({
								...token,
								tk: {
									...tokenMetadataLookup[token?.underlyingAddress],
									...tokensLookup[token?.underlyingAddress],
									...supportedTokens[token?.underlyingAddress],
									address: token?.underlyingAddress,
								},
							});
						});
						setUserTokenList(tempTokenList);
					}
				}
			}
		})();
	}, [getSuperTokenList, sf, tokensLookup, web3?.provider.selectedAddress]);

	useEffect(() => {
		console.log(defaultTokenList, userTokenList);
	}, [defaultTokenList, userTokenList]);

	return (
		<SuperFluidContext.Provider
			value={{
				sf: sf,
				defaultTokenList,
				defaultTokenLookup,
				userTokenList,
				sfProvider,
			}}>
			{children}
		</SuperFluidContext.Provider>
	);
};

export { SuperFluidContext, SuperFluidProvider };
