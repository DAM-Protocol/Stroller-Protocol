import {
	Heading,
	Center,
	Box,
	useColorModeValue,
	Flex,
	Text,
	Button,
	HStack,
	Table,
	Thead,
	Tr,
	Th,
	Tbody,
	Td,
	Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import PoolImage from '../PoolImage';

const PoolCard = ({ imageURL, children, name }) => {
	const navigate = useNavigate();

	return (
		<Center py={6} minW={'200px'}>
			<Box
				border={'1px solid'}
				borderColor={useColorModeValue('gray.100', 'blue.800')}
				role={'group'}
				p={6}
				maxW={'360px'}
				w={'full'}
				bg={useColorModeValue('white', 'blackAlpha.500')}
				boxShadow={'xl'}
				rounded={'lg'}
				pos={'relative'}
				zIndex={1}>
				<PoolImage imageURL={imageURL} />

				<Heading textAlign='center' as='h5' fontSize={'lg'} fontWeight={500}>
					{name}
				</Heading>
				<Text textAlign='center' color={'gray.500'} fontSize='sm'>
					CM
				</Text>
				<Flex
					pt={5}
					gap={6}
					width={'100%'}
					justify='space-between'
					flexDirection='column'
					align={'center'}>
					<Table variant='unstyled' size='sm'>
						<Tbody>
							<Tr>
								<Td textAlign='center'>
									<Tooltip
										label='Total Value Managed'
										hasArrow
										aria-label='A tooltip'>
										TVM - $12k
									</Tooltip>
								</Td>
								<Td textAlign='center'>Risk - 4/5</Td>
							</Tr>
						</Tbody>
					</Table>
					<Table variant='simple' size='sm'>
						<Thead>
							<Tr>
								<Th textAlign='center'>Month</Th>
								<Th textAlign='center'>Year</Th>
								<Th textAlign='center'>All Time</Th>
							</Tr>
						</Thead>
						<Tbody>
							<Tr>
								<Td textAlign='center'>10%</Td>
								<Td textAlign='center'>-2%</Td>
								<Td textAlign='center'>5%</Td>
							</Tr>
						</Tbody>
					</Table>
					<HStack width={'100%'} justifyContent='space-evenly'>
						<Button
							colorScheme='blue'
							onClick={() => navigate(`/Super-dHEDGE/?pool=df`)}>
							Stream
						</Button>
						<Button>Explore</Button>
					</HStack>
				</Flex>
			</Box>
		</Center>
	);
};

export default PoolCard;
