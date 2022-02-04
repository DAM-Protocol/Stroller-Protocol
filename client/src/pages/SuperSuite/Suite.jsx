import { Text, Heading, Divider, Stack } from '@chakra-ui/react';
import Page from '../../components/layouts/Page';
import ProductCard from '../../components/ProductCard';

const Suite = () => {
	return (
		<Page>
			<Heading as='h1' size='2xl'>
				Super Suite
			</Heading>
			<Text>Invest in Pools with Convenience</Text>
			<Divider />
			<Stack
				pt={10}
				direction={['column', 'column', 'row']}
				justify='space-evenly'>
				{PRODUCTS.map((product) => {
					return (
						<ProductCard
							key={product.title}
							title={product.title}
							description={product.description}
							imageURL={product.imageURL}
							chain={product.chain}
							disabled={product.disabled}
						/>
					);
				})}
			</Stack>
		</Page>
	);
};

const PRODUCTS = [
	{
		title: 'super-dHEDGE',
		description: (
			<>
				Stream into dHedge Pools in two clicks
				<br />
				<br />
				Let top Managers do the work for you. Check their track records and
				trading strategies.
			</>
		),
		imageURL:
			'https://www.newsbtc.com/wp-content/uploads/2020/09/dhedge-img.png',
		chain: 'Polygon',
		disabled: false,
	},
	{
		title: 'super-Enzyme',
		description: (
			<>
				Stream into Synths in two clicks
				<br />
				<br />
				Capture the price movements of popular cryptocurrencies, fiat
				currencies, stocks, commodities and more with zero slippage.
			</>
		),
		imageURL: 'https://d19czvic2hcumt.cloudfront.net/content/2020/11/291.jpg',
		chain: 'Chain',
		disabled: true,
	},
];

export default Suite;
