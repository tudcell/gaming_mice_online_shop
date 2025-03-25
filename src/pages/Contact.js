import React from 'react';
import HeaderImage from "../assets/maxresdefault.jpg";
import '../styles/Contact.css'

function Contact() {
    return (
        <div className="contact">
            <div className="leftSide"  style={{ backgroundImage: `url(${HeaderImage})` }}>

            </div>
            <div className="rightSide">
                <h1>Contact us </h1>
                <form id="contactForm" method="POST">
                    <label htmlFor='name'>Full Name</label>
                    <input name='name' placeholder={'Full Name '}  type={'text'}/>
                    <label htmlFor='email'>Email</label>
                    <input name='email' placeholder={'Enter your Email '}  type={'email'}/>
                    <label htmlFor='text'>Message</label>
                    <textarea rows={'6'} placeholder = 'Enter message ' name={'text'} required></textarea>
                    <button type={"submit"}>Send message</button>
                </form>
            </div>
        </div>
    );
}

export default Contact;