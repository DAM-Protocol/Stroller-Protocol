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
import {
	useMoralis,
	useMoralisWeb3Api,
	useWeb3ExecuteFunction,
} from 'react-moralis';
import { SuperFluidContext } from '../context/SuperFluidContext';
import TableHeader from './Headers/TableHeader';
import { AAVE_STROLL_OUT_ADDRESS } from '../utils/contractAddresses';
import { supportedTokens } from '../utils/supportedTokens';
import { REGISTRY_ABI } from '../abis/registry';
import { ERC20_ABI } from '../abis/erc20';

const StrollListItem = ({ tokenData, totalAllowance = 0, isLoading }) => {
	const { sf } = useContext(SuperFluidContext);
	const { user, web3, Moralis } = useMoralis();

	const [coin, setCoin] = useState({});
	const [balance, setBalance] = useState(0);
	const [flow, setFlow] = useState(0);

	const mainBg = useColorModeValue('gray.100', 'gray.700');
	const tableBg = useColorModeValue('blackAlpha.50', 'blackAlpha.50');

	const { data: allowanceData, fetch: fetchAllowance } = useWeb3ExecuteFunction(
		{
			abi: ERC20_ABI,
			contractAddress: supportedTokens[tokenData?.underlyingAddress]?.aToken,
			functionName: 'allowance',
			params: {
				owner: user.get('ethAddress'),
				spender: AAVE_STROLL_OUT_ADDRESS,
			},
		}
	);
	const { data: aaveBalance, fetch: fetchAaveBalance } = useWeb3ExecuteFunction(
		{
			abi: ERC20_ABI,
			contractAddress: supportedTokens[tokenData?.underlyingAddress]?.aToken,
			functionName: 'balanceOf',
			params: {
				owner: user.get('ethAddress'),
			},
		}
	);
	// console.log(allowanceData, aaveBalance);

	useEffect(() => {
		if (sf && tokenData)
			(async () => {
				const c = await sf.loadSuperToken(tokenData.id);
				setCoin(c);
				const balance = await c.realtimeBalanceOf({
					account: user.get('ethAddress'),
					providerOrSigner: web3.getSigner(user.get('ethAddress')),
				});
				const flow = await sf.cfaV1.getNetFlow({
					superToken: tokenData.id,
					account: user.get('ethAddress'),
					providerOrSigner: web3.getSigner(user.get('ethAddress')),
				});
				setFlow(flow);
				setBalance(balance.availableBalance);
				await fetchAllowance({
					params: {
						owner: user.get('ethAddress'),
						spender: AAVE_STROLL_OUT_ADDRESS,
					},
				});
				console.log(
					await fetchAaveBalance({
						params: {
							owner: user.get('ethAddress'),
						},
					})
				);
			})();
	}, [sf, tokenData, user, web3]);

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
									{tokenData?.symbol}
								</Badge>
							</HStack>
							<Text flex={6}>{tokenData?.name}</Text>
							<Text flex={8}>{flow}</Text>
							<Text flex={8}>
								{nFormatter(Moralis.Units.FromWei(totalAllowance))}
							</Text>
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
								<Td textAlign='center'>amUSDT</Td>
								<Td textAlign='center'>2/2/22</Td>
								{/* balance */}
								<Td textAlign='center'>
									{nFormatter(Moralis.Units.FromWei(balance), 3)}
								</Td>
								{/* allowance */}
								<Td textAlign='center'>
									{nFormatter(Moralis.Units.FromWei(3764873647836), 3)}
								</Td>
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
