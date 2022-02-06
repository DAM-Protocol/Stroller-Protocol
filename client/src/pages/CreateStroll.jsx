import TokenSelector from '../components/TokenSelector';
import {
	Heading,
	Divider,
	useDisclosure,
	Flex,
	Stack,
	Input,
	Select,
	FormControl,
	FormLabel,
	SliderMark,
	SliderTrack,
	SliderFilledTrack,
	SliderThumb,
	Button,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	Slider,
	CheckboxGroup,
	Checkbox,
} from '@chakra-ui/react';

const CreateStroll = ({ isOpen, onClose, data, setData }) => {
	const { method, token, duration } = data;
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
			/>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				isCentered
				motionPreset='slideInBottom'
				scrollBehavior='inside'
				closeOnEsc
				size='3xl'>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Create a Stroll</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<Flex align={'center'} justify={'center'}>
							<FormControl width='90%'>
								<FormLabel htmlFor='token'>Token</FormLabel>
								<Button onClick={onTokenOpen}>Select Token</Button>
								<CheckboxGroup
									colorScheme='green'
									defaultValue={['naruto', 'kakashi']}>
									<Stack spacing={[1, 5]} direction={['column', 'row']}>
										<Checkbox value='naruto'>Naruto</Checkbox>
										<Checkbox value='sasuke'>Sasuke</Checkbox>
										<Checkbox value='kakashi'>kakashi</Checkbox>
									</Stack>
								</CheckboxGroup>
								<FormLabel htmlFor='duration'>Duration</FormLabel>
								<Slider
									aria-label='duration select'
									value={duration}
									onChange={(val) => setData({ ...data, duration: val })}
									my={8}>
									<SliderMark value={25} mt='1' ml='-2.5' fontSize='sm'>
										25%
									</SliderMark>
									<SliderMark value={50} mt='1' ml='-2.5' fontSize='sm'>
										50%
									</SliderMark>
									<SliderMark value={75} mt='1' ml='-2.5' fontSize='sm'>
										75%
									</SliderMark>
									<SliderMark
										value={duration}
										textAlign='center'
										bg='green.500'
										color='white'
										mt='-10'
										ml='-5'
										w='12'>
										{duration}%
									</SliderMark>
									<SliderTrack>
										<SliderFilledTrack />
									</SliderTrack>
									<SliderThumb />
								</Slider>
							</FormControl>
						</Flex>
					</ModalBody>
					<ModalFooter width={'100%'}>
						<Button variant='ghost' mr={3} onClick={onClose}>
							Close
						</Button>
						<Button
							onClick={() => {
								console.log(data);
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
