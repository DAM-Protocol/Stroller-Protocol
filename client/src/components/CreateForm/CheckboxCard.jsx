import { useCheckbox, Box } from '@chakra-ui/react';

const CheckboxCard = () => {
	const { getCheckboxProps, getInputProps } = useCheckbox(props);
	const input = getInputProps();
	const checkbox = getCheckboxProps();

	return (
		<Box as='label'>
			<input {...input} />
			<Box
				{...checkbox}
				cursor={props.isDisabled ? 'not-allowed' : 'pointer'}
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
};

export default CheckboxCard;
