import { Text, Heading } from '@chakra-ui/react';
import Page from '../components/layouts/Page';

const Landing = () => {
	return (
		<Page>
			<Heading as='h1' size='2xl'>
				Stroll Protocol
			</Heading>
			<Text>
				Stroll is a protocol that provides automatic Top-Ups for Super Tokens
			</Text>
		</Page>
	);
};

export default Landing;
