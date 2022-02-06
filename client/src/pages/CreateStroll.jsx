import TokenSelector from '../components/TokenSelector';
import { useContext, useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { addDays } from 'date-fns';
import {
	Box,
	useDisclosure,
	Flex,
	FormControl,
	FormLabel,
	Button,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	useCheckbox,
	useCheckboxGroup,
	Text,
} from '@chakra-ui/react';
import { SuperFluidContext } from '../context/SuperFluidContext';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

const CreateStroll = ({ isOpen, onClose, data, setData }) => {
	const { defaultTokenList, userTokenList } = useContext(SuperFluidContext);
	const { token, duration } = data;
	const {
		isOpen: isTokenOpen,
		onOpen: onTokenOpen,
		onClose: onTokenClose,
	} = useDisclosure();

	const { value, getCheckboxProps } = useCheckboxGroup({
		defaultValue: ['AAVE Tokens'],
	});

	useEffect(() => setData({ ...data, method: value }), [value]);

	const [state, setState] = useState([
		{
			startDate: new Date(),
			endDate: addDays(new Date(), 7),
			key: 'selection',
		},
	]);

	return (
		<>
			<TokenSelector
				isOpen={isTokenOpen}
				onOpen={onTokenOpen}
				onClose={onTokenClose}
				tokenList={defaultTokenList}
				userTokenList={userTokenList}
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
						<Flex align={'center'} justify={'center'}>
							<FormControl width='90%'>
								<FormLabel htmlFor='token'>Token</FormLabel>
								<Flex align='center'>
									<Text>{token ? token : 'Select a Token'}</Text>
									<Button onClick={onTokenOpen}>Select Token</Button>
								</Flex>
								<FormLabel htmlFor='token'>Token Investment Methods</FormLabel>
								<Flex align='center' justify='space-around'>
									<CheckboxCard {...getCheckboxProps({ value: 'AAVE Tokens' })}>
										AAVE Tokens
									</CheckboxCard>
									<CheckboxCard
										{...getCheckboxProps({ value: 'ERC20 Tokens' })}>
										ERC20) Tokens
									</CheckboxCard>
								</Flex>
								<FormLabel htmlFor='duration'>Duration</FormLabel>
								<DateRange
									editableDateInputs={true}
									onChange={(item) => setState([item.selection])}
									moveRangeOnFirstSelection={false}
									ranges={state}
									color='#e3e3e3'
								/>
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

function CheckboxCard(props) {
	const { state, getCheckboxProps, getInputProps } = useCheckbox(props);

	const input = getInputProps();
	const checkbox = getCheckboxProps();
	return (
		<Box as='label'>
			<input {...input} />
			<Box
				{...checkbox}
				cursor='pointer'
				borderWidth='1px'
				borderRadius='md'
				boxShadow='md'
				_checked={{
					bg: 'green.600',
					color: 'white',
					borderColor: 'green.600',
				}}
				_focus={{
					boxShadow: 'outline',
				}}
				px={5}
				py={3}>
				{props.children}
			</Box>
		</Box>
	);
}

export default CreateStroll;
