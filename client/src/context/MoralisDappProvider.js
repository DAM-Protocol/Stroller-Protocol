import React, { useEffect, useState } from 'react';
import { useMoralis } from 'react-moralis';
import MoralisDappContext from './context';

function MoralisDappProvider({ children }) {
	const {
		web3,
		Moralis,
		user,
		enableWeb3,
		isWeb3Enabled,
		isAuthenticated,
		isWeb3EnableLoading,
	} = useMoralis();

	const [walletAddress, setWalletAddress] = useState();
	const [chainId, setChainId] = useState();

	useEffect(() => {
		if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, isWeb3Enabled]);

	useEffect(() => {
		Moralis.onChainChanged(function (chain) {
			setChainId(chain);
		});

		Moralis.onAccountChanged(function (address) {
			setWalletAddress(address[0]);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => setChainId(web3.givenProvider?.chainId));
	useEffect(
		() =>
			setWalletAddress(
				web3.givenProvider?.selectedAddress || user?.get('ethAddress')
			),
		[web3, user]
	);

	return (
		<MoralisDappContext.Provider
			value={{
				walletAddress,
				chainId,
			}}>
			{children}
		</MoralisDappContext.Provider>
	);
}

function useMoralisDapp() {
	const context = React.useContext(MoralisDappContext);
	if (context === undefined) {
		throw new Error('useMoralisDapp must be used within a MoralisDappProvider');
	}
	return context;
}

export { MoralisDappProvider, useMoralisDapp };
