import {
	AccordionButton,
	AccordionItem,
	AccordionPanel,
	Flex,
	Text,
	Image,
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

import { BiPlus, BiMinus } from 'react-icons/bi';

const StrollListItem = () => {
	return (
		<AccordionItem>
			<AccordionButton>
				<Flex
					align='center'
					justify='space-around'
					bg={useColorModeValue('gray.100', 'gray.700')}
					px={5}
					py={3}
					my={2}
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
					<Text flex={8}>10K</Text>
					<Text flex={8}>97</Text>
				</Flex>
			</AccordionButton>

			<AccordionPanel pb={4}>
				<Table variant='unstyled' size='sm'>
					<Thead>
						<Tr>
							<Th></Th>
							<Th>Liquidity Token</Th>
							<Th>Top Up Expiry</Th>
							<Th>Liquidity</Th>
							<Th>Allowance</Th>
						</Tr>
					</Thead>
					<Tbody>
						<Tr>
							<Td>
								<Flex align='center' justify='flex-end'>
									<Image
										boxSize={'30px'}
										src='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
										alt='dai'
									/>
								</Flex>
							</Td>
							<Td>USDC</Td>
							<Td>2/2/22</Td>
							<Td>10K</Td>
							<Td>
								<Button mr={3}>
									<BiMinus />
								</Button>
								<Button colorScheme='green'>
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
