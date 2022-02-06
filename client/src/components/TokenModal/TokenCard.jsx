import { Flex, Image, Text, Badge, useColorModeValue } from '@chakra-ui/core';

const TokenCard = ({ icon, token, symbol, data, setData, onClose }) => {
	return (
		<Flex
			_hover={{
				bg: useColorModeValue('green.100', 'green.800'),
				cursor: 'pointer',
			}}
			w='100%'
			align={'center'}
			justify={'space-between'}
			borderRadius='md'
			py={4}
			px={10}
			my={1}
			onClick={() => {
				setData({ ...data, token: symbol.toUpperCase() });
				onClose();
			}}>
			<Flex align='center'>
				<Image
					boxSize='30px'
					src={icon}
					alt={symbol}
					mr={5}
					borderRaius='md'
					fallbackSrc={
						'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-circle-outline-512.png'
					}
				/>
				<Text>{token}</Text>
			</Flex>

			<Badge variant='outline' colorScheme='green' borderRadius='sm'>
				{symbol}
			</Badge>
		</Flex>
	);
};

export default TokenCard;
