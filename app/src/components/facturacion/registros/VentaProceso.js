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

class VentaProceso extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            idCliente: '',
            idComprobante: '',
            idUsuario: this.props.token.userToken.idUsuario,
            numCuota: '',
            estado: 1,
            idMoneda: '',
            monedas: [],

            lotes: [],
            precioContado: '',

            detalleVenta: [],
            comprobantes: [],
            clientes: [],

            impuestos: [],

            idProyecto: this.props.token.project.idProyecto,

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',

            importeTotal: 0,
            selectTipoPago: true,

            bancos: [],
            comprobantesCobro: [],

            idComprobanteContado: '',
            idBancoContado: '',
            metodoPagoContado: '',
            montoInicialCheck: false,
            inicial: '',
            idComprobanteCredito: '',
            idBancoCredito: '',
            metodoPagoCredito: '',
            letraMensual: '',
        }

        this.refLote = React.createRef();
        this.refPrecioContado = React.createRef();
        this.refComprobante = React.createRef();
        this.refCliente = React.createRef();
        this.refMoneda = React.createRef();

        this.refComprobanteContado = React.createRef();
        this.refBancoContado = React.createRef();
        this.refMetodoContado = React.createRef();

        this.refMontoInicial = React.createRef();
        this.refComprobanteCredito = React.createRef();
        this.refBancoCredito = React.createRef();
        this.refMetodoCredito = React.createRef();
        this.refNumCutoas = React.createRef();

        this.abortControllerView = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadData();

        viewModal("modalVentaProceso", () => {
            this.refBancoContado.current.focus();
        });

        clearModal("modalVentaProceso", async () => {
            await this.setStateAsync({
                selectTipoPago: true,
                idBancoContado: '',
                metodoPagoContado: '',
                montoInicialCheck: false,
                inicial: '',
                idBancoCredito: '',
                metodoPagoCredito: '',
                letraMensual: '',
            });
        })
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

            const comprobanteCobro = await axios.get("/api/comprobante/listcombo", {
                signal: this.abortControllerView.signal,
                params: {
                    "tipo": "5"
                }
            });

            const cliente = await axios.get("/api/cliente/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const lote = await axios.get("/api/lote/listcombo", {
                signal: this.abortControllerView.signal,
                params: {
                    "idProyecto": this.state.idProyecto
                }
            });

            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const impuesto = await axios.get("/api/impuesto/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const banco = await axios.get("/api/banco/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const comprobanteFilter = comprobante.data.filter(item => item.preferida === 1);

            const comprobanteCobroFilter = comprobanteCobro.data.filter(item => item.preferida === 1);

            const monedaFilter = moneda.data.filter(item => item.predeterminado === 1);

            await this.setStateAsync({
                comprobantes: comprobante.data,
                comprobantesCobro: comprobanteCobro.data,
                clientes: cliente.data,
                lotes: lote.data,
                monedas: moneda.data,
                impuestos: impuesto.data,
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

    async addObjectTable() {
        if (this.refLote.current.value === '') {
            this.setState({ messageWarning: "Seleccione un lote" })
            this.refLote.current.focus();
            return;
        }
        if (!isNumeric(this.state.precioContado)) {
            this.setState({ messageWarning: "Ingrese el precio de venta total" })
            this.refPrecioContado.current.focus();
            return;
        }
        if (this.state.precioContado <= 0) {
            this.setState({ messageWarning: "Ingrese un precio mayor a 0" })
            this.refPrecioContado.current.focus();
            return;
        }

        let nombreLote = "";
        let nombreManzana = "";
        let precioContado = 0;
        for (let item of this.state.lotes) {
            if (this.refLote.current.value === item.idLote) {
                nombreLote = item.nombreLote;
                nombreManzana = item.nombreManzana;
                precioContado = item.precio;
                break;
            }
        }

        if (!this.validarDuplicado(this.refLote.current.value)) {
            let detalle = {
                "idDetalle": this.refLote.current.value,
                "nombreLote": nombreLote,
                "nombreManzana": nombreManzana,
                "cantidad": 1,
                "idImpuesto": "",
                "impuestos": this.state.impuestos,
                "precioContado": precioContado
            }

            this.state.detalleVenta.push(detalle)
        } else {
            for (let item of this.state.detalleVenta) {
                if (item.idDetalle === this.refLote.current.value) {
                    let currenteObject = item;
                    currenteObject.cantidad = parseFloat(currenteObject.cantidad) + 1;
                    break;
                }
            }
        }

        let newArr = [...this.state.detalleVenta];


        await this.setStateAsync({
            detalleVenta: newArr,
            messageWarning: '',
            precioContado: '',
        });

        const { total } = this.calcularTotales();

        await this.setStateAsync({
            importeTotal: total
        });

        this.refLote.current.value = '';
    }

    validarDuplicado(id) {
        let value = false
        for (let item of this.state.detalleVenta) {
            if (item.idDetalle === id) {
                value = true
                break;
            }
        }
        return value
    }

    async removeObjectTable(id) {
        let newArr = [...this.state.detalleVenta];

        for (let i = 0; i < newArr.length; i++) {
            if (id === newArr[i].idDetalle) {
                newArr.splice(i, 1)
                i--;
                break;
            }
        }

        await this.setStateAsync({
            detalleVenta: newArr,
        })

        const { total } = this.calcularTotales();

        await this.setStateAsync({
            importeTotal: total
        })
    }

    async changeLote(event) {
        let precio = 0
        for (let i of this.state.lotes) {
            if (event.target.value === i.idLote) {
                precio = i.precio
                break
            }
        }
        await this.setStateAsync({
            precioContado: precio.toString()
        });

        this.refPrecioContado.current.focus();
    }

    async calcularLetraMensual() {
        if (this.state.numCuota === '') {
            return;
        }

        let saldo = this.state.importeTotal - (this.state.montoInicialCheck ? this.state.inicial : 0)
        let letra = saldo / this.state.numCuota

        await this.setStateAsync({ letraMensual: letra })
    }

    async onEventLimpiar() {
        await this.setStateAsync({
            idCliente: '',
            idComprobante: '',
            numCuota: '',
            estado: 1,
            idMoneda: '',
            monedas: [],

            lotes: [],
            precioContado: '',

            detalleVenta: [],
            comprobantes: [],
            clientes: [],

            impuestos: [],

            loading: true,
            messageWarning: '',

            importeTotal: 0,
            selectTipoPago: true,
            bancos: [],
            comprobantesCobro: [],
            idComprobanteContado: '',
            idBancoContado: '',
            metodoPagoContado: '',
            montoInicialCheck: false,
            inicial: '',
            idComprobanteCredito: '',
            idBancoCredito: '',
            metodoPagoCredito: '',
            letraMensual: '',
        });

        this.loadData();
    }

    calcularTotales() {
        let subTotal = 0;
        let impuestoTotal = 0;
        let total = 0;

        for (let item of this.state.detalleVenta) {
            let cantidad = item.cantidad;
            let valor = parseFloat(item.precioContado);
            let filter = item.impuestos.filter(imp =>
                imp.idImpuesto === item.idImpuesto
            )
            let impuesto = filter.length > 0 ? filter[0].porcentaje : 0;

            let valorActual = cantidad * valor;
            let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
            let valorImpuesto = calculateTax(impuesto, valorSubNeto);
            let valorNeto = valorSubNeto + valorImpuesto;

            subTotal += valorSubNeto;
            impuestoTotal += valorImpuesto;
            total += valorNeto;
        }
        return { subTotal, impuestoTotal, total }
    }

    renderTotal() {
        const { subTotal, impuestoTotal, total } = this.calcularTotales();
        let moneda = this.state.monedas.filter(item => item.idMoneda === this.state.idMoneda);
        let codigo = moneda.length > 0 ? moneda[0].codiso : "PEN";
        return (
            <>
                <tr>
                    <td className="text-left">Sub Total:</td>
                    <td className="text-right">{numberFormat(subTotal, codigo)}</td>
                </tr>
                <tr>
                    <td className="text-left">Impuesto:</td>
                    <td className="text-right">{numberFormat(impuestoTotal, codigo)}</td>
                </tr>
                <tr className="border-bottom">
                </tr>
                <tr>
                    <td className="text-left h4">Total:</td>
                    <td className="text-right h4">{numberFormat(total, codigo)}</td>
                </tr>
            </>
        )
    }

    async onEventOpenModal() {
        if (this.state.detalleVenta.length <= 0) {
            await this.setStateAsync({ messageWarning: "Agregar datos a la tabla." })
            this.refLote.current.focus()
            return;
        }

        if (this.state.idComprobante === '') {
            await this.setStateAsync({ messageWarning: "Seleccione el comprobante." })
            this.refComprobante.current.focus();
            return;
        }

        if (this.state.idCliente === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el cliente." });
            this.refCliente.current.focus();
            return;
        }
        if (this.state.idMoneda === "") {
            await this.setStateAsync({ messageWarning: "Seleccione la moneda." });
            this.refMoneda.current.focus();
            return;
        }

        let validate = this.state.detalleVenta.reduce((acumulador, item) =>
            item.idImpuesto === "" ? acumulador + 1 : acumulador + 0
            , 0);

        if (validate > 0) {
            await this.setStateAsync({ messageWarning: "Hay detalles en la tabla sin impuesto seleccionado." });
            let count = 0;
            for (let item of this.state.detalleVenta) {
                count++;
                if (item.idImpuesto === "") {
                    document.getElementById(count + "imv").focus()
                }
            }
            return;
        } else {
            await this.setStateAsync({ messageWarning: "" });
        }

        showModal("modalVentaProceso")

    }

    async onEventGuardar() {
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

    handleSelect = async (event, idDetalle) => {
        let updatedList = [...this.state.detalleVenta];
        for (let item of updatedList) {
            if (item.idDetalle === idDetalle) {
                item.idImpuesto = event.target.value;
                break;
            }
        }

        await this.setStateAsync({ detalleVenta: updatedList })
    }

    render() {
        return (
            <>
                {/* Inicio modal */}
                <div className="modal fade" id="modalVentaProceso" data-bs-keyboard="false" data-bs-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Completar Venta</h6>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className="row">
                                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                        <div className="text-center">
                                            <h5>TOTAL A PAGAR: <span>{formatMoney(this.state.importeTotal)}</span></h5>
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
                                        <button className={`btn ${this.state.selectTipoPago ? "btn-primary" : "btn-light"} btn-block`}
                                            type="button"
                                            title="Pago al contado"
                                            onClick={() => this.setState({ selectTipoPago: !this.state.selectTipoPago })}>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <i className="bi bi-cash-coin fa-2x"></i>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <label>Contado</label>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="col-md-6 col-sm-6">
                                        <button className={`btn ${!this.state.selectTipoPago ? "btn-primary" : "btn-light"} btn-block`}
                                            type="button"
                                            title="Pago al credito"
                                            onClick={() => this.setState({ selectTipoPago: !this.state.selectTipoPago })}>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <i className="bi bi-boxes fa-2x"></i>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <label>Crédito</label>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <br />
                                {/* contado detalle */}
                                {
                                    this.state.selectTipoPago ?
                                        <div className="row">
                                            <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                                <div className="form-row">
                                                    <div className="form-group col-md-12">
                                                        <div className="input-group">
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
                                                        <div className="input-group">
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
                                                        <div className="input-group">
                                                            <div className="input-group-prepend">
                                                                <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                                            </div>
                                                            <select
                                                                title="Lista metodo de pago"
                                                                className="form-control"
                                                                ref={this.refMetodoContado}
                                                                value={this.state.metodoPagoContado}
                                                                onChange={(event) => this.setState({ metodoPagoContado: event.target.value })}>
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
                                                </div>
                                            </div>
                                        </div>
                                        :
                                        null
                                }
                                {/* crédito detalle */}
                                {
                                    !this.state.selectTipoPago ?
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
                        </div> :
                        <>
                            <div className='row pb-3'>
                                <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                    <section className="content-header">
                                        <h5>
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Registrar Venta
                                            <small className="text-secondary"> nueva</small>
                                        </h5>
                                    </section>
                                </div>
                            </div>

                            {
                                this.state.messageWarning === '' ? null :
                                    <div className="alert alert-warning" role="alert">
                                        <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                    </div>
                            }

                            <div className="row">
                                <div className="col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12">

                                    <div className="form-row">
                                        <div className="form-group col-md-6">
                                            <div className="input-group">
                                                <div className="input-group-prepend">
                                                    <div className="input-group-text"><i className="bi bi-cart4"></i></div>
                                                </div>
                                                <select
                                                    title="Lista de lotes"
                                                    className="form-control"
                                                    ref={this.refLote}
                                                    onChange={(event) => this.changeLote(event)}>
                                                    <option value="">-- seleccione --</option>
                                                    {
                                                        this.state.lotes.map((item, index) => (
                                                            <option key={index} value={item.idLote}>{`${item.nombreLote} / ${item.nombreManzana} - ${item.precio}`}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group col-md-6">
                                            <div className="input-group">
                                                <div className="input-group-prepend">
                                                    <div className="input-group-text"><i className="bi bi-tag-fill"></i></div>
                                                </div>
                                                <input
                                                    title="Precio de venta"
                                                    type="text"
                                                    className="form-control"
                                                    placeholder='0.00'
                                                    ref={this.refPrecioContado}
                                                    value={this.state.precioContado}
                                                    onChange={(event) => {

                                                        if (event.target.value.trim().length > 0) {
                                                            this.setState({
                                                                precioContado: event.target.value,
                                                                messageWarning: '',
                                                            });
                                                        } else {
                                                            this.setState({
                                                                precioContado: event.target.value,
                                                                messageWarning: 'Ingrese el precio de venta.',
                                                            });
                                                        }
                                                    }}
                                                    onKeyPress={keyNumberFloat} />

                                                <button className="btn btn-outline-secondary ml-1" type="button" title="Agregar" onClick={() => this.addObjectTable()}><i className="bi bi-plus-circle"></i></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="table-responsive">
                                            <table className="table table-striped table-bordered rounded">
                                                <thead>
                                                    <tr>
                                                        <th width="10%">#</th>
                                                        <th width="30%">Descripción</th>
                                                        <th width="10%">Cantidad </th>
                                                        <th width="20%">Impuesto</th>
                                                        <th width="10%">Precio </th>
                                                        <th width="10%">Importe </th>
                                                        <th width="5%">Quitar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.detalleVenta.length === 0 ? (
                                                            <tr className="text-center">
                                                                <td colSpan="7"> Agregar datos a la tabla </td>
                                                            </tr>
                                                        ) : (
                                                            this.state.detalleVenta.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{++index}</td>
                                                                    <td>{`${item.nombreLote} / ${item.nombreManzana}`}</td>
                                                                    <td>{item.cantidad}</td>
                                                                    <td>
                                                                        <select className="form-control"
                                                                            id={index + "imv"}
                                                                            value={item.idImpuesto}
                                                                            onChange={(event) => this.handleSelect(event, item.idDetalle)}>
                                                                            <option value="">- Seleccione -</option>
                                                                            {
                                                                                item.impuestos.map((imp, iimp) => (
                                                                                    <option key={iimp} value={imp.idImpuesto}
                                                                                    >{imp.nombre}</option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                    </td>
                                                                    <td>{item.precioContado}</td>
                                                                    <td>{item.precioContado * item.cantidad}</td>
                                                                    <td>
                                                                        <button className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => this.removeObjectTable(item.idDetalle)}><i className="bi bi-trash"></i></button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-12">

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

                                    <div className="form-group">
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-person-fill"></i></div>
                                            </div>
                                            <select
                                                title="Lista de clientes"
                                                className="form-control"
                                                ref={this.refCliente}
                                                value={this.state.idCliente}
                                                onChange={(event) => this.setState({ idCliente: event.target.value })}>
                                                <option value="">-- Clientes --</option>
                                                {
                                                    this.state.clientes.map((item, index) => (
                                                        <option key={index} value={item.idCliente}>{item.informacion}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-cash"></i></div>
                                            </div>
                                            <select
                                                title="Lista metodo de pago"
                                                className="form-control"
                                                ref={this.refMoneda}
                                                value={this.state.idMoneda}
                                                onChange={(event) => {
                                                    if (event.target.value.length > 0) {
                                                        this.setState({
                                                            idMoneda: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            idMoneda: event.target.value,
                                                            messageWarning: "Seleccione un moneda.",
                                                        });
                                                    }
                                                }}>
                                                <option value="">-- Moneda --</option>
                                                {
                                                    this.state.monedas.map((item, index) => (
                                                        <option key={index} value={item.idMoneda}>{item.nombre}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <table width="100%">
                                            <tbody>
                                                {this.renderTotal()}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>

                            <div className="row">
                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="form-row">
                                        <div className="form-group col-md-12">
                                            <button type="button" className="btn btn-success" onClick={() => this.onEventOpenModal()}>
                                                <i className="fa fa-save"></i> Guardar
                                            </button>
                                            {" "}
                                            <button type="button" className="btn btn-outline-info" onClick={() => this.onEventLimpiar()}>
                                                <i className="fa fa-trash"></i> Limpiar
                                            </button>
                                            {" "}
                                            <button type="button" className="btn btn-outline-secondary" onClick={() => this.props.history.goBack()}>
                                                <i className="fa fa-close"></i> Cerrar
                                            </button>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                }
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(VentaProceso);