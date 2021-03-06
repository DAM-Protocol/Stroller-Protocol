import { Flex, Image, Text, Badge, useColorModeValue } from '@chakra-ui/react';

const TokenCard = ({
	icon,
	token,
	symbol,
	data,
	setData,
	onClose,
	address,
}) => {
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
				setData({ ...data, token: symbol, icon, tokenAddress: address });
				onClose();
			}}>
			<Flex align='center'>
				<Image
					boxSize='30px'
					borderRadius='50%'
					src={icon}
					alt={symbol}
					mr={5}
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
