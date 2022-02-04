import {
	Text,
	Heading,
	Divider,
	StatGroup,
	Stat,
	StatLabel,
	StatNumber,
	StatHelpText,
	StatArrow,
} from '@chakra-ui/react';
import Pools from '../../components/DHedge/Pools';
import Page from '../../components/layouts/Page';

const SuperDHedge = () => {
	return (
		<Page>
			<Heading as='h1' size='2xl'>
				Super dHEDGE
			</Heading>
			<Text>
				Stream into dHEDGE Pools in two clicks
				<br />
				<br />
				Let top Managers do the work for you. Check their track records and
				trading strategies.
			</Text>
			<StatGroup>
				<Stat>
					<StatLabel>Now Streaming</StatLabel>
					<StatNumber>$ 345,670</StatNumber>
					<StatHelpText>
						<StatArrow type='increase' />
						23.36%
					</StatHelpText>
				</Stat>

				<Stat>
					<StatLabel>Pools</StatLabel>
					<StatNumber>4</StatNumber>
				</Stat>
			</StatGroup>

			<Divider></Divider>

			<Heading as='h2' size='lg'>
				Pools
			</Heading>

			<Pools></Pools>
		</Page>
	);
};

export default SuperDHedge;
