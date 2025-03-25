import React from 'react'
import InstagramIcon from '@mui/icons-material/Instagram'
import '../styles/Footer.css'


function Footer() {
    return (
        <div className="footer">
            <div className='socialMedia'>
                <InstagramIcon />
            </div>
            <p>&copy; 2025; MouzArena.com</p>
        </div>
    )
}
export default Footer