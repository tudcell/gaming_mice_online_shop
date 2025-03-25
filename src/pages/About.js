import React from 'react';
import HeaderImage from "../assets/maxresdefault.jpg";
import '../styles/About.css'
function About() {
    return (
        <div className = "about" >
            <div className="aboutTop" style={{ backgroundImage: `url(${HeaderImage})` }}></div>
            <div className="aboutBottom">
                <h1>Our vision</h1>
                <p>DLKJHAHSKJAWJKHAHJK JHKSA SJAHS KJS AKJHSHKA HJSA KSKAJKJHS AKJSHKJ HSKJ SAKKJASKSAKJSAAHJKSKJ KJSHJKA HASKHJ</p>
            </div>
        </div>
    );
}

export default About;