import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import { Route, Routes } from 'react-router-dom';
import Generator from './pages/Generator';
import Result from './pages/Results';
import MyGenerations from './pages/MyGenerations';
import Community from './pages/Community';
import Plans from './pages/Plans';
import Loading from './pages/Loading';
import { Toaster } from 'react-hot-toast';

function App() {
	return (
		<> 
		    <Toaster
				toastOptions={{
					style: {
						background: 'var(--toast-bg)',
						border: '1px solid var(--toast-border)',
						color: 'var(--toast-color)',
					},
				}}
			/>
			<SoftBackdrop />
			<LenisScroll />
			<Navbar />

			<main className="relative z-10 min-h-screen">
				<Routes>
					<Route path="/" element={<Home/>} />
					<Route path="/generate" element={<Generator/>} />
					<Route path="/result/:projectId" element={<Result/>} />
					
					<Route path="/my-generations" element={<MyGenerations/>} />

					<Route path="/community" element={<Community/>} />
					
					<Route path="/plans" element={<Plans/>} />
					
					<Route path="/loading" element={<Loading/>} />
					
				</Routes>
			</main>			
			<Footer />
		</>
	);
}
export default App;
