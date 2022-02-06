import { Framework, Query } from '@superfluid-finance/sdk-core';
import { createContext, useState, useMemo } from 'react';
import { useMoralis } from 'react-moralis';
import { ethers } from 'ethers';
import { useEffect } from 'react';
import useDefaultERC20Tokens from '../hooks/useDefaultERC20Tokens';
import { useSfSubgraphLazyQuery } from '../hooks/useSfSubgraphQuery';
import GET_SUPER_TOKENS from '../queries/getSuperTokens';

const SuperFluidContext = createContext({ sf: null });

const SuperFluidProvider = ({ children }) => {
	const { web3, isWeb3Enabled } = useMoralis();

	console.log('isWeb3Enabled', isWeb3Enabled);

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

	const [getSuperTokenList, { data: defaultSuperTokenData }] =
		useSfSubgraphLazyQuery(GET_SUPER_TOKENS);

	useEffect(() => {
		if (tokenAddresses)
			getSuperTokenList({
				variables: { where: { underlyingAddress_in: tokenAddresses } },
			});
	}, [getSuperTokenList, tokenAddresses]);

	useEffect(() => {
		if (defaultSuperTokenData?.tokens) {
			const tempTokenList = [];
			defaultSuperTokenData.tokens.forEach((token) => {
				tempTokenList.push({
					...token,
					tk: tokensLookup[token?.underlyingAddress],
				});
			});
			console.log(tempTokenList);
			setDefaultTokenList(tempTokenList);
		}
	}, [defaultSuperTokenData]);

	return (
		<SuperFluidContext.Provider value={{ sf: sf, defaultTokenList }}>
			{children}
		</SuperFluidContext.Provider>
	);
};

export { SuperFluidContext, SuperFluidProvider };
