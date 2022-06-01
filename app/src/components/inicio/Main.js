import React from 'react';
import Logo from '../../recursos/images/INMOBILIARIA.png';

class Main extends React.Component {


    render() {
        return (
            <div className="px-4 py-5 my-5 text-center">
                <img className="d-block mx-auto mb-4" src={Logo} alt="Logo" width="240" />
              
                <div className="col-lg-6 mx-auto">
                    <p className="lead mb-4">Administra los procesos de la venta de terrenos desde una sola plataforma, con los modulos dashboard, seguridad, facturación, logística, tesorería, ajuste y reportes.</p>
                </div>
            </div>
        )
    }
}

export default Main;