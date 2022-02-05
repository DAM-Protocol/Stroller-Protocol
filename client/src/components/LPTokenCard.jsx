import { Flex, Image, Text, Button, useColorModeValue } from '@chakra-ui/react';

const LPTokenCard = ({ icon, token, protocol, appAmount }) => {
	return (
		<Flex
			flexDirection={'column'}
			align='center'
			justify='center'
			bg={useColorModeValue('gray.100', 'gray.700')}
			p={5}
			mx={3}
			w={'30ch'}
			borderRadius='lg'>
			<Image
				boxSize={'30px'}
				src='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
				alt='dai'
			/>
			<Text fontWeight='bold' mb={2}>
				{token}
			</Text>
			<Text>{protocol}</Text>
			<Text mb={3}>{appAmount && appAmount}</Text>
			<Flex>
				{appAmount > 0 && <Button mr={2}>Revoke</Button>}
				<Button colorScheme={'blue'}>
					{appAmount > 0 ? 'Approve More' : 'Approve'}
				</Button>
			</Flex>
		</Flex>
	);
};

export default LPTokenCard;
