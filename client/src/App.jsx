import { Suspense } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router';
import extendedTheme from './theme';
import DefaultLayout from './components/layouts/DefaultLayout';
import Loader from './components/Loader';
import React, { lazy } from 'react';
import { SuperFluidProvider } from './context/SuperFluidContext';
import { useMoralis } from 'react-moralis';
import { useEffect } from 'react';

const App = () => {
	const { isAuthenticated, enableWeb3, isWeb3Enabled, isWeb3EnableLoading } =
		useMoralis();
	useEffect(() => {
		if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, isWeb3Enabled]);
	return (
		<ChakraProvider theme={extendedTheme}>
			<SuperFluidProvider>
				<DefaultLayout>
					<Routes>
						<Route path='/'>
							{paths.map(({ path, component }) => (
								<Route
									key={path}
									path={path}
									element={
										<Suspense fallback={<Loader />}>
											{React.createElement(component)}
										</Suspense>
									}></Route>
							))}
							{/* <Route path='*' element={<>Not Found</>} /> */}
							<Route path='*' element={<Navigate to='/404' />} />
						</Route>
					</Routes>
				</DefaultLayout>
			</SuperFluidProvider>
		</ChakraProvider>
	);
};

const paths = [
	{
		path: '/',
		component: lazy(() => import('./pages/Landing')),
	},
	{
		path: '/dashboard',
		component: lazy(() => import('./pages/Dashboard')),
	},
	{
		path: '404',
		component: lazy(() => import('./pages/NotFound')),
	},
];

export default App;
