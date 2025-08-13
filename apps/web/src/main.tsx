import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './shell/AppShell';
import { onTgReady } from './shared/telegram';
import WheelScreen from './screens/WheelScreen';
import CasinoScreen from './screens/CasinoScreen';
import AuctionScreen from './screens/AuctionScreen';
import ProfileScreen from './screens/ProfileScreen';
import TasksShopScreen from './screens/TasksShopScreen';

const queryClient = new QueryClient();

const router = createBrowserRouter([
	{
		path: '/',
		element: <AppShell />,
		children: [
			{ index: true, element: <WheelScreen /> },
			{ path: 'casino', element: <CasinoScreen /> },
			{ path: 'auction', element: <AuctionScreen /> },
			{ path: 'profile', element: <ProfileScreen /> },
			{ path: 'tasks', element: <TasksShopScreen /> },
		],
	},
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</React.StrictMode>
);

onTgReady();


