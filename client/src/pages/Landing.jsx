import { Text, Heading, Flex, Button, Divider, Box } from '@chakra-ui/react';
import Page from '../components/layouts/Page';
import { NavLink } from '../components/sections/Navbar/Links';

const Landing = () => {
	return (
		<Page>
			<Flex flexDirection='column' align='center' justify='center'>
				<img
					src='./stroller-xxl.png'
					alt='X'
					style={{ width: '100px', margin: '2rem 0' }}
				/>
				<Heading as='h1' size='2xl' mb={10}>
					Stroller Protocol
				</Heading>
				<Text fontWeight='bold' mb={3}>
					Unlock the potential of SuperTokens
				</Text>
				<Text mb={10}>
					Stroller is a protocol that provides automatic Top-Ups for Super
					Tokens
				</Text>
				<NavLink to='/dashboard'>
					<Button colorScheme='green'>Go to Dashboard</Button>
				</NavLink>
				<Divider></Divider>
				<Box height={'md'} width='xl'>
					<iframe
						title='Stroller Protocol - Deck'
						loading='lazy'
						style={{
							width: '100%',
							height: '100%',
							border: 'none',
							padding: 0,
							margin: 0,
						}}
						src='https:&#x2F;&#x2F;www.canva.com&#x2F;design&#x2F;DAE3nEp1NNo&#x2F;view?embed'
						allowfullscreen='allowfullscreen'
						allow='fullscreen'></iframe>
				</Box>
			</Flex>
		</Page>
	);
};

export default Landing;
