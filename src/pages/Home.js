import React from 'react'
import {Link} from 'react-router-dom'
import BannerImage from '../assets/black-and-orange-1920-x-1080-wallpaper-dussdkrf5augcgog.jpg'
import '../styles/Home.css'
function Home(){
    return(
        <div className="home" style={{ backgroundImage: `url(${BannerImage})` }}>
            <div className="headerContainer" >
                <h1>MouzArena</h1>
                <p> Gaming mice that quench your thirst for competitive gaming.</p>
                <Link to="/menu">
                    <button>Order now!</button>
                </Link>

            </div>
        </div>
    )
}

export default Home;