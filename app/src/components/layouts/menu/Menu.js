import React from "react";
import { NavLink } from 'react-router-dom';
import icono from '../../../recursos/images/inmobiliarianav.png';

const Menu = ({ url, token: { project, userToken } }) => {
    return (
        <nav id="sidebar">
            <div className='pro-sidebar-inner'>
                <div className='pro-sidebar-layout'>
                    <div className="sidebar-header">
                        <img className="d-block mx-auto mb-4" src={icono} alt="Logo" width="150" />
                        {/* <h5>INMOBILIARIA GMYC</h5> */}
                    </div>

                    <ul className="list-unstyled components">
                        <p>{project.nombre}</p>
                        <div className="line"></div>
                        {
                            userToken.menus.map((menu, index) => (
                                menu.submenu.length === 0 && menu.estado === 1 ?
                                    <li key={index}>
                                        <NavLink to={`${url}/${menu.ruta}`}
                                            className="pro-inner-item"
                                            activeClassName='active-link'
                                            role="button">
                                            <span className="pro-icon-wrapper">
                                                <span className="pro-icon">
                                                    {<i className={menu.icon}></i>}
                                                </span>
                                            </span>
                                            <span className="pro-item-content">
                                                {menu.nombre}
                                            </span>
                                        </NavLink>
                                    </li>
                                    :

                                    menu.submenu.filter(submenu => submenu.estado === 1).length !== 0 ?
                                        <li key={index}>
                                            <a href={"#mn" + index}
                                                data-bs-toggle="collapse"
                                                aria-expanded="false"
                                                className="pro-inner-item"
                                                role="button">
                                                <span className="pro-icon-wrapper">
                                                    <span className="pro-icon">
                                                        {<i className={menu.icon}></i>}
                                                    </span>
                                                </span>
                                                <span className="pro-item-content">
                                                    {menu.nombre}
                                                </span>
                                                <span className="suffix-wrapper">
                                                    <span className="badge yellow">{menu.submenu.filter(submenu => submenu.estado === 1).length}</span>
                                                </span>
                                                <span className="pro-arrow-wrapper">
                                                    <span className="pro-arrow"></span>
                                                </span>
                                            </a>

                                            <ul className="collapse list-unstyled transition-03" id={"mn" + index}>
                                                {
                                                    menu.submenu.map((submenu, indexm) => (
                                                        submenu.estado === 1 ?
                                                            <li key={indexm}>
                                                                <NavLink to={`${url}/${submenu.ruta}`}
                                                                    className="pro-inner-item"
                                                                    activeClassName='active-link'
                                                                    role="button">
                                                                    <span className="pro-icon-wrapper">
                                                                        <span className="pro-icon">
                                                                            <i className="fa fa-minus"></i>
                                                                        </span>
                                                                    </span>
                                                                    <span className="pro-item-content">
                                                                        {submenu.nombre}
                                                                    </span>
                                                                </NavLink>
                                                            </li>
                                                            :
                                                            null
                                                    ))
                                                }
                                            </ul>
                                        </li>

                                        :
                                        null
                            ))
                        }
                    </ul>

                    <ul className="list-unstyled sidebar-footer">
                        <li>
                            <span className="article">
                                {userToken.nombres + " " + userToken.apellidos}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
export default Menu;