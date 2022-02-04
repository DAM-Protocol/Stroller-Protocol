import { Flex, useDisclosure } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import PoolCard from '../layouts/PoolCard';
import InvestModal from './InvestModal';

const Pools = () => {
	const { onClose } = useDisclosure();

	const pools = [{}];

	let [searchParams] = useSearchParams();
	let pool = searchParams.get('pool');

	return (
		<>
			<InvestModal poolData={pools?.[pool]} isOpen={pool} onClose={onClose} />

			<Flex wrap={'wrap'} width='auto' justifyContent='space-evenly'>
				<PoolCard
					name={'Convex Strategies'}
					imageURL={
						'https://pbs.twimg.com/profile_images/1434774151340773384/ypAN0vSP_200x200.jpg'
					}
				/>
			</Flex>
		</>
	);
};

export default Pools;
