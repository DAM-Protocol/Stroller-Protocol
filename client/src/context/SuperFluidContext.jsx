import { Framework } from '@superfluid-finance/sdk-core';
import { createContext, useState, useMemo } from 'react';
import { useMoralis } from 'react-moralis';
import { ethers } from 'ethers';
import { useEffect } from 'react';

const SuperFluidContext = createContext({ sf: null });

const SuperFluidProvider = ({ children }) => {
	const { web3, isWeb3Enabled } = useMoralis();

	console.log('isWeb3Enabled', isWeb3Enabled);
	window.web3 = web3;
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

	useEffect(() => {
		(async () => {
			if (sf) {
				let pageResult = await sf.query?.listStreams({
					sender: '0x452181dAe31Cf9f42189df71eC64298993BEe6d3'.toLowerCase(),
				});
				console.log('pageResult', pageResult);
			}
		})();
	}, [sf]);

	return (
		<SuperFluidContext.Provider value={{ sf: sf }}>
			{children}
		</SuperFluidContext.Provider>
	);
};

export { SuperFluidContext, SuperFluidProvider };
