import { Thead, Tr, Th } from '@chakra-ui/react';

const TableHeader = () => {
	return (
		<Thead>
			<Tr>
				<Th textAlign='center'>Liquidity Token</Th>
				<Th textAlign='center'>Top Up Expiry</Th>
				<Th textAlign='center'>Balance</Th>
				<Th textAlign='center'>Allowance</Th>
				<Th textAlign='center'>Edit Allowance</Th>
			</Tr>
		</Thead>
	);
};

export default TableHeader;
