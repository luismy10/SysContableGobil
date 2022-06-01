import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { spinnerLoading, currentDate } from '../tools/Tools';

class RepFinanciero extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            //Cobro
            idCliente: '',
            clientes: [],

            idBanco: '',
            bancos: [],


            idUsuario: '',
            usuarios: [],

            loading: true,
            messageWarning: '',
        }

        this.refFechaIni = React.createRef();

        this.refCliente = React.createRef();
        this.refBanco = React.createRef();

        this.refUsuario = React.createRef();
        this.refBancoGasto = React.createRef();

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

            // const cliente = await axios.get("/api/cliente/listcombo", {
            //     signal: this.abortControllerView.signal
            // });

            // const banco = await axios.get("/api/banco/listcombo", {
            //     signal: this.abortControllerView.signal
            // });

            // const usuario = await axios.get("/api/usuario/listcombo", {
            //     signal: this.abortControllerView.signal
            // });

            await this.setStateAsync({
                //cobro
                // clientes: cliente.data,
                // bancos: banco.data,
                //gasto
                // usuarios: usuario.data,

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

    async onEventImpCobro() {

        if (this.state.fechaFin < this.state.fechaIni) {
            this.setState({ messageWarning: "La Fecha inicial no puede ser mayor a la fecha final." })
            this.refFechaIni.current.focus();
        } else {
            const data = {

                "idSede": "SD0001",
                "fechaIni": this.state.fechaIni,
                "fechaFin": this.state.fechaFin,
                // "idBanco": this.state.idBanco === '' ? '' : this.state.idBanco,
                // "idCliente": this.state.idCliente === '' ? '' : this.state.idCliente,
                // "banco": this.refBanco.current.options[this.refBanco.current.options.selectedIndex].innerHTML,
                // "cliente": this.refCliente.current.options[this.refCliente.current.options.selectedIndex].innerHTML

            }

            let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
            let params = new URLSearchParams({ "params": ciphertext });
            window.open("/api/cobro/repgeneralcobros?" + params, "_blank");
        }
    }

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        <>
                            <div className="card my-1">
                                <h6 className="card-header">Reporte de Ingreso y Egresos</h6>
                                <div className="card-body">


                                    {
                                        this.state.messageWarning === '' ? null :
                                            <div className="alert alert-warning" role="alert">
                                                <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                            </div>
                                    }


                                    <div className="row">
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Filtro por fechas</label>
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
                                                <label>Fecha inicial <i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        disabled={!this.state.isFechaActive}
                                                        ref={this.refFechaIni}
                                                        value={this.state.fechaIni}
                                                        onChange={(event) => {

                                                            if (event.target.value <= this.state.fechaFin) {
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
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Fecha final <i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        disabled={!this.state.isFechaActive}
                                                        value={this.state.fechaFin}
                                                        onChange={(event) => this.setState({ fechaFin: event.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* <div className="row">
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Cliente(s)</label>
                                                <div className="input-group">
                                                    <select
                                                        title="Lista de clientes"
                                                        className="form-control"
                                                        ref={this.refCliente}
                                                        value={this.state.idCliente}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ idCliente: event.target.value });
                                                        }}
                                                    >
                                                        <option value="">-- Todos --</option>
                                                        {
                                                            this.state.clientes.map((item, index) => (
                                                                <option key={index} value={item.idCliente}>{item.informacion}</option>
                                                            ))
                                                        }
                                                    </select>

                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Caja Banco(s)</label>
                                                <div className="input-group">
                                                    <select
                                                        title="Lista caja banco a depositar"
                                                        className="form-control"
                                                        ref={this.refBanco}
                                                        value={this.state.idBanco}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ idBanco: event.target.value });
                                                        }}
                                                    >
                                                        <option value="">-- Todos --</option>
                                                        {
                                                            this.state.bancos.map((item, index) => (
                                                                <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div> */}

                                    <div className="row mt-3">
                                        <div className="col"></div>
                                        <div className="col">
                                            <button className="btn btn-outline-warning btn-sm" onClick={() => this.onEventImpCobro()}><i className="bi bi-file-earmark-pdf-fill"></i> Reporte Pdf</button>
                                        </div>
                                        {/* <div className="col">
                                            <button className="btn btn-outline-success btn-sm"><i className="bi bi-file-earmark-excel-fill"></i> Reporte Excel</button>
                                        </div> */}
                                        <div className="col"></div>
                                    </div>

                                </div>
                            </div>
                        </>
                }
            </>

        )
    }
}

export default RepFinanciero;