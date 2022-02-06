import { Thead, Tr, Th } from '@chakra-ui/core';

const TableHeader = () => {
	return (
		<Thead>
			<Tr>
				<Th textAlign='center'>Liquidity Token</Th>
				<Th textAlign='center'>Top Up Expiry</Th>
				<Th textAlign='center'>Liquidity</Th>
				<Th textAlign='center'>Balance</Th>
				<Th textAlign='center'>Allowance</Th>
			</Tr>
		</Thead>
	);
};

export default TableHeader;
