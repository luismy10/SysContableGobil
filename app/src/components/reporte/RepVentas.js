import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { spinnerLoading, currentDate } from '../tools/Tools';

class RepVentas extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            idComprobante: '',
            comprobantes: [],
            comprobanteCheck: true,

            idCliente: '',
            clientes: [],
            clienteCheck: true,

            idUsuario: '',
            usuarios: [],
            usuarioCheck: true,

            tipoVenta: '',
            tipoVentaCheck: true,

            loading: true,
            messageWarning: '',

        }

        this.refFechaIni = React.createRef();
        this.refFechaFin = React.createRef();
        this.refComprobante = React.createRef();
        this.refCliente = React.createRef();
        this.refUsuario = React.createRef();
        this.refTipoVenta = React.createRef();

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
            const comprobante = await axios.get("/api/comprobante/listcombo", {
                signal: this.abortControllerView.signal,
                params: {
                    "tipo": "1"
                }
            });

            const cliente = await axios.get("/api/cliente/listcombo", {
                signal: this.abortControllerView.signal
            });

            const usuario = await axios.get("/api/usuario/listcombo", {
                signal: this.abortControllerView.signal
            });

            await this.setStateAsync({
                clientes: cliente.data,
                usuarios: usuario.data,
                comprobantes: comprobante.data,
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

    async onEventImprimir() {
        if (this.state.fechaFin < this.state.fechaIni) {
            await this.setStateAsync({ messageWarning: "La Fecha inicial no puede ser mayor a la fecha final." })
            this.FechaIni.current.focus();
            return;
        }

        if (!this.state.comprobanteCheck && this.state.idComprobante === "") {
            await this.setStateAsync({ messageWarning: "Seleccione un comprobante." })
            this.refComprobante.current.focus();
            return;
        }

        if (!this.state.clienteCheck && this.state.idCliente === "") {
            await this.setStateAsync({ messageWarning: "Seleccione un cliente." })
            this.refCliente.current.focus();
            return;
        }

        if (!this.state.tipoVentaCheck && this.state.tipoVenta === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el tipo de venta." })
            this.refTipoVenta.current.focus();
            return;
        }

        const data = {
            "idSede": "SD0001",
            "fechaIni": this.state.fechaIni,
            "fechaFin": this.state.fechaFin,
            "idComprobante": this.state.idComprobante === '' ? '' : this.state.idComprobante,
            "idCliente": this.state.idCliente === '' ? '' : this.state.idCliente,
            "idUsuario": this.state.idUsuario === '' ? '' : this.state.idUsuario,
            "tipoVenta": this.state.tipoVenta === '' ? 0 : this.state.tipoVenta,
            "comprobante": this.refComprobante.current.options[this.refComprobante.current.options.selectedIndex].innerHTML,
            "cliente": this.refCliente.current.options[this.refCliente.current.options.selectedIndex].innerHTML,
            "usuario": this.refUsuario.current.options[this.refUsuario.current.options.selectedIndex].innerHTML,
            "tipo": this.refTipoVenta.current.options[this.refTipoVenta.current.options.selectedIndex].innerHTML,
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/factura/repgeneralventas?" + params, "_blank");
    }

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div>
                        : <>
                            <div className="card my-1">
                                <h6 className="card-header">Filtros Generales</h6>
                                <div className="card-body">
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
                                                <label>Fecha final <i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
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
                                    </div>

                                </div>
                            </div>

                            {
                                this.state.messageWarning === ''
                                    ? null
                                    :
                                    <div className="alert alert-warning" role="alert">
                                        <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                    </div>
                            }

                            <div className="card my-1">
                                <h6 className="card-header">Reporte de Ventas</h6>
                                <div className="card-body">

                                    <div className="row">

                                        <div className="col">
                                            <div className="form-group">
                                                <label>Comprobante(s)</label>
                                                <div className="input-group">
                                                    <select
                                                        title="Lista de comprobantes"
                                                        className="form-control"
                                                        ref={this.refComprobante}
                                                        value={this.state.idComprobante}
                                                        disabled={this.state.comprobanteCheck}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ idComprobante: event.target.value });
                                                            if (this.state.idComprobante === '') {
                                                                await this.setStateAsync({ comprobanteCheck: true });
                                                            }

                                                        }}
                                                    >
                                                        <option value="">-- Todos --</option>
                                                        {
                                                            this.state.comprobantes.map((item, index) => (
                                                                <option key={index} value={item.idComprobante}>{item.nombre}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.comprobanteCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ comprobanteCheck: event.target.checked });
                                                                        if (this.state.comprobanteCheck) {
                                                                            await this.setStateAsync({ idComprobante: '' });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Cliente(s)</label>
                                                <div className="input-group">
                                                    {/* <div className="input-group-prepend">
                                                        <div className="input-group-text"><i className="bi bi-people-fill"></i></div>
                                                    </div> */}
                                                    <select
                                                        title="Lista de clientes"
                                                        className="form-control"
                                                        ref={this.refCliente}
                                                        value={this.state.idCliente}
                                                        disabled={this.state.clienteCheck}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ idCliente: event.target.value });
                                                            if (this.state.idCliente === '') {
                                                                await this.setStateAsync({ clienteCheck: true });
                                                            }

                                                        }}
                                                    >
                                                        <option value="">-- Todos --</option>
                                                        {
                                                            this.state.clientes.map((item, index) => (
                                                                <option key={index} value={item.idCliente}>{item.informacion}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    // value={this.state.clienteCheck}
                                                                    checked={this.state.clienteCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ clienteCheck: event.target.checked });
                                                                        if (this.state.clienteCheck) {
                                                                            await this.setStateAsync({ idCliente: '' });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Usuario(s)</label>
                                                <div className="input-group">
                                                    <select
                                                        title="Lista de usuarios"
                                                        className="form-control"
                                                        ref={this.refUsuario}
                                                        value={this.state.idUsuario}
                                                        disabled={this.state.usuarioCheck}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ idUsuario: event.target.value });
                                                            if (this.state.idUsuario === '') {
                                                                await this.setStateAsync({ usuarioCheck: true });
                                                            }
                                                        }}
                                                    >
                                                        <option value="">-- Todos --</option>
                                                        {
                                                            this.state.usuarios.map((item, index) => (
                                                                <option key={index} value={item.idUsuario}>{item.nombres + ' ' + item.apellidos}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.usuarioCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ usuarioCheck: event.target.checked })
                                                                        if (this.state.usuarioCheck) {
                                                                            await this.setStateAsync({ idUsuario: '' });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="row">
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Tipo de venta(s)</label>
                                                <div className="input-group">
                                                    <select
                                                        title="Lista tipos de venta"
                                                        className="form-control"
                                                        ref={this.refTipoVenta}
                                                        value={this.state.tipoVenta}
                                                        disabled={this.state.tipoVentaCheck}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ tipoVenta: event.target.value });
                                                            if (this.state.tipoVenta === '') {
                                                                await this.setStateAsync({ tipoVentaCheck: true });
                                                            }
                                                        }}
                                                    >
                                                        <option value="">-- Todos --</option>
                                                        <option value="1">AL CONTADO</option>
                                                        <option value="2">AL CREDITO</option>
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.tipoVentaCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ tipoVentaCheck: event.target.checked })
                                                                        if (this.state.tipoVentaCheck) {
                                                                            await this.setStateAsync({ tipoVenta: '' });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col"></div>
                                        <div className="col"></div>
                                    </div>

                                    <div className="row">
                                        <div className="col"></div>
                                        <div className="col">
                                            <button className="btn btn-outline-warning btn-sm" onClick={() => this.onEventImprimir()}><i className="bi bi-file-earmark-pdf-fill"></i> Reporte Pdf</button>
                                        </div>
                                        <div className="col">
                                            <button className="btn btn-outline-success btn-sm"><i className="bi bi-file-earmark-excel-fill"></i> Reporte Excel</button>
                                        </div>
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

export default RepVentas