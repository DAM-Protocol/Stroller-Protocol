import { useState, useContext } from 'react';
import {
	Heading,
	Accordion,
	useDisclosure,
	Button,
	Divider,
	Flex,
	Text,
	useColorModeValue,
} from '@chakra-ui/react';
import StrollListItem from '../components/StrollListItem';
import Page from '../components/layouts/Page';
import CreateStroll from './CreateStroll';
import { SuperFluidContext } from '../context/SuperFluidContext';
import AccordionHeaders from '../components/Headers/AccordionHeaders';

const Dashboard = () => {
	const [createStrollData, setCreateStrollData] = useState({
		token: '',
		method: [],
		duration: 0,
	});
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { sf } = useContext(SuperFluidContext);

	window.sf = sf;

	return (
		<Page>
			<Button
				colorScheme='green'
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
				<Accordion allowMultiple colorScheme='green'>
					<AccordionHeaders />
					<StrollListItem />
					<StrollListItem />
					<StrollListItem />
				</Accordion>
			</Flex>
		</Page>
	);
};

export default Dashboard;
