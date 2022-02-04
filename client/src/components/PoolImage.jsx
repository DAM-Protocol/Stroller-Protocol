import { Box, Image } from '@chakra-ui/react';

const ProductImage = ({ imageURL }) => {
	return (
		<Box rounded={'sm'} mt={-12} pos={'relative'} h={20} w={20} mx={'auto'}>
			<Image
				rounded={'lg'}
				h={20}
				objectFit={'cover'}
				filter={'drop-shadow(0px 0px 10px #0000001d)'}
				src={imageURL}
			/>
		</Box>
	);
};
export default ProductImage;
