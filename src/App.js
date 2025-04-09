import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Contact from './pages/Contact';
import MouseDetails from './pages/MouseDetails';
import Cart from './pages/Cart';
import { CartProvider } from './context/CartContext';
import AdminPanel from './pages/AdminPanel';

function App() {
    return (
        <div className="App">
            <CartProvider>
                <Router>
                    <NavBar />
                    <Routes>
                        <Route exact path="/" element={<Home />} />
                        <Route exact path="/menu" element={<Menu />} />
                        <Route exact path="/about" element={<About />} />
                        <Route exact path="/contact" element={<Contact />} />
                        <Route path="/mouseDetails" element={<MouseDetails />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/cart" element={<Cart />} />
                    </Routes>
                    <Footer />
                </Router>
            </CartProvider>
        </div>
    );
}

export default App;