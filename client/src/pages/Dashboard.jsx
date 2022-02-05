import { useState } from 'react';
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

const Dashboard = () => {
	const [createStrollData, setCreateStrollData] = useState({
		nickname: '',
		token: '',
		duration: 0,
	});
	const { isOpen, onOpen, onClose } = useDisclosure();
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
				<Accordion allowToggle colorScheme='blue' variant='filled'>
					<Flex
						align='center'
						justify='space-around'
						px={5}
						py={3}
						color={useColorModeValue('gray.700', 'gray.500')}>
						<Flex flex={1} />
						<Flex mr={3} w={'30px'} />
						<Text fontWeight='bold' fontSize='sm' flex={5}>
							Token Name
						</Text>
						<Text fontWeight='bold' fontSize='sm' flex={8}>
							Duration
						</Text>
						<Text fontWeight='bold' fontSize='sm' flex={8}>
							ROI
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
