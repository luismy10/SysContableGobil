import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    currentDate
} from '../../tools/Tools';
import Paginacion from '../../tools/Paginacion';

class RepAuxiliarTercero extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            lista: [],
            loading: true,
            messageWarning: ''
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
        this.loadData()
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    loadData = async () => {
        try {

            await this.setStateAsync({
                loading: false,
                fechaIni: currentDate(),
                fechaFin: currentDate()
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    render() {
        return (
            <>
                <div className="row">
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Auxiliar por tercero
                                <small className="text-secondary"> REPORTE</small>
                            </h5>
                        </div>
                    </div>
                </div>

                <div className="row">

                    <div className="col">
                        <div className="form-group">
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

                    <div className="col">
                        <div className="form-group">
                            <span>Fecha inicial <i className="fa fa-asterisk text-danger small"></i></span>
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
                    </div>

                    <div className="col">
                        <div className="form-group">
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

                    <div className="col">

                        <div className="form-group">
                            <span>Tercero <i className="fa fa-asterisk text-danger small"></i></span>
                            <div className="input-group input-group-sm">
                                <div className="input-group-prepend">
                                    <div className="input-group-text btn-sm"><i className="bi bi-people-fill"></i></div>
                                </div>
                                <select
                                    title="Catalogo de cuentas"
                                    className="form-control"
                                // ref={this.refLote}
                                // onChange={(event) => this.changeLote(event)}
                                >
                                    <option value="">-- Tercero --</option>
                                    {
                                        // this.state.lotes.map((item, index) => (
                                        //     <option key={index} value={item.idLote}>{`${item.nombreLote} / ${item.nombreManzana} - ${item.precio}`}</option>
                                        // ))
                                    }
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="form-group">
                            <span>Reporte</span>
                            <div className="input-group">
                                <button className="btn btn-outline-success btn-sm" title="Reporte excel"><i className="bi bi-file-earmark-excel-fill"></i></button>
                                <button className="btn btn-outline-warning btn-sm ml-1" title="Reporte pdf"><i className="bi bi-file-pdf-fill"></i></button>
                                <button className="btn btn-outline-info btn-sm ml-1" title="Imprimir"><i className="bi bi-printer-fill"></i></button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="20%">Cuenta contable</th>
                                        <th width="30%">Tercero</th>
                                        <th width="10%">Saldo anterior</th>
                                        <th width="10%">Débito</th>
                                        <th width="10%">Crédito</th>
                                        <th width="10%">Neto</th>
                                        <th width="10%">Saldo final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center" colSpan="7">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="7">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (null

                                            // this.state.lista.map((item, index) => {
                                            //     return (
                                            //         <tr key={index}>
                                            //             <td className="text-center">{item.id}</td>
                                            //             <td>{item.tipodocumento}{<br />}{item.documento}</td>
                                            //             <td>{item.informacion}</td>
                                            //             <td>{item.celular}{<br />}{item.telefono}</td>
                                            //             <td>{item.direccion}</td>
                                            //             <td className="text-center">
                                            //                 <div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>
                                            //                     {item.estado === 1 ? "ACTIVO" : "INACTIVO"}
                                            //                 </div>
                                            //             </td>
                                            //             <td className="text-center">
                                            //                 <button className="btn btn-outline-warning btn-sm" title="Editar" onClick={() => this.onEventEditarCliente(item.idCliente)}><i className="bi bi-pencil"></i></button>
                                            //             </td>
                                            //             <td className="text-center">
                                            //                 <button className="btn btn-outline-danger btn-sm" title="Editar" onClick={() => this.onEventEliminarCliente(item.idCliente)}><i className="bi bi-trash"></i></button>
                                            //             </td>
                                            //         </tr>
                                            //     )
                                            // })
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </>
        )
    }
}

export default RepAuxiliarTercero;
