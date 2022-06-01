import React from 'react';
import { Link } from 'react-router-dom';

class Footer extends React.Component {

    render() {
        return (
            <footer className="container">
                <p className="float-right"><Link to="#">Subir</Link></p>
                <p>&copy; {new Date().getFullYear()} Mi Proyecto, Inc. &middot; <Link to="#">Política de Privacidad</Link> $middot; <Link to="#">Términos</Link></p>
            </footer>
        );
    }

}

export default Footer;