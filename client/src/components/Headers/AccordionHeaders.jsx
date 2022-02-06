import { Flex, Text, useColorModeValue } from '@chakra-ui/react';

const AccordionHeaders = () => {
	return (
		<Flex
			align='center'
			justify='space-between'
			color={useColorModeValue('gray.700', 'gray.500')}
			px={8}
			py={5}
			borderRadius='lg'>
			<Text textAlign='center' fontWeight='bold' fontSize='sm' flex={2}>
				#
			</Text>
			<Text textAlign='center' fontWeight='bold' fontSize='sm' flex={3}>
				SYM
			</Text>
			<Text textAlign='center' fontWeight='bold' fontSize='sm' flex={6}>
				Super Token
			</Text>
			<Text textAlign='center' fontWeight='bold' fontSize='sm' flex={8}>
				Stream Rate (/s)
			</Text>
			<Text textAlign='center' fontWeight='bold' fontSize='sm' flex={8}>
				Total Allowance
			</Text>
			<Text textAlign='center' fontWeight='bold' fontSize='sm' flex={8}>
				Balance
			</Text>
		</Flex>
	);
};

export default AccordionHeaders;
