import { Link, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const NavLink = ({ children, to, ...rest }) => (
	<Link
		as={RouterLink}
		p={2.5}
		to={to}
		rounded={'md'}
		_hover={{
			textDecoration: 'none',
			bg: useColorModeValue('blackAlpha.50', 'whiteAlpha.200'),
		}}
		{...rest}>
		{children}
	</Link>
);
const ExternalLink = ({ children, href, ...rest }) => (
	<Link
		p={2.5}
		href={href}
		rounded={'md'}
		isExternal
		_hover={{
			textDecoration: 'none',
			bg: useColorModeValue('blackAlpha.50', 'whiteAlpha.200'),
		}}
		{...rest}>
		{children}
	</Link>
);

export { NavLink, ExternalLink };
