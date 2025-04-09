import React, { useState, useContext } from 'react';
import "../styles/NavBar.css";
import logo from '../assets/Orange Minimalist Viking Gaming Logo.png';
import { Link } from 'react-router-dom';
import ReorderIcon from "@mui/icons-material/Reorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { CartContext } from '../context/CartContext';

function NavBar() {
    const [openLinks, setOpenLinks] = useState(false);
    const { cart } = useContext(CartContext);

    const toggleNavBar = () => {
        setOpenLinks(!openLinks);
    };

    // Calculate total items in cart
    const cartItemCount = cart ? cart.reduce((total, item) => total + (item.quantity || 1), 0) : 0;

    return(
        <div className='navbar'>
            <div className='leftSide' id={openLinks ? "open" : "close"}>
                <img src={logo} alt="Logo" />
                <div className="hiddenLinks">
                    <Link to="/">Home</Link>
                    <Link to="/menu">Mice Catalog</Link>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/cart">Cart</Link>
                </div>
            </div>
            <div className='rightSide'>
                <Link to="/">Home</Link>
                <Link to="/menu">Mice Catalog</Link>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/cart" className='cart-icon'>
                    <ShoppingCartIcon />
                    {cartItemCount > 0 && (
                        <span className="cart-count">{cartItemCount}</span>
                    )}
                </Link>
                <button onClick={toggleNavBar}>
                    <ReorderIcon />
                </button>
            </div>
        </div>
    );
}

export default NavBar;