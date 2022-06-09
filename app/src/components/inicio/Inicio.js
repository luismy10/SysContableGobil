import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { signOut, closeProject } from '../../redux/actions';
import Menu from '../layouts/menu/Menu';
import Head from '../layouts/head/Head';
import Footer from '../layouts/footer/Footer';
import Main from './Main';
import Dashboard from '../dashboard/Dashboard';
import Clientes from '../facturacion/Clientes';
import Ventas from '../facturacion/Ventas';
import Cobros from '../facturacion/Cobros';
import Creditos from '../facturacion/Creditos';
import Cotizaciones from '../facturacion/Cotizaciones';
import Reservas from '../facturacion/Reservas';
import Monedas from '../ajustes/Monedas';
import Comprobantes from '../ajustes/Comprobantes';
import Impuestos from '../ajustes/Impuestos';
import Bancos from '../ajustes/Bancos';
import BancoDetalle from '../ajustes/registros/BancoDetalle';
import Sedes from '../ajustes/Sedes';
import Proyectos from '../ajustes/Proyectos';
import ProcesoProyecto from '../ajustes/proyecto/ProcesoProyecto';
import Manzanas from '../logistica/Manzanas';
import Lotes from '../logistica/Lotes';
import LoteDetalle from '../logistica/registro/LoteDetalle';
import VentaProceso from '../facturacion/registros/VentaProceso';
import VentaDetalle from '../facturacion/registros/VentaDetalle';
import ClienteProceso from '../facturacion/registros/ClienteProceso';
import CobroProceso from '../facturacion/registros/CobroProceso';
import CobroDetalle from '../facturacion/registros/CobroDetalle';
import GastoProceso from '../tesoreria/registros/GastoProceso';
import GastoDetalle from '../tesoreria/registros/GastoDetalle';
import CreditoProceso from '../facturacion/registros/CreditoProceso';
import Perfiles from '../seguridad/Perfiles';
import Usuarios from '../seguridad/Usuarios';
import Accesos from '../seguridad/Accesos';
import UsuarioProceso from '../seguridad/registros/UsuarioProceso';
import Conceptos from '../tesoreria/Conceptos';
import Gastos from '../tesoreria/Gastos';
import RepVentas from '../reporte/RepVentas';
import RepFinanciero from '../reporte/RepFinanciero';
import RepLotes from '../reporte/RepLotes';
import RepClientes from '../reporte/RepClientes';

import logoEmpresa from '../../recursos/images/INMOBILIARIA.png';


import PlanCuenta from '../contabilidad/PlanCuentas';
import Asiento from '../contabilidad/Asientos';
import AsientoProceso from '../contabilidad/registros/AsientoProceso';
import AsientoDetalle from '../contabilidad/registros/AsientoDetalle'
import ReporteContable from '../contabilidad/ReporteContables';

import RepLibroDiario from '../contabilidad/reportes/RepLibroDiario';
import RepLibroMayor from '../contabilidad/reportes/RepLibroMayor';
import RepEstadoResultado from '../contabilidad/reportes/RepEstadoResultados';
import RepBalanceGeneral from '../contabilidad/reportes/RepBalanceGeneral';
import RepMovimientoCuentaContable from '../contabilidad/reportes/RepMovimientoCuentaContable';
import RepDiferinciaCambioBanco from '../contabilidad/reportes/RepDiferinciaCambioBanco';
import RepAuxiliarTercero from '../contabilidad/reportes/RepAuxiliarTercero';

import Almacenes from '../inventario/Almacenes';
import Productos from '../inventario/Productos';
import ProductoProceso from '../inventario/registros/ProductoProceso';
import AjusteInventario from '../inventario/AjusteInventario';
import AjusteInventarioProceso from '../inventario/registros/AjusteInventarioProceso';

const Page404 = (props) => {
    return (
        <div className="px-4 py-5 my-5 text-center">
            <img className="d-block mx-auto mb-4" src={logoEmpresa} alt="Logo" width="150" />
            <h1 className="display-5 fw-bold">Error 404 página no encontrada</h1>
            <div className="col-lg-6 mx-auto">
                <p className="lead mb-4">No se encuentra la página que ha solicitado.</p>
                <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                    <button type="button" onClick={() => props.history.goBack()} className="btn btn-outline-secondary btn-lg px-4"><i className="bi bi-arrow-left"></i> Regresar</button>
                </div>
            </div>
        </div>
    )
}


