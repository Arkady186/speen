import React from 'react'
import { createRoot } from 'react-dom/client'
import { WheelLoader } from './wheel/WheelLoader'
import './styles.css'

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(
	<React.StrictMode>
		<WheelLoader />
	</React.StrictMode>
)


