import { useMemo, useCallback, useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';

const useDefaultERC20Tokens = () => {
	const { isWeb3Enabled, isAuthenticated } = useMoralis();

	const [tokenList, setTokenList] = useState([]);
	const tokensLookup = useMemo(
		() =>
			tokenList.reduce((obj, { id, address, ...rest }) => {
				obj[address.toLowerCase()] = { ...rest };
				return obj;
			}, {}),
		[tokenList]
	);
	const tokenAddresses = useMemo(
		() => tokenList.map(({ address }) => address),
		[tokenList]
	);
	const fetchDefaultTokens = useCallback(async () => {
		fetch(
			'https://raw.githubusercontent.com/sushiswap/default-token-list/master/tokens/matic.json'
		)
			.then((res) => res.json())
			.then((data) => {
				setTokenList(data);
			})
			.catch((err) => console.log(err));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => {
		if (isWeb3Enabled) {
			fetchDefaultTokens();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, isWeb3Enabled]);

	return { tokenList, tokensLookup, tokenAddresses };
};

export default useDefaultERC20Tokens;
