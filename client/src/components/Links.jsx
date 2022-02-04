import { Link } from '@chakra-ui/react';
import { Link as ReactLink } from 'react-router-dom';

const InternalLink = ({ children, to, ...rest }) => (
	<Link as={ReactLink} to={to || '/'} {...rest}>
		{children}
	</Link>
);
const ExternalLink = ({ children, href, ...rest }) => (
	<Link href={href} isExternal {...rest}>
		{children}
	</Link>
);

export { InternalLink, ExternalLink };
