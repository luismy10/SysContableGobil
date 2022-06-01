import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
    formatMoney,
    spinnerLoading,
    showModal,
    hideModal,
    viewModal,
    clearModal,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning
} from '../../tools/Tools';
import { connect } from 'react-redux';

class CreditoProceso extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            venta: {},
            plazos: [],

            idBanco: '',
            idComprobante: '',
            comprobantes: [],
            metodoPago: '',
            observacion: '',
            idUsuario: this.props.token.userToken.idUsuario,

            idProyecto: this.props.token.project.idProyecto,

            valorRecibido: 0,
            bancos: [],

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',
        }
        this.refComprobante = React.createRef();
        this.refBanco = React.createRef();
        this.refMetodoPago = React.createRef();

        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadInit();

        viewModal("modalCobro", async () => {
            this.refBanco.current.focus();
        });

        clearModal("modalCobro", async () => {
            await this.setStateAsync({
                idBanco: '',
                metodoPago: '',
                observacion: '',
                idComprobante: '',
                comprobantes: [],
            });
        });
    }

    componentWillUnmount() {
        this.abortControllerTable.abort();
    }

    loadInit() {
        const url = this.props.location.search;
        const idVenta = new URLSearchParams(url).get("idVenta");
        if (idVenta !== null) {
            this.loadDataId(idVenta)
        } else {
            this.props.history.goBack();
        }
    }

    async loadDataId(id) {
        try {
            await this.setStateAsync({
                venta: {},
                plazos: [],
                idBanco: '',
                metodoPago: '',
                observacion: '',
                valorRecibido: 0,
                bancos: [],

                loading: true,
                msgLoading: 'Cargando datos...',
            })

            let credito = await axios.get("/api/factura/credito/detalle", {
                signal: this.abortControllerTable.signal,
                params: {
                    "idVenta": id
                }
            });

            const comprobante = await axios.get("/api/comprobante/listcombo", {
                signal: this.abortControllerTable.signal,
                params: {
                    "tipo": "5"
                }
            });

            const banco = await axios.get("/api/banco/listcombo", {
                signal: this.abortControllerTable.signal,
            });

            const plazosSelected = credito.data.plazos.map((item) => {
                return {
                    ...item,
                    selected: false
                }
            });

            const comprobanteFilter = comprobante.data.filter(item => item.preferida === 1);

            await this.setStateAsync({
                venta: credito.data.venta,
                plazos: plazosSelected,

                comprobantes: comprobante.data,
                bancos: banco.data,

                idComprobante: comprobanteFilter.length > 0 ? comprobanteFilter[0].idComprobante : '',

                loading: false,
            });
        } catch (error) {
            if (error.message !== "canceled") {
                this.props.history.goBack();
            }
        }
    }

    async onEventOpenModal() {
        let validate = this.state.plazos.reduce((acumulador, item) => item.selected ? acumulador + 1 : acumulador + 0, 0);

        if (validate <= 0) {
            await this.setStateAsync({ messageWarning: "Seleccione algún crédito  a cobrar." })
            return;
        }

        showModal("modalCobro")
    }

    async onEventCobrar() {
        if (this.state.idComprobante === '') {
            this.refComprobante.current.focus();
            return;
        }

        if (this.state.idBanco === "") {
            this.refBanco.current.focus();
            return;
        }

        if (this.state.metodoPago === "") {
            this.refMetodoPago.current.focus();
            return;
        }

        try {
            ModalAlertInfo("Cobro", "Procesando información...")
            hideModal("modalCobro");
            let result = await axios.post("/api/cobro/cobro", {
                "idComprobante": this.state.idComprobante,
                "idCliente": this.state.venta.idCliente,
                "idUsuario": this.state.idUsuario,
                'idMoneda': this.state.venta.idMoneda,
                "idBanco": this.state.idBanco,
                "idVenta": this.state.venta.idVenta,
                "idProyecto": this.state.idProyecto,
                "metodoPago": this.state.metodoPago,
                "estado": 1,
                "observacion": this.state.observacion.trim().toUpperCase(),
                "valorRecibido": this.state.valorRecibido,
                "plazos": this.state.plazos
            })

            ModalAlertSuccess("Cobro", result.data, () => {
                this.loadInit();
            });
        } catch (error) {
            ModalAlertWarning("Cobro", "Se produjo un error un interno, intente nuevamente.")
        }
    }

    handleCheck = async (event) => {
        let updatedList = [...this.state.plazos];
        let ipos = 0;
        let object = {};
        for (let item of updatedList) {
            if (item.idPlazo === parseInt(event.target.value)) {
                item.selected = event.target.checked;
                object = item;
                break;
            }
            ipos++;
        }

        for (let i = 0; i < updatedList.length; i++) {
            if (parseInt(updatedList[i].estado) === 0) {
                updatedList[i].selected = false;
            }
        }

        for (let i = 0; i < updatedList.length; i++) {
            if (parseInt(updatedList[i].estado) === 0) {
                updatedList[i].selected = true;

                if (ipos === i) {
                    break;
                }

                if (parseInt(object.idPlazo) === parseInt(updatedList[i].idPlazo)) {
                    updatedList[i].selected = event.target.checked;
                    break;
                }
            }
        }

        let suma = updatedList.reduce((acumulador, item) => item.selected && parseInt(item.estado) === 0 ? acumulador + item.monto : acumulador + 0, 0);

        await this.setStateAsync({
            plazos: updatedList,
            valorRecibido: suma,
            messageWarning: ''
        })
    }

    async onEventImprimir() {
        const data = {
            "idSede": "SD0001",
            "idVenta": this.state.venta.idVenta,
            "proyecto": this.props.token.project.nombre,
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/factura/repcreditolote?" + params, "_blank");
    }

    render() {
        const {
            documento,
            informacion,
            telefono,
            celular,
            email,
            direccion,
            nombre,
            serie,
            numeracion,
            numCuota,
            simbolo,
            total,
            cobrado
        } = this.state.venta;

        return (
            <>
                {/* Inicio modal */}
                <div className="modal fade" id="modalCobro" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Registrar cobro</h6>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className="form-group">
                                    <div className="input-group">
                                        <div className="input-group-prepend">
                                            <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                        </div>
                                        <select
                                            title="Comprobantes de venta"
                                            className="form-control"
                                            ref={this.refComprobante}
                                            value={this.state.idComprobante}
                                            onChange={(event) => this.setState({ idComprobante: event.target.value })}>
                                            <option value="">-- Comprobantes --</option>
                                            {
                                                this.state.comprobantes.map((item, index) => (
                                                    <option key={index} value={item.idComprobante}>{item.nombre}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Cuenta bancaria <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group">
                                            <select
                                                className="form-control"
                                                ref={this.refBanco}
                                                value={this.state.idBanco}
                                                onChange={(event) =>
                                                    this.setState({
                                                        idBanco: event.target.value
                                                    })
                                                }>
                                                <option value="">- Seleccione -</option>
                                                {
                                                    this.state.bancos.map((item, index) => (
                                                        <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label>Metodo de pago <i className="fa fa-asterisk text-danger small"></i></label>
                                        <select
                                            className="form-control"
                                            ref={this.refMetodoPago}
                                            value={this.state.metodoPago}
                                            onChange={(event) =>
                                                this.setState({
                                                    metodoPago: event.target.value,
                                                })}>
                                            <option value="">- Seleccione -</option>
                                            <option value="1">Efectivo</option>
                                            <option value="2">Consignación</option>
                                            <option value="3">Transferencia</option>
                                            <option value="4">Cheque</option>
                                            <option value="5">Tarjeta crédito</option>
                                            <option value="6">Tarjeta débito</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <label>Observación</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese alguna observación..."
                                            value={this.state.observacion}
                                            onChange={(event) =>
                                                this.setState({ observacion: event.target.value })
                                            } />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-3">
                                        <label>Valor a cobrar:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="0.00"
                                            value={formatMoney(this.state.valorRecibido)}
                                            disabled />
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventCobrar()}>Guardar</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal */}

                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> : null
                }

                {
                    this.state.messageWarning === '' ? null :
                        <div className="alert alert-warning" role="alert">
                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                        </div>
                }

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Créditos
                                <small className="text-secondary"> Lista</small>
                            </h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <button type="button" className="btn btn-success" onClick={() => this.onEventOpenModal()}><i className="fa fa-save"></i> Cobrar</button>
                            {" "}
                            <button type="button" className="btn btn-light" onClick={() => this.onEventImprimir()}><i className="fa fa-print"></i> Imprimir</button>
                            {" "}
                            <button type="button" className="btn btn-light"><i className="fa fa-file-archive-o"></i> Adjuntar</button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col">
                        <div className="form-group">
                            <div className="pt-1 pb-1">Cliente: <strong>{documento + " " + informacion}</strong></div>
                            <div className="pt-1 pb-1">Teléfono y celular: <strong>{telefono + " " + celular}</strong></div>
                            <div className="pt-1 pb-1">Email: <strong>{email}</strong></div>
                            <div className="pt-1 pb-1">Dirección: <strong>{direccion}</strong></div>
                            <div className="pt-1 pb-1">Comprobante: <strong>{nombre + " " + serie + "-" + numeracion}</strong></div>
                            <div className="pt-1 pb-1">Observación: </div>
                        </div>
                    </div>
                    <div className="col">
                        <div className="form-group">
                            <div className="pt-1 pb-1">N° de Cuotas: <strong>{numCuota === 1 ? numCuota + " Cuota" : numCuota + " Cuotas"}</strong></div>
                            <div className="pt-1 pb-1">Monto Total: <strong>{simbolo + " " + formatMoney(total)}</strong></div>
                            <div className="pt-1 pb-1">Monto Cobrado: <span className="text-success">{simbolo + " " + formatMoney(cobrado)}</span></div>
                            <div className="pt-1 pb-1">Monto Restante: <span className="text-danger">{simbolo + " " + formatMoney(total - cobrado)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-light table-striped">
                                <thead>
                                    <tr>
                                        <th width="10%" className="text-center">N°</th>
                                        <th width="15%">Fecha de Cobro</th>
                                        <th width="15%">Estado</th>
                                        <th width="15%">Monto</th>
                                        <th width="15%">Observación</th>
                                        <th width="15%" className="text-center">Cobro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.plazos.map((item, index) => (
                                            <tr key={index}>
                                                <td className="text-center">{++index}</td>
                                                <td>{item.fecha}</td>
                                                <td className={`${item.estado === 0 ? "text-danger" : "text-success"}`}>{item.estado === 0 ? "Por Cobrar" : "Cobrado"}</td>
                                                <td>{simbolo + " " + formatMoney(item.monto)}</td>
                                                <td></td>
                                                <td className="text-center">
                                                    <input
                                                        className="form-check-input m-0"
                                                        type="checkbox"
                                                        disabled={item.estado === 1 ? true : false}
                                                        value={item.idPlazo}
                                                        checked={item.selected}
                                                        onChange={this.handleCheck}
                                                    />
                                                </td>
                                            </tr>
                                        ))
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


const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(CreditoProceso);