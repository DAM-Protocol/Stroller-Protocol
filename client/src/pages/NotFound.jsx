import { Text, Heading } from '@chakra-ui/react';
import Page from '../components/layouts/Page';

const NotFound = () => {
	return (
		<Page>
			<Heading as='h3' size='lg'>
				Uh Oh. 404!
			</Heading>
			<Text>Page Not Found</Text>
		</Page>
	);
};

export default NotFound;
