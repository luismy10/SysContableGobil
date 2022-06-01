import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    currentDate
} from '../../tools/Tools';
import Paginacion from '../../tools/Paginacion';

class RepLibroDiario extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: currentDate(),
            fechaFin: currentDate(),
            isFechaActive: false,

            lista: [],
            subLista: [],
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

            const asientos = await axios.get("/api/asiento/librodiario", {
                signal: this.abortControllerView.signal,
                params: {
                    "fechaIni": this.state.fechaIni,
                    "fechaFin": this.state.fechaFin,
                    "tipoRegistro": 0
                }
            });


            await this.setStateAsync({
                lista: asientos.data.asiento,
                subLista: asientos.data.asientoDet,
                loading: false,
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    onGenerarReporte() {

        if (this.state.fechaIni > this.state.fechaFin) {
            console.log("entro")
        } else {
            console.log("no entro")
            this.loadData()
        }

    }


    render() {
        return (
            <>
                <div className="row">
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Libro Diario
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
                            <span>Reporte</span>
                            <div className="input-group">
                                <button className="btn btn-outline-info btn-sm" title="Generar reporte" onClick={() => this.onGenerarReporte()}><i className="bi bi-aspect-ratio-fill"></i></button>
                                <button className="btn btn-outline-success btn-sm ml-1" title="Reporte excel"><i className="bi bi-file-earmark-excel-fill"></i></button>
                                {/* <button className="btn btn-outline-warning btn-sm ml-1" title="Reporte pdf"><i className="bi bi-file-pdf-fill"></i></button> */}
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
                                        <th width="5%" className="p-1" >Asiento</th>
                                        <th width="10%" className="p-1" >Fecha</th>
                                        <th width="10%" className="p-1" >Documento</th>
                                        <th width="5%" className="p-1" >Codigo</th>
                                        <th width="50%" className="p-1" >Cuenta</th>
                                        <th width="10%" className="p-1" >Débito</th>
                                        <th width="10%" className="p-1" >Crédito</th>
                                        {/* <th width="5%" className="text-center">Acciones</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center p-1" colSpan="7">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td className="p-1" colSpan="7">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (

                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index} style={{ "fontSize": "12px" }}>
                                                        <td className="p-1">{item.correlativo}</td>
                                                        <td className="p-1">{item.fecha}</td>
                                                        <td className="p-1">{item.comprobante === null ? '' : `${item.serie} - ${item.numeracion}`}</td>
                                                        <td className="p-1">
                                                            {
                                                                this.state.subLista.map((i, ix) => {
                                                                    if (item.idAsiento === i.idAsiento) {
                                                                        return (
                                                                            <li key={ix} style={{ "listStyleType": "none" }}><span className="font-weight-bold">{i.codigo}</span></li>
                                                                        )

                                                                    }
                                                                })
                                                            }
                                                        </td>
                                                        <td className="p-1">
                                                            {
                                                                this.state.subLista.map((i, ix) => {
                                                                    if (item.idAsiento === i.idAsiento) {
                                                                        return (
                                                                            <li key={ix} style={{ "listStyleType": "none" }}>{i.nombre}</li>
                                                                        )

                                                                    }
                                                                })
                                                            }
                                                        </td>
                                                        <td className="text-right p-1">
                                                            {
                                                                this.state.subLista.map((j, jx) => {
                                                                    if (item.idAsiento === j.idAsiento) {
                                                                        return (
                                                                            <li key={jx} style={{ "listStyleType": "none" }}>{j.debito}</li>
                                                                        )
                                                                    }
                                                                })
                                                            }
                                                        </td>
                                                        <td className="text-right p-1">
                                                            {
                                                                this.state.subLista.map((k, kx) => {
                                                                    if (item.idAsiento === k.idAsiento) {
                                                                        return (
                                                                            <li key={kx} style={{ "listStyleType": "none" }}>{k.credito}</li>
                                                                        )
                                                                    }
                                                                })
                                                            }
                                                        </td>
                                                    </tr>
                                                )
                                            })
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

export default RepLibroDiario