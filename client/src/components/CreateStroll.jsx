import {
	useDisclosure,
	Button,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	useToast,
} from '@chakra-ui/react';
import TokenSelector from './TokenModal/TokenSelector';
import CreateForm from './CreateForm/CreateForm';
import { useState, useContext } from 'react';
import { addDays } from 'date-fns';
import { SuperFluidContext } from '../context/SuperFluidContext';
import { useWeb3ExecuteFunction, useMoralis } from 'react-moralis';
import { ERC20_ABI } from '../abis/erc20';
import { REGISTRY_ABI } from '../abis/registry';
import {
	AAVE_STROLL_OUT_ADDRESS,
	REGISTRY_ADDRESS,
} from '../utils/contractAddresses';

const CreateStroll = ({ isOpen, onClose }) => {
	const [createStrollData, setCreateStrollData] = useState({
		token: '',
		tokenAddress: '',
		endDate: addDays(new Date(), 30),
	});
	const { defaultTokenLookup, sfProvider: provider } =
		useContext(SuperFluidContext);

	const { web3, user, Moralis } = useMoralis();
	const {
		isOpen: isTokenOpen,
		onOpen: onTokenOpen,
		onClose: onTokenClose,
	} = useDisclosure();
	const toast = useToast();

	const handleCreateStroll = async () => {
		console.log(defaultTokenLookup[createStrollData?.tokenAddress]);

		// get approval of ERC20 from user using ethers
		console.log(
			'time : ',
			new Date(createStrollData?.endDate).getTime() / 1000
		);

		try {
			let readOptions = {
				contractAddress:
					defaultTokenLookup[createStrollData?.tokenAddress].tk.aToken,
				functionName: 'allowance',
				abi: ERC20_ABI,
				params: {
					_owner: user.get('ethAddress'),
					_spender: AAVE_STROLL_OUT_ADDRESS,
				},
			};
			const allowance = await Moralis.executeFunction(readOptions);

			console.log(Moralis.Units.FromWei(allowance));
			if (Moralis.Units.FromWei(allowance) < 10000) {
				toast({
					title: 'Awaiting Approval',
					description: 'Approve AaveStrollOut with your Aave Tokens',
					status: 'info',
					duration: 15000,
					isClosable: true,
				});
				let sendOptions = {
					contractAddress:
						defaultTokenLookup[createStrollData?.tokenAddress]?.tk.aToken,
					functionName: 'approve',
					abi: ERC20_ABI,
					params: {
						_spender: AAVE_STROLL_OUT_ADDRESS,
						_value: '100000000000000000000000000000000000000000000000000',
					},
				};
				console.log(sendOptions);
				let transaction = await Moralis.executeFunction(sendOptions);
				console.log('Approval txHash', transaction.hash);
				let res = await transaction.wait();
				console.log('approved', res);
			}

			toast({
				title: 'Registering your Stroller',
				description: 'Adding your Stroller to the Registry',
				status: 'info',
				duration: 15000,
				isClosable: true,
			});
			let sendOptions = {
				contractAddress: REGISTRY_ADDRESS,
				functionName: 'createTopUp',
				abi: REGISTRY_ABI,
				params: {
					_superToken: createStrollData?.tokenAddress,
					_strategy: AAVE_STROLL_OUT_ADDRESS,
					_liquidityToken:
						defaultTokenLookup[createStrollData?.tokenAddress]?.tk.aToken,
					_time: Math.floor(
						new Date(createStrollData?.endDate).getTime() / 1000
					),
				},
			};
			let transaction = await Moralis.executeFunction(sendOptions);
			console.log('Approval txHash', transaction.hash);
			let res = await transaction.wait();
			console.log('approved', res);
			toast({
				title: 'Success!',
				description: 'Your Stroller has been added to the Registry',
				status: 'success',
				duration: 15000,
				isClosable: true,
			});
			onClose();
		} catch (err) {
			console.log(err);
			toast({
				title: 'Error',
				description: err.message,
				status: 'error',
				duration: 15000,
				isClosable: true,
			});
		}
	};

	return (
		<>
			<TokenSelector
				isOpen={isTokenOpen}
				onOpen={onTokenOpen}
				onClose={onTokenClose}
				data={createStrollData}
				setData={setCreateStrollData}
			/>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				isCentered
				motionPreset='slideInBottom'
				scrollBehavior='inside'
				closeOnEsc
				size='xl'>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Create a Stroll</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<CreateForm
							data={createStrollData}
							setData={setCreateStrollData}
							onTokenOpen={onTokenOpen}
						/>
					</ModalBody>
					<ModalFooter width={'100%'}>
						<Button variant='ghost' mr={3} onClick={onClose}>
							Close
						</Button>
						<Button onClick={handleCreateStroll} colorScheme='green'>
							Create the Stroll
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreateStroll;
