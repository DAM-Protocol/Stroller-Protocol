import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalCloseButton,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const InvestModal = ({ poolData, isOpen, onClose }) => {
	const navigate = useNavigate();
	const closeModal = () => {
		navigate(`/Super-dHEDGE/`);
	};

	return (
		<Modal isOpen={isOpen} onClose={closeModal} size='5xl' isCentered>
			<ModalOverlay />
			<ModalContent height='80%'>
				<ModalHeader>Modal Title</ModalHeader>
				<ModalCloseButton />
				<ModalBody>lkkjb</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default InvestModal;
