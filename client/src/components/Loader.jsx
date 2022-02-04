import { Flex, Spinner } from '@chakra-ui/react';

const Loader = () => {
	return (
		<Flex height={'100vh'} justify='center' align='center'>
			<Spinner size='xl' speed='1s' />
		</Flex>
	);
};

export default Loader;
