import {
	AccordionButton,
	AccordionItem,
	AccordionPanel,
	HStack,
	Text,
	AccordionIcon,
	useColorModeValue,
	Table,
	Td,
	Tr,
	Tbody,
	Button,
	Badge,
	Skeleton,
} from '@chakra-ui/react';
import nFormatter from '../utils/numberFormatter';
import { BiPlus, BiMinus } from 'react-icons/bi';
import { useContext, useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { SuperFluidContext } from '../context/SuperFluidContext';
import TableHeader from './Headers/TableHeader';

const StrollListItem = ({ totalAllowance = 0, isLoading }) => {
	const { sf } = useContext(SuperFluidContext);
	const { user, web3, Moralis } = useMoralis();
	const [coin, setCoin] = useState({});
	const [balance, setBalance] = useState(0);
	const mainBg = useColorModeValue('gray.100', 'gray.700');
	const tableBg = useColorModeValue('blackAlpha.50', 'blackAlpha.50');

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
		<AccordionItem>
			<AccordionButton>
				<HStack
					align='center'
					justify='space-between'
					bg={mainBg}
					px={5}
					py={3}
					my={2}
					borderRadius='lg'
					spacing={3}
					w='100%'>
					<AccordionIcon flex={2} />
					{isLoading ? (
						<>
							<Skeleton height='20px' flex={3} />
							<Skeleton height='20px' flex={6} />
							<Skeleton height='20px' flex={8} />
							<Skeleton height='20px' flex={8} />
							<Skeleton height='20px' flex={8} />
						</>
					) : (
						<>
							<HStack flex={3} align='center' justify='center'>
								<Badge variant='outline' colorScheme='green' borderRadius='sm'>
									USDC
								</Badge>
							</HStack>
							<Text flex={6}>USDCx</Text>
							<Text flex={8}>1</Text>
							<Text flex={8}>{nFormatter(totalAllowance)}</Text>
							<Text flex={8}>
								{nFormatter(Moralis.Units.FromWei(balance), 5)}
							</Text>
						</>
					)}
				</HStack>
			</AccordionButton>

			<AccordionPanel borderRadius='lg' bg={tableBg}>
				<Table variant='unstyled' size='sm' w={'full'}>
					<TableHeader />
					<Tbody>
						{isLoading ? (
							<TableRowSkeleton />
						) : (
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
						)}
					</Tbody>
				</Table>
			</AccordionPanel>
		</AccordionItem>
	);
};
const TableRowSkeleton = () => (
	<Tr>
		<Td>
			<Skeleton height='20px' />
		</Td>
		<Td>
			<Skeleton height='20px' />
		</Td>
		<Td>
			<Skeleton height='20px' />
		</Td>
		<Td>
			<Skeleton height='20px' />
		</Td>
		<Td>
			<Skeleton height='20px' />
		</Td>
	</Tr>
);

export default StrollListItem;
