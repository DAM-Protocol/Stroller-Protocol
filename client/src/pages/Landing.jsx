import { Text, Heading } from '@chakra-ui/react';
import Page from '../components/layouts/Page';

const Landing = () => {
	return (
		<Page>
			<Heading as='h1' size='2xl'>
				dSIP
			</Heading>
			<Text>Systematic Investments for Your Crypto Assets</Text>
		</Page>
	);
};

export default Landing;
