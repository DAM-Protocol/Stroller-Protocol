import { useState } from 'react';
import {
	Heading,
	Divider,
	Flex,
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
} from '@chakra-ui/react';

const CreateStroll = ({ isOpen, onClose }) => {
	const [sliderValue, setSliderValue] = useState(0);
	return (
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
							<FormLabel htmlFor='name'>NickName</FormLabel>
							<Input type='text' placeholder="Doobie's Stroll" mb={5} />
							<FormLabel htmlFor='token'>Token</FormLabel>
							<Select placeholder='Select a token' mb={5}>
								<option value='USDC'>USDC</option>
								<option value='USDT'>USDT</option>
								<option value='DAI'>DAI</option>
							</Select>
							<FormLabel htmlFor='duration'>Duration</FormLabel>
							<Slider
								aria-label='duration select'
								value={sliderValue}
								onChange={(val) => setSliderValue(val)}
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
									value={sliderValue}
									textAlign='center'
									bg='blue.500'
									color='white'
									mt='-10'
									ml='-5'
									w='12'>
									{sliderValue}%
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
					<Button colorScheme='blue' mr={3} onClick={onClose}>
						Close
					</Button>
					<Button variant='ghost'>Create the Stroll</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default CreateStroll;
