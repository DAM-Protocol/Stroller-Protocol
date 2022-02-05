import {
	AccordionButton,
	AccordionItem,
	AccordionPanel,
	Flex,
	Text,
	Image,
	AccordionIcon,
	useColorModeValue,
} from '@chakra-ui/react';
import LPTokenCard from './LPTokenCard';

const StrollListItem = () => {
	return (
		<AccordionItem>
			<Flex
				align='center'
				justify='space-around'
				bg={useColorModeValue('gray.100', 'gray.700')}
				px={5}
				py={3}
				my={2}
				borderRadius='lg'>
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
				{/* <Heading as='h3'>LP Tokens</Heading> */}
				<Flex flexWrap='wrap' align='center'>
					<LPTokenCard token='aUSDC' protocol='AAVE' appAmount={0} />
					<LPTokenCard token='SMLP' protocol='Beefy' appAmount={10} />
					<LPTokenCard token='aUSDT' protocol='AAVE' appAmount={5} />
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
