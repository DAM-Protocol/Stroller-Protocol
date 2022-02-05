import { useState, useContext } from 'react';
import {
	Box,
	Heading,
	Accordion,
	useDisclosure,
	Button,
	Divider,
	Flex,
	Image,
	Text,
	useColorModeValue,
} from '@chakra-ui/react';
import StrollListItem from '../components/StrollListItem';
import Page from '../components/layouts/Page';
import CreateStroll from './CreateStroll';
import { SuperFluidContext } from '../context/SuperFluidContext';

const Dashboard = () => {
	const [createStrollData, setCreateStrollData] = useState({
		nickname: '',
		token: '',
		duration: 0,
	});
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { sf } = useContext(SuperFluidContext);

	return (
		<Page>
			<Button
				colorScheme='blue'
				onClick={onOpen}
				position='absolute'
				top={20}
				right={5}>
				Create a Stroll
			</Button>
			<CreateStroll
				isOpen={isOpen}
				onClose={onClose}
				data={createStrollData}
				setData={setCreateStrollData}
			/>
			<Flex flexDirection='column'>
				<Heading as='h1' textAlign={'center'}>
					Dashboard
				</Heading>
				<Divider my={5} />
				<Accordion allowToggle colorScheme='blue'>
					<Flex
						align='center'
						justify='space-around'
						px={5}
						py={3}
						color={useColorModeValue('gray.700', 'gray.500')}>
						<Flex flex={1} />
						<Flex mr={10} w={'30px'}></Flex>
						<Text fontWeight='bold' fontSize='sm' flex={6}>
							Super Token
						</Text>
						<Text fontWeight='bold' fontSize='sm' flex={8}>
							Stream Rate (/s)
						</Text>
						<Text fontWeight='bold' fontSize='sm' flex={8}>
							Total Allowance
						</Text>
						<Text fontWeight='bold' fontSize='sm' flex={8}>
							Balance
						</Text>
					</Flex>
					<StrollListItem />
					<StrollListItem />
					<StrollListItem />
				</Accordion>
			</Flex>
		</Page>
	);
};

export default Dashboard;
