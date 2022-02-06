import {
	AccordionButton,
	AccordionItem,
	AccordionPanel,
	Flex,
	Text,
	AccordionIcon,
	useColorModeValue,
	Table,
	Td,
	Th,
	Tr,
	Thead,
	Tbody,
	Button,
	Badge,
} from '@chakra-ui/react';
import nFormatter from '../utils/numberFormatter';
import { BiPlus, BiMinus } from 'react-icons/bi';
import { useContext, useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { SuperFluidContext } from '../context/SuperFluidContext';

const StrollListItem = ({ totalAllowance = 0 }) => {
	const { sf } = useContext(SuperFluidContext);
	const { user, web3, Moralis } = useMoralis();
	const [coin, setCoin] = useState({});
	const [balance, setBalance] = useState(0);

	useEffect(() => {
		if (sf)
			(async () => {
				const c = await sf.loadSuperToken(
					'0x3a27ff22eef2db03e91613ca4ba37e21ee21458a'
				);
				setCoin(c);
				const balance = await c.realtimeBalanceOf({
					account: user.get('ethAddress'),
					providerOrSigner: web3.getSigner(user.get('ethAddress')),
				});

				setBalance(balance.availableBalance);
			})();
	}, [sf, user, web3]);

	return (
		<AccordionItem my={4}>
			<AccordionButton>
				<Flex
					align='center'
					justify='space-between'
					bg={useColorModeValue('gray.100', 'gray.700')}
					px={5}
					py={3}
					borderRadius='lg'
					w='100%'>
					<AccordionIcon flex={2} />
					<Flex flex={3} align='center' justify='center'>
						<Badge variant='outline' colorScheme='green' borderRadius='sm'>
							USDC
						</Badge>
					</Flex>
					<Text flex={6}>USDCx</Text>
					<Text flex={8}>1</Text>
					<Text flex={8}>{nFormatter(totalAllowance)}</Text>
					<Text flex={8}>{nFormatter(Moralis.Units.FromWei(balance), 5)}</Text>
				</Flex>
			</AccordionButton>

			<AccordionPanel
				borderRadius='lg'
				bg={useColorModeValue('blackAlpha.50', 'blackAlpha.50')}>
				<Table variant='unstyled' size='sm' w={'full'}>
					<Thead>
						<Tr>
							<Th textAlign='center'>Liquidity Token</Th>
							<Th textAlign='center'>Top Up Expiry</Th>
							<Th textAlign='center'>Liquidity</Th>
							<Th textAlign='center'>Balance</Th>
							<Th textAlign='center'>Allowance</Th>
						</Tr>
					</Thead>
					<Tbody>
						<Tr>
							<Td textAlign='center'>USDC</Td>
							<Td textAlign='center'>2/2/22</Td>
							<Td textAlign='center'>10K</Td>
							<Td textAlign='center'>100</Td>
							<Td textAlign='center'>
								<Button mr={3} colorScheme='red' size='sm' variant='outline'>
									<BiMinus />
								</Button>
								<Button colorScheme='green' size='sm'>
									<BiPlus />
								</Button>
							</Td>
						</Tr>
					</Tbody>
				</Table>
			</AccordionPanel>
		</AccordionItem>
	);
};

export default StrollListItem;

// Icon
// Yeild Token Name
// Returns
// Duration

// LP Token Name
// approved amount
// revoke button
// platform
