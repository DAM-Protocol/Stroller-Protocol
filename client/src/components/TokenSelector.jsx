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
} from '@chakra-ui/react';
import { GrFormSearch } from 'react-icons/gr';
// import { screen } from '@testing-library/react';

const TokenSelector = ({ isOpen, onClose, data, setData }) => {
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
					<Flex flexDirection='column' align='center' justify='center' my={5}>
						<Heading as='h3' fontSize='xl'>
							Recent Tokens
						</Heading>
						<TokenCard
							icon='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
							token='Token'
							symbol='TKN'
						/>
						<TokenCard
							icon='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
							token='Token'
							symbol='TKN'
						/>
						<TokenCard
							icon='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
							token='Token'
							symbol='TKN'
						/>
					</Flex>
					<Divider />
					<Flex flexDirection='column' align='center' justify='center' my={5}>
						<Heading as='h3' fontSize='xl'>
							Default Tokens
						</Heading>
						<TokenCard
							icon='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
							token='Token'
							symbol='TKN'
						/>
						<TokenCard
							icon='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
							token='Token'
							symbol='TKN'
						/>
						<TokenCard
							icon='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
							token='Token'
							symbol='TKN'
						/>
					</Flex>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

const TokenCard = ({ icon, token, symbol }) => {
	return (
		<Flex
			w='100%'
			align={'center'}
			justify={'space-between'}
			borderRadius='md'
			py={4}
			px={10}
			my={1}>
			<Flex align='center'>
				<Image boxSize='30px' src={icon} alt={token} mr={5} />
				<Text>{token}</Text>
			</Flex>

			<Text>{symbol}</Text>
		</Flex>
	);
};

export default TokenSelector;
