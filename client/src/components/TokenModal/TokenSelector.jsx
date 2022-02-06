import { useContext } from 'react';
import {
	Flex,
	Input,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalCloseButton,
	ModalBody,
	ModalHeader,
	Divider,
	InputLeftElement,
	InputGroup,
	Heading,
} from '@chakra-ui/react';
import { GrFormSearch } from 'react-icons/gr';
import { SuperFluidContext } from '../../context/SuperFluidContext';
import TokenCard from './TokenCard';
// import { screen } from '@testing-library/react';

const TokenSelector = ({ isOpen, onClose, data, setData }) => {
	const { defaultTokenList: tokenList, userTokenList } =
		useContext(SuperFluidContext);

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

export default TokenSelector;
