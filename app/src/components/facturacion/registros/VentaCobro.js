import React from 'react';
import axios from 'axios';
import {
    formatMoney,
    numberFormat,
    calculateTaxBruto,
    calculateTax,
    keyNumberInteger,
    keyNumberFloat,
    isNumeric,
    showModal,
    hideModal,
    viewModal,
    clearModal,
    spinnerLoading,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../../tools/Tools';
import { connect } from 'react-redux';

class VentaCobro extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

            selectTipoPago: 1,

            comprobantesCobro: [],
            idComprobanteContado: '',
            idComprobanteCredito: '',

            idUsuario: this.props.token.userToken.idUsuario,
            bancos: [],

            idBancoContado: '',
            metodoPagoContado: '',

            idBancoCredito: '',
            metodoPagoCredito: '',

            montoInicialCheck: false,
            inicial: '',
            numCuota: '',
            letraMensual: '',

            loading: true

        };

        this.refComprobanteContado = React.createRef();
        this.refBancoContado = React.createRef();
        this.refMetodoContado = React.createRef();

        this.refMontoInicial = React.createRef();
        this.refComprobanteCredito = React.createRef();
        this.refBancoCredito = React.createRef();
        this.refMetodoCredito = React.createRef();
        this.refNumCutoas = React.createRef();

        this.abortControllerView = new AbortController();

        const {importeTotal} = this.props

        this.total = importeTotal
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadData();

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

            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortControllerView.signal,
            });


            const comprobanteCobro = await axios.get("/api/comprobante/listcombo", {
                signal: this.abortControllerView.signal,
                params: {
                    "tipo": "5"
                }
            });

            const banco = await axios.get("/api/banco/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const comprobanteFilter = comprobante.data.filter(item => item.preferida === 1);

            const monedaFilter = moneda.data.filter(item => item.predeterminado === 1);

            const comprobanteCobroFilter = comprobanteCobro.data.filter(item => item.preferida === 1);

            await this.setStateAsync({
                comprobantes: comprobante.data,
                comprobantesCobro: comprobanteCobro.data,
                monedas: moneda.data,

                idMoneda: monedaFilter.length > 0 ? monedaFilter[0].idMoneda : '',
                idComprobante: comprobanteFilter.length > 0 ? comprobanteFilter[0].idComprobante : '',
                idComprobanteContado: comprobanteCobroFilter.length > 0 ? comprobanteCobroFilter[0].idComprobante : '',
                idComprobanteCredito: comprobanteCobroFilter.length > 0 ? comprobanteCobroFilter[0].idComprobante : '',
                bancos: banco.data,

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

    async calcularLetraMensual() {
        if (this.state.numCuota === '') {
            return;
        }

        let saldo = this.state.importeTotal - (this.state.montoInicialCheck ? this.state.inicial : 0)
        let letra = saldo / this.state.numCuota

        await this.setStateAsync({ letraMensual: letra })
    }

    async onEventGuardar() {

        if (this.state.loading) {
            return;
        }

        if (this.state.selectTipoPago && this.state.idComprobanteContado === "") {
            this.refComprobanteContado.current.focus();
            return;
        }

        if (this.state.selectTipoPago && this.state.idBancoContado === "") {
            this.refBancoContado.current.focus();
            return;
        }

        if (this.state.selectTipoPago && this.state.metodoPagoContado === "") {
            this.refMetodoContado.current.focus();
            return;
        }

        if (!this.state.selectTipoPago && this.state.montoInicialCheck && !isNumeric(this.state.inicial)) {
            this.refMontoInicial.current.focus();
            return;
        }

        if (parseFloat(this.state.inicial) <= 0) {
            this.refMontoInicial.current.focus();
            return;
        }

        if (!this.state.selectTipoPago && this.state.montoInicialCheck && this.state.idComprobanteCredito === "") {
            this.refComprobanteCredito.current.focus();
            return;
        }

        if (!this.state.selectTipoPago && this.state.montoInicialCheck && this.state.idBancoCredito === "") {
            this.refBancoCredito.current.focus();
            return;
        }

        if (!this.state.selectTipoPago && this.state.montoInicialCheck && this.state.metodoPagoCredito === "") {
            this.refMetodoCredito.current.focus();
            return;
        }

        if (!this.state.selectTipoPago && !isNumeric(this.state.numCuota)) {
            this.refNumCutoas.current.focus();
            return;
        }

        if (parseInt(this.state.numCuota) <= 0) {
            this.refNumCutoas.current.focus();
            return;
        }


        ModalAlertDialog("Venta", "¿Estás seguro de continuar?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Venta", "Procesando información...");
                    hideModal("modalVentaProceso")
                    let result = await axios.post('/api/factura/add', {
                        "idCliente": this.state.idCliente,
                        "idUsuario": this.state.idUsuario,
                        "idComprobante": this.state.idComprobante,
                        "idMoneda": this.state.idMoneda,
                        "tipo": this.state.selectTipoPago ? 1 : 2,
                        "selectTipoPago": this.state.selectTipoPago,
                        "montoInicialCheck": this.state.montoInicialCheck,
                        "idComprobanteCobro": this.state.selectTipoPago ? this.state.idComprobanteContado : this.state.idComprobanteCredito,
                        "idBanco": this.state.selectTipoPago ? this.state.idBancoContado : this.state.montoInicialCheck ? this.state.idBancoCredito : "",
                        "metodoPago": this.state.selectTipoPago ? this.state.metodoPagoContado : this.state.montoInicialCheck ? this.state.metodoPagoCredito : "",
                        "inicial": this.state.selectTipoPago ? 0 : this.state.montoInicialCheck ? parseFloat(this.state.inicial) : 0,
                        "numCuota": this.state.selectTipoPago ? 0 : parseInt(this.state.numCuota),
                        "estado": this.state.selectTipoPago ? 1 : 2,
                        "idProyecto": this.state.idProyecto,
                        "detalleVenta": this.state.detalleVenta,
                    });

                    ModalAlertSuccess("Venta", result.data, () => {
                        this.onEventLimpiar()
                    });
                }
                catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Venta", error.response.data)
                    } else {
                        ModalAlertWarning("Venta", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        });
    }


    render() {
        return (
            <div className="modal fade" id={this.props.idModal} data-bs-keyboard="false" data-bs-backdrop="static">
                <div className={`modal-dialog ${this.props.sizeModal}`}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h6 className="modal-title">{this.props.titleModal}</h6>
                            <button type="button" className="close" onClick={() => this.props.closeCobroModal()}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">

                            {
                                this.state.loading ?
                                    <div className="clearfix absolute-all bg-white">
                                        {spinnerLoading()}
                                    </div>
                                    : null
                            }

                            <div className="row">
                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="text-center">
                                        <h5>TOTAL A PAGAR: <strong className="text-primary">{numberFormat(this.total)}</strong></h5>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4 col-sm-4">
                                    <hr />
                                </div>
                                <div className="col-md-4 col-sm-4 d-flex align-items-center justify-content-center">
                                    <h6 className="mb-0">Tipos de pagos</h6>
                                </div>
                                <div className="col-md-4 col-sm-4">
                                    <hr />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 col-sm-6">
                                    <button className={`btn ${this.state.selectTipoPago === 1 ? "btn-primary" : "btn-light"} btn-block py-1`}
                                        type="button"
                                        title="Pago al contado"
                                        onClick={() => this.setState({ selectTipoPago: 1 })}>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <i className="bi bi-cash-coin fa-2x"></i>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <span>Contado</span>
                                        </div>
                                    </button>
                                </div>

                                <div className="col-md-6 col-sm-6">
                                    <button className={`btn ${this.state.selectTipoPago === 2 ? "btn-primary" : "btn-light"} btn-block py-1`}
                                        type="button"
                                        title="Pago al credito"
                                        onClick={() => this.setState({ selectTipoPago: 2 })}>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <i className="bi bi-boxes fa-2x"></i>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <span>Crédito</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <br />

                            {/* contado detalle */}

                            {
                                this.state.selectTipoPago === 1 ?

                                    <div className="row">
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">

                                            <div className="form-row">
                                                <div className="form-group col-md-12">
                                                    <div className="input-group input-group-sm">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                                        </div>
                                                        <select
                                                            title="Lista de caja o banco a depositar"
                                                            className="form-control"
                                                            ref={this.refComprobanteContado}
                                                            value={this.state.idComprobanteContado}
                                                            onChange={(event) => this.setState({ idComprobanteContado: event.target.value })}>
                                                            <option value="">-- Comprobante --</option>
                                                            {
                                                                this.state.comprobantesCobro.map((item, index) => (
                                                                    <option key={index} value={item.idComprobante}>{item.nombre}</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-12">
                                                    <div className="input-group input-group-sm">
                                                        <div className="input-group-prepend">
                                                            <div className="input-group-text"><i className="bi bi-bank"></i></div>
                                                        </div>
                                                        <select
                                                            title="Lista de caja o banco a depositar"
                                                            className="form-control"
                                                            ref={this.refBancoContado}
                                                            value={this.state.idBancoContado}
                                                            onChange={(event) => this.setState({ idBancoContado: event.target.value })}>
                                                            <option value="">-- Cuenta bancaria --</option>
                                                            {
                                                                this.state.bancos.map((item, index) => (
                                                                    <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-12">
                                                    <div className="d-flex justify-content-center" htmlFor="cbDeposito">
                                                        <label className="mb-0"><input type="checkbox" id="cbDeposito" value={this.state.depositoCheck} onChange={(event) => this.setState({ depositoCheck: event.target.checked })} /> Deposito</label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-12">
                                                    <span>Efectivo</span>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        ref={this.refEfectivo}
                                                        value={this.state.efectivo}
                                                        onChange={(event) => this.setState({ efectivo: event.target.value })}
                                                        placeholder="0.0" />
                                                </div>
                                            </div>

                                            {
                                                !this.state.depositoCheck ? (
                                                    <>
                                                        <div className="form-row">
                                                            <div className="form-group col-md-12">
                                                                <span>Tarjeta</span>
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    ref={this.refTarjeta}
                                                                    value={this.state.tarjeta}
                                                                    onChange={(event) => this.setState({ tarjeta: event.target.value })}
                                                                    placeholder="0.0" />
                                                            </div>
                                                        </div>
                                                        <div className="form-row">
                                                            <div className="form-group col-md-12 mb-0">
                                                                <div className="d-flex justify-content-center" htmlFor="cbDeposito">
                                                                    <h5 className="mb-0"><strong>{`Su cambio: ${numberFormat(60)}`}</strong></h5    >
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="form-row">
                                                        <div className="form-group col-md-12">
                                                            <span>Número de operación</span>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                ref={this.refNumOperacion}
                                                                value={this.state.numOperacion}
                                                                onChange={(event) => this.setState({ numOperacion: event.target.value })}
                                                                placeholder="0.0" />
                                                        </div>
                                                    </div>
                                                )
                                            }

                                        </div>
                                    </div>
                                    :
                                    null
                            }

                            {/* crédito detalle */}

                            {
                                this.state.selectTipoPago === 2 ?
                                    <div className={`row`}>
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">

                                            <div className="form-group">
                                                <div className="input-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text"><i className="bi bi-tag-fill"></i></div>
                                                    </div>
                                                    <input
                                                        title="Monto inicial"
                                                        type="text"
                                                        className="form-control"
                                                        ref={this.refMontoInicial}
                                                        disabled={!this.state.montoInicialCheck}
                                                        placeholder='Monto inicial'
                                                        value={this.state.inicial}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ inicial: event.target.value })
                                                            this.calcularLetraMensual()
                                                        }}
                                                        onKeyPress={keyNumberFloat} />
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    value={this.state.montoInicialCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ montoInicialCheck: event.target.checked })
                                                                        this.refMontoInicial.current.focus();
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {
                                                this.state.montoInicialCheck ?
                                                    <div className="form-row">
                                                        <div className="form-group col-md-12">
                                                            <div className="input-group">
                                                                <div className="input-group-prepend">
                                                                    <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                                                </div>
                                                                <select
                                                                    title="Lista de caja o banco a depositar"
                                                                    className="form-control"
                                                                    ref={this.refComprobanteCredito}
                                                                    value={this.state.idComprobanteCredito}
                                                                    onChange={(event) => this.setState({ idComprobanteCredito: event.target.value })}>
                                                                    <option value="">-- Comprobante --</option>
                                                                    {
                                                                        this.state.comprobantesCobro.map((item, index) => (
                                                                            <option key={index} value={item.idComprobante}>{item.nombre}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    : null
                                            }

                                            {
                                                this.state.montoInicialCheck ?
                                                    <div className="form-group">
                                                        <div className="input-group">
                                                            <div className="input-group-prepend">
                                                                <div className="input-group-text"><i className="bi bi-bank"></i></div>
                                                            </div>
                                                            <select
                                                                title="Lista de caja o banco a depositar"
                                                                className="form-control"
                                                                ref={this.refBancoCredito}
                                                                value={this.state.idBancoCredito}
                                                                onChange={(event) => this.setState({ idBancoCredito: event.target.value })}>
                                                                <option value="">-- Cuenta bancaria --</option>
                                                                {
                                                                    this.state.bancos.map((item, index) => (
                                                                        <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                        </div>
                                                    </div>
                                                    : null
                                            }

                                            {
                                                this.state.montoInicialCheck ?
                                                    <div className="form-group">
                                                        <div className="input-group">
                                                            <div className="input-group-prepend">
                                                                <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                                            </div>
                                                            <select
                                                                title="Lista metodo de pago"
                                                                className="form-control"
                                                                ref={this.refMetodoCredito}
                                                                value={this.state.metodoPagoCredito}
                                                                onChange={(event) => this.setState({ metodoPagoCredito: event.target.value })}>
                                                                <option value="">-- Metodo de pago --</option>
                                                                <option value="1">Efectivo</option>
                                                                <option value="2">Consignación</option>
                                                                <option value="3">Transferencia</option>
                                                                <option value="4">Cheque</option>
                                                                <option value="5">Tarjeta crédito</option>
                                                                <option value="6">Tarjeta débito</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    : null
                                            }

                                            <div className="form-group">
                                                <div className="input-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text"><i className="bi bi-hourglass-split"></i></div>
                                                    </div>
                                                    <input
                                                        title="Número de cuotas"
                                                        type="text"
                                                        className="form-control"
                                                        placeholder='Número de cuotas'
                                                        ref={this.refNumCutoas}
                                                        value={this.state.numCuota}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ numCuota: event.target.value })
                                                            this.calcularLetraMensual()
                                                        }}
                                                        onKeyPress={keyNumberInteger} />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <div className="input-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text"><i className="bi bi-coin"></i></div>
                                                    </div>
                                                    <input
                                                        title="Letra mensual"
                                                        type="text"
                                                        className="form-control"
                                                        placeholder='0.00'
                                                        value={this.state.letraMensual}
                                                        disabled={true} />
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                    : null
                            }

                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Completar venta</button>
                            <button type="button" className="btn btn-danger" onClick={() => this.props.closeCobroModal()}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(VentaCobro);
