import {
	IconButton,
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	Image,
} from '@chakra-ui/react';
import { FaBell } from 'react-icons/fa';

const Notifications = () => {
	return (
		<Menu>
			<MenuButton
				as={IconButton}
				size='md'
				fontSize='xl'
				aria-label={`Notifications`}
				variant='ghost'
				color={'current'}
				icon={<FaBell />}
				_after={{
					content: '""',
					display: 'block',
					width: '0.5rem',
					height: '0.5rem',
					borderRadius: '50%',
					backgroundColor: 'red.500',
					position: 'absolute',
					top: '0.5rem',
					right: '0.5rem',
				}}
			/>

			<MenuList w={'xs'}>
				<MenuItem>
					<Image
						boxSize='2rem'
						borderRadius='full'
						src='https://placekitten.com/100/100'
						alt='Fluffybuns the destroyer'
						mr='12px'
					/>
					Notif 1
				</MenuItem>
			</MenuList>
		</Menu>
	);
};

export default Notifications;
