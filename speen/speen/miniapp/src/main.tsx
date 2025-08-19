import React from 'react'
import { createRoot } from 'react-dom/client'
import { WheelLoader } from './wheel/WheelLoader'
import { GameScreen } from './GameScreen'
import './styles.css'

const container = document.getElementById('root')!
const root = createRoot(container)

function App() {
	const [loading, setLoading] = React.useState(true)
	return loading ? <WheelLoader onDone={() => setLoading(false)} /> : <GameScreen />
}

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)


