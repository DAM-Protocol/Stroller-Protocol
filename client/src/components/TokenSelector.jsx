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
							/>
						))}
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
				<Image boxSize='30px' src={icon} alt={symbol} mr={5} borderRaius='md' />
				<Text>{token}</Text>
			</Flex>

			<Badge variant='outline' colorScheme='green' borderRadius='sm'>
				{symbol}
			</Badge>
		</Flex>
	);
};

export default TokenSelector;