class Inicio extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isModal: false
        }
    }

    componentDidMount() {
        window.addEventListener('focus', this.onEventFocused);
        window.addEventListener('resize', this.onEventResize);
        window.addEventListener('click', this.onEventClick);
    }

    componentWillUnmount() {
        window.removeEventListener('focus', this.onEventFocused);
        window.removeEventListener('resize', this.onEventResize);
        window.removeEventListener('click', this.onEventClick);
    }

    onEventFocused = (event) => {
        let userToken = window.localStorage.getItem('login');
        if (userToken === null) {
            this.props.restore();
            this.props.history.push("login");
        } else {
            let tokenCurrent = JSON.parse(userToken);
            let tokenOld = this.props.token.userToken;
            if (tokenCurrent.token !== tokenOld.token) {
                window.location.href = "/";
                return;
            }

            let projectToken = window.localStorage.getItem('project');
            if (projectToken === null) {
                this.props.restoreProject();
            }
        }
    }

    onEventResize(event) {
        if (event.target.innerWidth <= 768 && document.getElementById("sidebar").classList.contains("active")) {
            document.getElementById("sidebar").classList.remove("active");
        }
    }

    onEventClick = (event) => {
        let sidebar = document.getElementById("sidebar");
        let overlaySidebar = document.getElementById("overlay-sidebar");
        if (!(event.target !== overlaySidebar && !this.isChild(event.target, overlaySidebar))) {
            sidebar.classList.remove("toggled");
            sidebar.removeChild(overlaySidebar)
        }
    }

    isChild = (child, parent) => {
        while ((child = child.parentNode) && child !== parent);
        return !!child;
    }

    openAndClose = () => {
        let windowWidth = window.innerWidth;
        if (windowWidth <= 768) {
            document.getElementById("sidebar").classList.add("toggled");

            let overlay = document.createElement("div");
            overlay.setAttribute("id", "overlay-sidebar")
            overlay.setAttribute("role", "button");
            overlay.setAttribute("tabindex", "0");
            overlay.setAttribute("aria-label", "overlay");
            overlay.classList.add("overlay");
            document.getElementById("sidebar").appendChild(overlay);
        } else {
            document.getElementById("sidebar").classList.toggle("active");
        }
    }

    render() {
        if (this.props.token.userToken == null) {
            return <Redirect to="/login" />
        }

        if (this.props.token.project === null) {
            return <Redirect to="/principal" />
        }

        const { path, url } = this.props.match;
        return (
            <div className='app'>
                <Menu  {...this.props} url={url} />

                <main className="position-relative">
                    <Head {...this.props} openAndClose={this.openAndClose} />

                    <div className="container-fluid mt-3">
                        <div className="bg-white p-3 border border-light-purple rounded">

                            <Switch>
                                <Route
                                    path="/inicio"
                                    exact={true}>
                                    <Redirect to={`${path}/main`} />
                                </Route>
                                <Route
                                    path={`${path}/main`}
                                    render={(props) => <Main {...props} />}
                                />
                                <Route
                                    path={`${path}/dashboard`}
                                    render={(props) => <Dashboard {...props} />}
                                />
                                <Route
                                    path={`${path}/perfiles`}
                                    render={(props) => <Perfiles {...props} />}
                                />
                                <Route
                                    path={`${path}/usuarios`}
                                    exact={true}
                                    render={(props) => <Usuarios {...props} />}
                                />
                                <Route
                                    path={`${path}/usuarios/proceso`}
                                    exact={true}
                                    render={(props) => <UsuarioProceso {...props} />}
                                />

                                <Route
                                    path={`${path}/accesos`}
                                    render={(props) => <Accesos {...props} />}
                                />
                                <Route
                                    path={`${path}/clientes`}
                                    exact={true}
                                    render={(props) => <Clientes {...props} />}
                                />
                                <Route
                                    path={`${path}/clientes/proceso`}
                                    exact={true}
                                    render={(props) => <ClienteProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/ventas`}
                                    exact={true}
                                    render={(props) => <Ventas {...props} />}
                                />
                                <Route
                                    path={`${path}/ventas/proceso`}
                                    exact={true}
                                    render={(props) => <VentaProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/ventas/detalle`}
                                    exact={true}
                                    render={(props) => <VentaDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/cobros`}
                                    exact={true}
                                    render={(props) => <Cobros {...props} />}
                                />
                                <Route
                                    path={`${path}/cobros/proceso`}
                                    exact={true}
                                    render={(props) => <CobroProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/cobros/detalle`}
                                    exact={true}
                                    render={(props) => <CobroDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/creditos`}
                                    exact={true}
                                    render={(props) => <Creditos {...props} />}
                                />
                                <Route
                                    path={`${path}/creditos/proceso`}
                                    exact={true}
                                    render={(props) => <CreditoProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/cotizaciones`}
                                    render={(props) => <Cotizaciones {...props} />}
                                />
                                <Route
                                    path={`${path}/reservas`}
                                    render={(props) => <Reservas {...props} />}
                                />
                                <Route
                                    path={`${path}/monedas`}
                                    render={(props) => <Monedas {...props} />}
                                />
                                <Route
                                    path={`${path}/comprobantes`}
                                    render={(props) => <Comprobantes {...props} />}
                                />
                                <Route
                                    path={`${path}/bancos`}
                                    exact={true}
                                    render={(props) => <Bancos {...props} />}
                                />
                                <Route
                                    path={`${path}/bancos/detalle`}
                                    exact={true}
                                    render={(props) => <BancoDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/sedes`}
                                    render={(props) => <Sedes {...props} />}
                                />
                                <Route
                                    path={`${path}/proyectos`}
                                    exact={true}
                                    render={(props) => <Proyectos {...props} />}
                                />
                                <Route
                                    path={`${path}/proyectos/proceso`}
                                    exact={true}
                                    render={(props) => <ProcesoProyecto {...props} />}
                                />
                                <Route
                                    path={`${path}/impuestos`}
                                    render={(props) => <Impuestos {...props} />}
                                />
                                <Route
                                    path={`${path}/manzanas`}
                                    render={(props) => <Manzanas {...props} />}
                                />
                                <Route
                                    path={`${path}/lotes`}
                                    exact={true}
                                    render={(props) => <Lotes {...props} />}
                                />
                                <Route
                                    path={`${path}/lotes/detalle`}
                                    exact={true}
                                    render={(props) => <LoteDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/conceptos`}
                                    render={(props) => <Conceptos {...props} />}
                                />
                                <Route
                                    path={`${path}/gastos`}
                                    exact={true}
                                    render={(props) => <Gastos {...props} />}
                                />
                                <Route
                                    path={`${path}/gastos/proceso`}
                                    exact={true}
                                    render={(props) => <GastoProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/gastos/detalle`}
                                    exact={true}
                                    render={(props) => <GastoDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/repventas`}
                                    render={(props) => <RepVentas {...props} />}
                                />
                                <Route
                                    path={`${path}/repfinanciero`}
                                    render={(props) => <RepFinanciero {...props} />}
                                />
                                <Route
                                    path={`${path}/replotes`}
                                    render={(props) => <RepLotes {...props} />}
                                />
                                <Route
                                    path={`${path}/RepClientes`}
                                    render={(props) => <RepClientes {...props} />}
                                />


                                <Route
                                    path={`${path}/plancuenta`}
                                    exact={true}
                                    render={(props) => <PlanCuenta {...props} />}
                                />
                                <Route
                                    path={`${path}/asiento`}
                                    exact={true}
                                    render={(props) => <Asiento {...props} />}
                                />
                                <Route
                                    path={`${path}/asiento/proceso`}
                                    exact={true}
                                    render={(props) => <AsientoProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/asiento/detalle`}
                                    exact={true}
                                    render={(props) => <AsientoDetalle {...props} />}
                                />
                                <Route
                                    path={`${path}/repcontable`}
                                    exact={true}
                                    render={(props) => <ReporteContable {...props} />}
                                />

                                <Route
                                    path={`${path}/repcontable/librodiario`}
                                    exact={true}
                                    render={(props) => <RepLibroDiario {...props} />}
                                />
                                <Route
                                    path={`${path}/repcontable/libromayor`}
                                    exact={true}
                                    render={(props) => <RepLibroMayor {...props} />}
                                />
                                <Route
                                    path={`${path}/repcontable/estadoresultado`}
                                    exact={true}
                                    render={(props) => <RepEstadoResultado {...props} />}
                                />
                                <Route
                                    path={`${path}/repcontable/balancegeneral`}
                                    exact={true}
                                    render={(props) => <RepBalanceGeneral {...props} />}
                                />
                                <Route
                                    path={`${path}/repcontable/movcuentacontable`}
                                    exact={true}
                                    render={(props) => <RepMovimientoCuentaContable {...props} />}
                                />
                                <Route
                                    path={`${path}/repcontable/difcambiobanco`}
                                    exact={true}
                                    render={(props) => <RepDiferinciaCambioBanco {...props} />}
                                />
                                <Route
                                    path={`${path}/repcontable/auxiliartercero`}
                                    exact={true}
                                    render={(props) => <RepAuxiliarTercero {...props} />}
                                />

                                {
                                    // Inventario
                                }

                                <Route
                                    path={`${path}/almacen`}
                                    exact={true}
                                    render={(props) => <Almacenes {...props} />}
                                />
                                <Route
                                    path={`${path}/producto`}
                                    exact={true}
                                    render={(props) => <Productos {...props} />}
                                />
                                <Route
                                    path={`${path}/producto/proceso`}
                                    exact={true}
                                    render={(props) => <ProductoProceso {...props} />}
                                />
                                <Route
                                    path={`${path}/ajusteinventario`}
                                    exact={true}
                                    render={(props) => <AjusteInventario {...props} />}
                                />
                                <Route
                                    path={`${path}/ajusteinventario/proceso`}
                                    exact={true}
                                    render={(props) => <AjusteInventarioProceso {...props} />}
                                />


                                <Route component={Page404} />
                            </Switch>
                        </div>
                    </div>
                    <Footer />
                </main>

            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        restore: () => dispatch(signOut()),
        restoreProject: () => dispatch(closeProject())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Inicio);
