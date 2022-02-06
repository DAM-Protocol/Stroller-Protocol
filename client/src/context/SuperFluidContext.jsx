import { Framework, Query } from '@superfluid-finance/sdk-core';
import { createContext, useState, useMemo } from 'react';
import { useMoralis, useMoralisWeb3Api } from 'react-moralis';
import { ethers } from 'ethers';
import { useEffect } from 'react';
import useDefaultERC20Tokens from '../hooks/useDefaultERC20Tokens';
import { useSfSubgraphLazyQuery } from '../hooks/useSfSubgraphQuery';
import GET_SUPER_TOKENS from '../queries/getSuperTokens';

const SuperFluidContext = createContext({ sf: null });

const SuperFluidProvider = ({ children }) => {
	const { web3, isWeb3Enabled } = useMoralis();

	const [sf, setSf] = useState(null);
	useEffect(() => {
		(async () => {
			if (!isWeb3Enabled) return null;

			const mmProvider = new ethers.providers.Web3Provider(window.ethereum);

			const _sf = await Framework.create({
				networkName: 'matic',
				provider: mmProvider,
			});
			window.sf = _sf;
			setSf(_sf);
		})();
	}, [isWeb3Enabled, web3]);

	const { tokensLookup, tokenAddresses } = useDefaultERC20Tokens();
	const [defaultTokenList, setDefaultTokenList] = useState([]);
	const [userTokenList, setUserTokenList] = useState([]);
	window.defaultTokenList = defaultTokenList;

	const [getSuperTokenList] = useSfSubgraphLazyQuery(GET_SUPER_TOKENS);

	useEffect(() => {
		(async () => {
			const { data: defaultSuperTokenData } = await getSuperTokenList({
				variables: {
					where: {
						underlyingAddress_in: tokenAddresses,
						underlyingAddress_not: '0x',
					},
				},
			});
			if (defaultSuperTokenData?.tokens) {
				const tempTokenList = [];

				defaultSuperTokenData.tokens.forEach((token) => {
					tempTokenList.push({
						...token,
						tk: {
							...tokensLookup[token?.underlyingAddress],
							address: token?.underlyingAddress,
						},
					});
				});
				setDefaultTokenList(tempTokenList);
			}
		})();
	}, [getSuperTokenList, tokenAddresses, tokensLookup]);

	const [getUserSuperTokenList] = useSfSubgraphLazyQuery(GET_SUPER_TOKENS);
	const Web3Api = useMoralisWeb3Api();

	useEffect(() => {
		(async () => {
			if (sf) {
				let pageResult = await sf.query?.listUserInteractedSuperTokens({
					account: '0x452181dAe31Cf9f42189df71eC64298993BEe6d3'.toLowerCase(),
				});
				if (pageResult.data) {
					const data = pageResult.data;
					const superTokens = data.map((sfToken) => sfToken.token.id);
					// get underlying tokens to fetch metadata from moralis
					const underlyingTokens = data.map(
						(sfToken) => sfToken.token.underlyingAddress
					);

					const tokenMetadata = await Web3Api.token.getTokenMetadata({
						chain: 'matic',
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
					const { data: userTokenData } = await getUserSuperTokenList({
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
								address: token?.underlyingAddress,
							},
						});
					});
					setUserTokenList(tempTokenList);
				}
			}
		})();
	}, [sf]);

	return (
		<SuperFluidContext.Provider
			value={{ sf: sf, defaultTokenList, userTokenList }}>
			{children}
		</SuperFluidContext.Provider>
	);
};

export { SuperFluidContext, SuperFluidProvider };
