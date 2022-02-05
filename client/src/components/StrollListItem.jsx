import {
	AccordionButton,
	AccordionItem,
	AccordionPanel,
	Flex,
	Text,
	Image,
	AccordionIcon,
	Box,
	Button,
} from '@chakra-ui/react';

const StrollListItem = () => {
	return (
		<AccordionItem>
			<Flex align='center' justify='space-around'>
				<h1 flex={1}>
					<AccordionButton>
						<AccordionIcon />
					</AccordionButton>
				</h1>
				<Image
					mr={3}
					boxSize={'30px'}
					src='https://s2.coinmarketcap.com/static/img/coins/200x200/4943.png'
					alt='dai'
				/>
				<Text flex={5}>Token</Text>
				<Text flex={8}>Duration</Text>
				<Text flex={8}>Returns</Text>
			</Flex>
			<AccordionPanel pb={4}>
				<Text>LP Tokens</Text>
				<Flex>
					<Box>
						<Image />
						<Text>Token name</Text>
						<Text>Lending Protocol</Text>
						<Text>Approve Amount</Text>
						<Button>Revoke</Button>
						<Button>Approve More</Button>
					</Box>
				</Flex>
			</AccordionPanel>
		</AccordionItem>
	);
};

export default StrollListItem;

// Icon
// Yeild Token Name
// Returns
// Duration

// LP Token Name
// approved amount
// revoke button
// platform
