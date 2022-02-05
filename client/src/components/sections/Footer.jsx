import { Flex, Link, useColorModeValue, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Footer = (props) => {
	const bgColor = useColorModeValue('whiteAlpha.300', 'blackAlpha.400');
	const borderColor = useColorModeValue('gray.200', 'gray.700');

	return (
		<Flex
			as='footer'
			align='center'
			justify='space-between'
			w='100%'
			p={2}
			px={4}
			borderTop='1px'
			borderColor={borderColor}
			bgColor={bgColor}
			pos={'sticky'}
			top={0}>
			<NavLink to='/'>Stroller</NavLink>
			<VStack align='left' spacing={0}>
				<NavLink to='/'>Home</NavLink>
				<NavLink to='/dashboard'>Dashboard</NavLink>
			</VStack>
		</Flex>
	);
};

const NavLink = ({ children, to }) => (
	<Link
		as={RouterLink}
		p={2.5}
		to={to}
		rounded={'md'}
		_hover={{
			textDecoration: 'none',
			bg: useColorModeValue('blackAlpha.50', 'whiteAlpha.200'),
		}}>
		{children}
	</Link>
);

export default Footer;
