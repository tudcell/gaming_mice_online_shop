import React, { useState} from 'react';
import "../styles/NavBar.css";
import logo from '../assets/Orange Minimalist Viking Gaming Logo.png';
import {Link} from 'react-router-dom'
import ReorderIcon from "@mui/icons-material/Reorder"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"

function NavBar(){

    const [openLinks, setOpenLinks] = useState(false)
    const toggleNavBar = () =>{
        setOpenLinks(!openLinks)
    }



    return(
        <div className='navbar'>
            <div className='leftSide' id={openLinks ? "open" : "close"}>
                <img src = {logo} />
                <div className="hiddenLinks">
                    <Link to="/">Home</Link>
                    <Link to="/menu">Mice Catalog</Link>
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                </div>
            </div>
            <div className='rightSide'>
                <Link to="/">Home</Link>
                <Link to="/menu">Mice Catalog</Link>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/cart" className = 'cart-icon'> <ShoppingCartIcon /> </Link>
                <button onClick={toggleNavBar}>
                    <ReorderIcon />
                </button>

            </div>
        </div>
    )
}

export default NavBar