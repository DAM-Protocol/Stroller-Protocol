import { useState } from 'react';
import {
	Box,
	Heading,
	Accordion,
	useDisclosure,
	Button,
	Divider,
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
			<Button onClick={onOpen}>Create a Stroll</Button>
			<Divider />
			<CreateStroll
				isOpen={isOpen}
				onClose={onClose}
				data={createStrollData}
				setData={setCreateStrollData}
			/>
			<Box>
				<Heading as='h1'>Dashboard</Heading>
				<Accordion allowToggle>
					<StrollListItem />
					<StrollListItem />
					<StrollListItem />
				</Accordion>
			</Box>
		</Page>
	);
};

export default Dashboard;
