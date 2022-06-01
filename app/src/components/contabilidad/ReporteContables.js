import React from 'react';
import axios from 'axios';
import {
    viewModal,
    clearModal,
    showModal,
    spinnerLoading,
    currentDate
} from '../tools/Tools';
import Paginacion from '../tools/Paginacion';

class ReporteContables extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            loadModal: false,
            msgModal: 'Cargando datos...',
            messageWarning: '',
        }

        this.refFechaIni = React.createRef();
        this.refFechaFin = React.createRef();

        this.abortControllerView = new AbortController()
    }


    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {

        viewModal("modal", () => {
            this.abortControllerModal = new AbortController();
            this.loadData()
        });

        clearModal("modal", async () => {
            this.abortControllerModal.abort();

            await this.setStateAsync({

                isFechaActive: false,
                loadModal: false,
                msgModal: 'Cargando datos...',
                messageWarning: '',
            });

        });
    }

    async openModal() {
        showModal('modal')
        await this.setStateAsync({ loadModal: true });
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    loadData = async () => {
        try {
            // const comprobante = await axios.get("/api/comprobante/listcombo", {
            //     signal: this.abortControllerView.signal,
            //     params: {
            //         "tipo": "1"
            //     }
            // });


            await this.setStateAsync({
                // comprobantes: comprobante.data,

                loadModal: false,
                fechaIni: currentDate(),
                fechaFin: currentDate()
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgModal: "Se produjo un error interno, intente nuevamente.",
                });
            }
        }
    }

    render() {
        return (
            <>

                {/*inicio modal*/}
                <div className="modal fade" id="modal" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Balance de operaciones con terceros</h5>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {
                                    this.state.loadModal ?
                                        <div className="clearfix absolute-all bg-white">
                                            {spinnerLoading(this.state.msgModal)}
                                        </div>
                                        : null
                                }

                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <span>Filtro por fechas</span>
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="customSwitch1"
                                                checked={this.state.isFechaActive}
                                                onChange={(event) => {
                                                    this.setState({ isFechaActive: event.target.checked, fechaIni: currentDate(), fechaFin: currentDate(), messageWarning: '' })
                                                }}
                                            >
                                            </input>
                                            <label className="custom-control-label" htmlFor="customSwitch1">{this.state.isFechaActive ? 'Activo' : 'Inactivo'}</label>
                                        </div>
                                    </div>

                                </div>

                                <div className="form-row">

                                    <div className="form-group col-md-6">
                                        <span>Fecha inicial <i className="fa fa-asterisk text-danger small"></i></span>
                                        {/* <small>Fecha inicial <i className="fa fa-asterisk text-danger small"></i></small> */}
                                        <div className="input-group input-group-sm">

                                            <input
                                                type="date"
                                                className="form-control"
                                                disabled={!this.state.isFechaActive}
                                                ref={this.refFechaIni}
                                                value={this.state.fechaIni}
                                                onChange={(event) => {
                                                    if (event.target.value <= this.state.fechaIni) {
                                                        this.setState({
                                                            fechaIni: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            fechaIni: event.target.value,
                                                            messageWarning: 'La Fecha inicial no puede ser mayor a la fecha final.',
                                                        });
                                                    }
                                                }} />
                                        </div>
                                    </div>

                                    <div className="form-group col-md-6">
                                        <span>Fecha final <i className="fa fa-asterisk text-danger small"></i></span>
                                        <div className="input-group input-group-sm">
                                            <input
                                                type="date"
                                                className="form-control"
                                                disabled={!this.state.isFechaActive}
                                                ref={this.refFechaFin}
                                                value={this.state.fechaFin}
                                                onChange={(event) => {
                                                    if (event.target.value <= this.state.fechaFin) {
                                                        this.setState({
                                                            fechaFin: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            fechaFin: event.target.value,
                                                            messageWarning: 'La Fecha fin no puede ser mayor a la fecha final.',
                                                        });
                                                    }
                                                }} />
                                        </div>
                                    </div>

                                </div>

                                <hr />

                                <div className="form-row">

                                    <div className="form-group col-md-6">
                                        <span>Cuenta</span>
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text btn-sm"><i className="bi bi-list-columns-reverse"></i></div>
                                            </div>
                                            <select
                                                title="Catalogo de cuentas"
                                                className="form-control"
                                            >
                                                <option value="">-- Cuenta contable --</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-6">
                                        <span>Tercero</span>
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text btn-sm"><i className="bi bi-people-fill"></i></div>
                                            </div>
                                            <select
                                                title="Catalogo de cuentas"
                                                className="form-control"
                                            >
                                                <option value="">-- Tercero --</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Exportar</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/*fin modal*/}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Reportes contables <small className="text-secondary">LISTA</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }} >
                            <button className="btn btn-link" onClick={() => this.props.history.push(`${this.props.location.pathname}/estadoresultado`)}>
                                <i className="fa fa-bar-chart"></i> Estado de resultados
                            </button>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }}>
                            <button className="btn btn-link" onClick={() => this.props.history.push(`${this.props.location.pathname}/balancegeneral`)}>
                                <i className="fa fa-balance-scale"></i> Balance General
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }} >
                            <button className="btn btn-link">
                                <i className="fa fa-percent"></i> Impuestos y detracciones
                            </button>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }}>
                            <button className="btn btn-link" onClick={() => this.props.history.push(`${this.props.location.pathname}/difcambiobanco`)}>
                                <i className="fa fa-university"></i> Diferencia en cambio de bancos
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }} >
                            <button className="btn btn-link" onClick={() => this.props.history.push(`${this.props.location.pathname}/movcuentacontable`)}>
                                <i className="fa fa-exchange"></i> Movimientos por cuenta contable
                            </button>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }}>
                            <button className="btn btn-link" onClick={() => this.props.history.push(`${this.props.location.pathname}/librodiario`)}>
                                <i className="fa fa-book"></i> Libro diario
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }} >
                            <button className="btn btn-link" onClick={() => this.props.history.push(`${this.props.location.pathname}/auxiliartercero`)}>
                                <i className="fa fa-sticky-note"></i> Auxiliar por tercero
                            </button>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }}>
                            <button className="btn btn-link" onClick={() => this.props.history.push(`${this.props.location.pathname}/libromayor`)}>
                                <i className="fa fa-archive"></i> Libro mayor
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-12">
                        <div className="form-group bg-light rounded" style={{ border: '1px solid rgba(0, 0, 0, 0.125)' }} >
                            <button className="btn btn-link" onClick={() => this.openModal()}>
                                <i className="fa fa-area-chart"></i> Balance de operaciones con terceros
                            </button>
                        </div>
                    </div>
                </div>

                <hr />


            </>
        )
    }
}

export default ReporteContables;