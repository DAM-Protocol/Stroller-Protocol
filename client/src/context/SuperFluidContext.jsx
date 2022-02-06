import { Framework } from '@superfluid-finance/sdk-core';
import { createContext, useState } from 'react';
import { useMoralis, useMoralisWeb3Api } from 'react-moralis';
import { ethers } from 'ethers';
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
});

const SuperFluidProvider = ({ children }) => {
	const { web3, isWeb3Enabled } = useMoralis();

	const [sf, setSf] = useState(null);
	useEffect(() => {
		(async () => {
			if (!isWeb3Enabled) return null;

			const mmProvider = new ethers.providers.Web3Provider(window.ethereum);

			const _sf = await Framework.create({
				networkName: 'mumbai',
				provider: mmProvider,
			});
			setSf(_sf);
		})();
	}, [isWeb3Enabled, web3]);

	const { tokensLookup } = useDefaultERC20Tokens();

	const [defaultTokenList, setDefaultTokenList] = useState([]);
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

				Object.values(defaultSuperTokenData.tokens).forEach((token) => {
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
					account: '0x917A19E71a2811504C4f64aB33c132063B5772a5'.toLowerCase(),
				});
				if (pageResult.data) {
					const data = pageResult.data;
					const superTokens = data.map((sfToken) => sfToken.token.id);
					// get underlying tokens to fetch metadata from moralis
					const underlyingTokens = data.map(
						(sfToken) => sfToken.token.underlyingAddress
					);

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
		})();
	}, [sf]);

	useEffect(() => {
		console.log(defaultTokenList, userTokenList);
	}, [defaultTokenList, userTokenList]);

	return (
		<SuperFluidContext.Provider
			value={{ sf: sf, defaultTokenList, userTokenList }}>
			{children}
		</SuperFluidContext.Provider>
	);
};

export { SuperFluidContext, SuperFluidProvider };
