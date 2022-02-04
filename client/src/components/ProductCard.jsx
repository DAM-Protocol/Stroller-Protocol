import {
	Text,
	Heading,
	Center,
	Box,
	Image,
	useColorModeValue,
	Stack,
	Button,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { InternalLink } from './Links';

const ProductCard = ({ title, description, imageURL, chain, disabled }) => {
	const navigate = useNavigate();
	return (
		<Center py={6} minW={'340px'}>
			<Box
				border={'1px solid'}
				borderColor={useColorModeValue('gray.100', 'blue.800')}
				role={'group'}
				p={6}
				maxW={'330px'}
				w={'full'}
				bg={useColorModeValue('white', 'blackAlpha.500')}
				boxShadow={'2xl'}
				rounded={'xl'}
				pos={'relative'}
				zIndex={1}>
				<ProductImage imageURL={imageURL} />
				<Stack pt={10} align={'center'}>
					<Text color={'gray.500'} fontSize={'sm'} textTransform={'uppercase'}>
						{chain}
					</Text>
					<Heading fontSize={'2xl'} fontFamily={'body'} fontWeight={500}>
						{title}
					</Heading>
					<Stack direction={'row'} align={'center'}>
						<Text color={'gray.500'}>{description}</Text>
					</Stack>

					<InternalLink
						flex={1}
						fontWeight='bold'
						fontSize={'sm'}
						rounded={'full'}
						px={10}
						py={2.5}
						bg={disabled ? 'blue.200' : 'blue.400'}
						color={'white'}
						_hover={{
							bg: disabled ? 'blue.200' : 'blue.500',
						}}
						cursor={disabled ? 'not-allowed' : 'pointer'}
						to={disabled ? '#' : `/${title}`}
						disabled={disabled}>
						{disabled ? 'Coming Soon' : 'Invest'}
					</InternalLink>
				</Stack>
			</Box>
		</Center>
	);
};
const ProductImage = ({ imageURL }) => {
	return (
		<Box
			rounded={'xl'}
			mt={-12}
			pos={'relative'}
			height={'230px'}
			_after={{
				transition: 'all .3s ease',
				content: '""',
				w: '80%',
				h: '80%',
				pos: 'absolute',
				bottom: -2,
				left: '50%',
				transform: 'translateX(-50%)',
				backgroundImage: `url(${imageURL})`,
				filter: 'blur(20px)',
				zIndex: -1,
			}}
			_groupHover={{
				_after: {
					filter: 'blur(30px)',
				},
			}}>
			<Image
				rounded={'xl'}
				height={230}
				width={282}
				objectFit={'cover'}
				src={imageURL}
				border={useColorModeValue('', '1px solid')}
				borderColor={'blue.800'}
			/>
		</Box>
	);
};

export default ProductCard;
