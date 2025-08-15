import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './shell/AppShell';
import { onTgReady } from './shared/telegram';
import RestaurantHome from './screens/RestaurantHome';
import DishDetails from './screens/DishDetails';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import { CartProvider } from './store/CartContext';

const queryClient = new QueryClient();

const router = createBrowserRouter([
	{
		path: '/',
		element: <AppShell />,
		children: [
			{ index: true, element: <RestaurantHome /> },
			{ path: 'dish/:slug', element: <DishDetails /> },
			{ path: 'cart', element: <CartScreen /> },
			{ path: 'checkout', element: <CheckoutScreen /> },
		],
	},
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<CartProvider>
				<RouterProvider router={router} />
			</CartProvider>
		</QueryClientProvider>
	</React.StrictMode>
);

onTgReady();


