import { useMoralis } from 'react-moralis';
import makeBlockie from 'ethereum-blockies-base64';
import {
	Flex,
	Link,
	useColorModeValue,
	Avatar,
	Button,
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	MenuDivider,
	Center,
	HStack,
	Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useMoralisDapp } from '../../../context/MoralisDappProvider';

const UserMenu = () => {
	const { user, authenticate, logout } = useMoralis();
	const { chainId } = useMoralisDapp();

	return user ? (
		<Menu>
			<Button
				size='md'
				variant='outline'
				colorScheme='red'
				onClick={() => authenticate()}>
				{chainId === '0x80001' ? <>Mumbai Testnet</> : 'Wrong Network'}
			</Button>
			<MenuButton
				as={Button}
				rounded={'full'}
				variant={'link'}
				cursor={'pointer'}
				minW={0}>
				<Avatar
					size={'sm'}
					src={makeBlockie(user?.get('ethAddress')) || '0x'}
				/>
			</MenuButton>
			<MenuList alignItems={'center'} boxShadow={'lg'}>
				<Center>
					<Avatar
						size={'xl'}
						src={makeBlockie(user?.get('ethAddress') || '0x')}
					/>
				</Center>
				<Center>
					<Text maxW='10ch' isTruncated>
						{user?.get('ethAddress') || '0x'}
					</Text>
				</Center>
				<MenuDivider />
				<MenuItem as={RouterLink} to='/settings'>
					{/* <RouterLink to='/settings'>Settings</RouterLink> */}
					Settings
				</MenuItem>
				<MenuItem onClick={() => logout()}>Log Out</MenuItem>
			</MenuList>
		</Menu>
	) : (
		<>
			<Button
				size='md'
				variant='outline'
				colorScheme='red'
				onClick={() => authenticate()}>
				Wrong Network
			</Button>
			<Button
				size='md'
				variant='outline'
				colorScheme='red'
				onClick={() => authenticate()}>
				Connect
			</Button>
		</>
	);
};
export default UserMenu;
