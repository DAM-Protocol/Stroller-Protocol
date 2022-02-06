import {
	useDisclosure,
	Button,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
} from '@chakra-ui/react';
import TokenSelector from './TokenModal/TokenSelector';
import CreateForm from './CreateForm/CreateForm';
import { useState } from 'react';

const CreateStroll = ({ isOpen, onClose }) => {
	const [createStrollData, setCreateStrollData] = useState({
		token: '',
		method: [],
		duration: 0,
	});
	const {
		isOpen: isTokenOpen,
		onOpen: onTokenOpen,
		onClose: onTokenClose,
	} = useDisclosure();

	return (
		<>
			<TokenSelector
				isOpen={isTokenOpen}
				onOpen={onTokenOpen}
				onClose={onTokenClose}
				data={createStrollData}
				setData={setCreateStrollData}
			/>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				isCentered
				motionPreset='slideInBottom'
				scrollBehavior='inside'
				closeOnEsc
				size='xl'>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Create a Stroll</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<CreateForm
							data={createStrollData}
							setData={setCreateStrollData}
							onTokenOpen={onTokenOpen}
						/>
					</ModalBody>
					<ModalFooter width={'100%'}>
						<Button variant='ghost' mr={3} onClick={onClose}>
							Close
						</Button>
						<Button
							onClick={() => {
								console.log(createStrollData);
								onClose();
							}}
							colorScheme='green'>
							Create the Stroll
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreateStroll;
