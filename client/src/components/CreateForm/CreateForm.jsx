import { useState, useEffect } from 'react';
import {
	Flex,
	FormControl,
	FormLabel,
	Text,
	Button,
	useCheckboxGroup,
	useColorModeValue,
	useDisclosure,
} from '@chakra-ui/react';

import { Calendar } from 'react-date-range';
import CheckboxCard from './CheckboxCard';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

const CreateForm = ({ data, setData, onTokenOpen }) => {
	const { token } = data;

	const { value, getCheckboxProps } = useCheckboxGroup({
		defaultValue: ['AAVE Tokens'],
	});
	useEffect(() => setData({ ...data, method: value }), [value]);

	return (
		<Flex align={'center'} justify={'center'}>
			<FormControl width='90%'>
				<FormLabel
					htmlFor='token'
					textTransform='uppercase'
					fontSize='sm'
					fontWeight='bold'
					color='gray.300'>
					Super Token
				</FormLabel>
				<Flex align='center' justify='space-between' mb={7}>
					<Text
						onClick={onTokenOpen}
						cursor='pointer'
						py={2}
						px={8}
						w='30ch'
						bg={useColorModeValue('gray.100', 'gray.600')}
						borderRadius='md'
						position={'relative'}
						_after={{
							content: "''",
							position: 'absolute',
							right: '3',
							top: '50%',
							transform: 'translateY(-50%)',
							width: '30px',
							height: '30px',
							borderRadius: '50%',
							background: `url('${data?.icon}')`,
							backgroundSize: 'cover',
						}}>
						{token ? token : 'Select a Token'}
					</Text>
					<Button onClick={onTokenOpen}>
						{token ? 'Change Token' : 'Select a Token'}
					</Button>
				</Flex>
				<FormLabel
					htmlFor='token'
					textTransform='uppercase'
					fontSize='sm'
					fontWeight='bold'
					color='gray.300'>
					Investment Methods
				</FormLabel>
				<Flex align='center' justify='space-evenly' mb={7}>
					<CheckboxCard {...getCheckboxProps({ value: 'AAVE Tokens' })}>
						Aave
					</CheckboxCard>
					<CheckboxCard
						isDisabled
						{...getCheckboxProps({ value: 'ERC20 Tokens' })}>
						ERC20 Tokens
					</CheckboxCard>
				</Flex>
				<FormLabel
					htmlFor='duration'
					textTransform='uppercase'
					fontSize='sm'
					fontWeight='bold'
					color='gray.300'>
					Stream End Date
				</FormLabel>
				<Flex align='center' justify='center' mb={7}>
					<Calendar
						minDate={new Date()}
						date={data.endDate || new Date()}
						onChange={(date) => setData({ ...data, endDate: date })}
					/>
				</Flex>
			</FormControl>
		</Flex>
	);
};

export default CreateForm;
