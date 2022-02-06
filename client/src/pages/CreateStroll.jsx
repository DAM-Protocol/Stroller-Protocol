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
import TokenSelector from '../components/TokenModal/TokenSelector';
import CreateForm from '../components/CreateForm/CreateForm';

const CreateStroll = ({ isOpen, onClose, data, setData }) => {
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
				data={data}
				setData={setData}
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
						<CreateForm />
					</ModalBody>
					<ModalFooter width={'100%'}>
						<Button variant='ghost' mr={3} onClick={onClose}>
							Close
						</Button>
						<Button
							onClick={() => {
								console.log(data);
								console.log(value, 'value');
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
