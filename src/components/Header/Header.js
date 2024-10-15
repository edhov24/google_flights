import React from 'react';
import "./Header.scss";

function Header() {
    return (
        <div className="header">
            <div className="header-img-container">
                <img src="/images/background.png" alt="background-img"/>
                <h3>Flights</h3>
            </div>
        </div>
    );
}

export default Header;