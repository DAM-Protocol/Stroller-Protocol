import {
	Flex,
	Text,
	Input,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalCloseButton,
	ModalBody,
	ModalHeader,
	Divider,
	Image,
	InputLeftElement,
	InputGroup,
	Heading,
	Badge,
	useColorModeValue,
} from '@chakra-ui/react';
import { GrFormSearch } from 'react-icons/gr';
// import { screen } from '@testing-library/react';

const TokenSelector = ({
	isOpen,
	onClose,
	tokenList,
	userTokenList,
	data,
	setData,
}) => {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			closeOnOverlayClick={false}
			motionPreset='slideInBottom'
			scrollBehavior='inside'>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Select the SuperToken</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<InputGroup>
						<InputLeftElement
							pointerEvents='none'
							children={<GrFormSearch color='gray' />}
						/>
						<Input type='text' placeholder='Search you Token' />
					</InputGroup>
					<Divider />
					{userTokenList && (
						<Flex flexDirection='column' align='center' justify='center' my={5}>
							<Heading as='h3' fontSize='xl'>
								Recent Tokens
							</Heading>
							{userTokenList.map((token, index) => (
								<TokenCard
									key={index}
									icon={token.tk.logoURI}
									token={token.name}
									symbol={token.symbol}
									data={data}
									setData={setData}
									onClose={onClose}
								/>
							))}
						</Flex>
					)}
					<Divider />
					<Flex flexDirection='column' align='center' justify='center' my={5}>
						<Heading as='h3' fontSize='xl'>
							Default Tokens
						</Heading>
						{tokenList.map((token, index) => (
							<TokenCard
								key={index}
								icon={token.tk.logoURI}
								token={token.name}
								symbol={token.symbol}
								data={data}
								setData={setData}
								onClose={onClose}
							/>
						))}
					</Flex>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

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
<<<<<<< HEAD
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
||||||| parent of 1525ebb (create form updated)
				<Image boxSize='30px' src={icon} alt={symbol} mr={5} borderRaius='md' />
=======
				<Image
					boxSize='30px'
					src={icon}
					alt={symbol}
					mr={5}
					borderRadius='md'
				/>
>>>>>>> 1525ebb (create form updated)
				<Text>{token}</Text>
			</Flex>

			<Badge variant='outline' colorScheme='green' borderRadius='sm'>
				{symbol}
			</Badge>
		</Flex>
	);
};

export default TokenSelector;
