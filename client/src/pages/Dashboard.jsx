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
import CreateStroll from '../components/CreateStroll';
import { SuperFluidContext } from '../context/SuperFluidContext';
import AccordionHeaders from '../components/Headers/AccordionHeaders';

const Dashboard = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { defaultTokenLookup } = useContext(SuperFluidContext);

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
			<CreateStroll isOpen={isOpen} onClose={onClose} />
			<Flex flexDirection='column'>
				<Heading as='h1' textAlign={'center'}>
					Dashboard
				</Heading>
				<Divider my={5} />
				<Accordion allowMultiple colorScheme='green'>
					<AccordionHeaders />
					<StrollListItem
						tokenData={
							defaultTokenLookup['0x3a27ff22eef2db03e91613ca4ba37e21ee21458a']
						}
					/>
					{/* <StrollListItem isLoading /> */}
				</Accordion>
			</Flex>
		</Page>
	);
};

const topUps = [
	{
		superToken: '0x3a27ff22eef2db03e91613ca4ba37e21ee21458a',
		token: '0xbd21a10f619be90d6066c941b04e340841f1f989',
	},
];

export default Dashboard;
