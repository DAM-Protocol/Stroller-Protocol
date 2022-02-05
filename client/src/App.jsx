import { Suspense } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router';
import extendedTheme from './theme';
import DefaultLayout from './components/layouts/DefaultLayout';
import Loader from './components/Loader';
import React, { lazy } from 'react';

const App = () => {
	return (
		<ChakraProvider theme={extendedTheme}>
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
		path: '/Super-Suite',
		component: lazy(() => import('./pages/SuperSuite/Suite')),
	},
	{
		path: '/Super-dHEDGE',
		component: lazy(() => import('./pages/DHedge')),
	},
	{
		path: '404',
		component: lazy(() => import('./pages/NotFound')),
	},
];

export default App;
