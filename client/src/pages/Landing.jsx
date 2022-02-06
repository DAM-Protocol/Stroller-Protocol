import { Text, Heading, Flex } from '@chakra-ui/react';
import Page from '../components/layouts/Page';

const Landing = () => {
	return (
		<Page>
			<Flex flexDirection='column' align='center' justify='center'>
				<img src='./stroller-xxl.png' alt='X' style={{ width: '60px' }} />
				<Heading as='h1' size='2xl'>
					Stroller Protocol
				</Heading>
				<Text>Unlock the potential of SuperTokens</Text>
				<Text>
					Stroll is a protocol that provides automatic Top-Ups for Super Tokens
				</Text>
			</Flex>
		</Page>
	);
};

export default Landing;
