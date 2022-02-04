import { Flex } from '@chakra-ui/react';
import Navbar from '../sections/Navbar/';
import Footer from '../sections/Footer';

const DefaultLayout = (props) => {
	return (
		<Flex direction='column' align='center' minH='100vh' m='0 auto' {...props}>
			<Navbar />
			{props.children}
			<Footer />
		</Flex>
	);
};

export default DefaultLayout;
