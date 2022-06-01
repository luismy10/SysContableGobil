import React from 'react';
import axios from 'axios';
import {
    calculateTax,
    calculateTaxBruto,
    formatMoney,
    numberFormat,
    keyNumberFloat,
    isNumeric,
    spinnerLoading,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../../tools/Tools';
import { connect } from 'react-redux';

class CobroProceso extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idCliente: '',
            clientes: [],
            idComprobante: '',
            comprobantes: [],
            idMoneda: '',
            monedas: [],
            idConcepto: '',
            conceptos: [],
            monto: '',
            idBanco: '',
            cuentasBancarias: [],
            metodoPago: '',
            observacion: '',
            detalleConcepto: [],
            idUsuario: this.props.token.userToken.idUsuario,

            idProyecto: this.props.token.project.idProyecto,

            impuestos: [],

            idLote: '',
            lotes: [],

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...'
        }
        this.refComprobante = React.createRef();
        this.refConcepto = React.createRef()
        this.refMonto = React.createRef()

        this.refCliente = React.createRef()
        this.refCuentaBancaria = React.createRef()
        this.refMoneda = React.createRef()
        this.refMetodoPago = React.createRef()
        this.refObservacion = React.createRef()
        this.refLote = React.createRef()

        this.abortControllerView = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
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
                    "tipo": "5"
                }
            });

            const concepto = await axios.get("/api/concepto/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const cliente = await axios.get("/api/cliente/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const cuentaBancaria = await axios.get("/api/banco/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const impuesto = await axios.get("/api/impuesto/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const comprobanteFilter = comprobante.data.filter(item => item.preferida === 1);

            const monedaFilter = moneda.data.filter(item => item.predeterminado === 1);

            await this.setStateAsync({
                comprobantes: comprobante.data,
                conceptos: concepto.data,
                clientes: cliente.data,
                cuentasBancarias: cuentaBancaria.data,
                monedas: moneda.data,
                idMoneda: monedaFilter.length > 0 ? monedaFilter[0].idMoneda : '',
                idComprobante: comprobanteFilter.length > 0 ? comprobanteFilter[0].idComprobante : '',
                impuestos: impuesto.data,
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

    async addConcepto() {
        if (this.state.idConcepto === '') {
            await this.setStateAsync({ messageWarning: "Seleccione un concepto" })
            this.refConcepto.current.focus();
            return;
        }

        if (!isNumeric(this.state.monto)) {
            await this.setStateAsync({ messageWarning: "Ingrese un monto númerico" })
            this.refMonto.current.focus();
            return;
        }

        if (this.state.monto <= 0) {
            await this.setStateAsync({ messageWarning: "Ingrese un monto mayor a 0" })
            this.refMonto.current.focus();
            return;
        }

        let nombre = "";
        for (let item of this.state.conceptos) {
            if (this.state.idConcepto === item.idConcepto) {
                nombre = item.nombre;
                break;
            }
        }

        if (!this.validarDuplicado(this.state.idConcepto)) {
            let detalle = {
                "idConcepto": this.state.idConcepto,
                "concepto": nombre,
                "cantidad": 1,
                "idImpuesto": "",
                "impuestos": this.state.impuestos,
                "monto": this.state.monto
            }

            this.state.detalleConcepto.push(detalle)
        } else {
            for (let item of this.state.detalleConcepto) {
                if (item.idConcepto === this.state.idConcepto) {
                    let currenteObject = item;
                    currenteObject.cantidad = parseFloat(currenteObject.cantidad) + 1;
                    break;
                }
            }
        }

        let newArr = [...this.state.detalleConcepto];

        await this.setStateAsync({
            detalleConcepto: newArr,
            idConcepto: '',
            messageWarning: ''
        });
        this.refConcepto.current.focus();
    }

    validarDuplicado(id) {
        let value = false
        for (let item of this.state.detalleConcepto) {
            if (item.idConcepto === id) {
                value = true
                break;
            }
        }
        return value
    }

    async removerConcepto(id) {
        for (let i = 0; i < this.state.detalleConcepto.length; i++) {
            if (id === this.state.detalleConcepto[i].id) {
                this.state.detalleConcepto.splice(i, 1)
                i--;
                break;
            }
        }

        await this.setStateAsync({
            detalleConcepto: this.state.detalleConcepto
        })
    }

    async onEventGuardar() {
        if (this.state.idComprobante === '') {
            await this.setStateAsync({ messageWarning: "Seleccione el comprobante." })
            this.refComprobante.current.focus();
            return;
        }

        if (this.refCliente.current.value === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el cliente." });
            this.refCliente.current.focus();
            return;
        }

        if (this.state.idBanco === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el banco a depositar." })
            this.refCuentaBancaria.current.focus();
            return;
        }

        if (this.state.metodoPago === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el metodo de pago." })
            this.refMetodoPago.current.focus();
            return;
        }

        if (this.state.idMoneda === "") {
            await this.setStateAsync({ messageWarning: "Seleccione un moneda." })
            this.refMoneda.current.focus();
            return;
        }

        if (this.state.detalleConcepto.length <= 0) {
            await this.setStateAsync({ messageWarning: "Agregar datos a la tabla." })
            this.refConcepto.current.focus()
            return;
        }

        let validate = this.state.detalleConcepto.reduce((acumulador, item) =>
            item.idImpuesto === "" ? acumulador + 1 : acumulador + 0
            , 0);

        if (validate > 0) {
            await this.setStateAsync({ messageWarning: "Hay detalles en la tabla sin impuesto seleccionado." });
            let count = 0;
            for (let item of this.state.detalleConcepto) {
                count++;
                if (item.idImpuesto === "") {
                    document.getElementById(count + "imc").focus()
                }
            }
            return;
        } else {
            await this.setStateAsync({ messageWarning: "" });
        }

        ModalAlertDialog("Cobro", "¿Estás seguro de continuar?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Cobro", "Procesando información...");
                    let result = await axios.post('/api/cobro/add', {
                        "idComprobante": this.state.idComprobante,
                        "idCliente": this.state.idCliente,
                        "idUsuario": this.state.idUsuario,
                        'idMoneda': this.state.idMoneda,
                        "idBanco": this.state.idBanco,
                        "idProcedencia": this.state.idLote,
                        "metodoPago": this.state.metodoPago,
                        "estado": 1,
                        "observacion": this.state.observacion.trim().toUpperCase(),
                        "idProyecto": this.state.idProyecto,
                        "cobroDetalle": this.state.detalleConcepto
                    });

                    ModalAlertSuccess("Cobro", result.data, () => {
                        this.onEventLimpiar()
                    });
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Cobro", error.response.data)
                    } else {
                        ModalAlertWarning("Cobro", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        });
    }

    async onEventLimpiar() {
        await this.setStateAsync({
            idComprobante: '',
            comprobantes: [],
            idCliente: '',
            clientes: [],
            idMoneda: '',
            monedas: [],
            idConcepto: '',
            conceptos: [],
            idBanco: '',
            cuentasBancarias: [],
            metodoPago: '',
            observacion: '',
            detalleConcepto: [],

            monto: '',

            impuestos: [],

            idLote: '',
            lotes: [],

            loading: true,

        });

        this.loadData();
    }

    calcularTotales() {
        let subTotal = 0;
        let impuestoTotal = 0;
        let total = 0;

        for (let item of this.state.detalleConcepto) {
            let cantidad = item.cantidad;
            let valor = parseFloat(item.monto);
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

    handleSelect = async (event, idConcepto) => {
        let updatedList = [...this.state.detalleConcepto];
        for (let item of updatedList) {
            if (item.idConcepto === idConcepto) {
                item.idImpuesto = event.target.value;
                break;
            }
        }

        await this.setStateAsync({ detalleConcepto: updatedList })
    }

    loadLoteCliente = async (id) => {
        try {
            await this.setStateAsync({ loading: true, lotes: [], idLote: '' })

            const lote = await axios.get("/api/lote/lotecliente", {
                signal: this.abortControllerView.signal,
                params: {
                    "idCliente": id
                }
            });

            await this.setStateAsync({
                lotes: lote.data,
                loading: false
            });
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente.",
                    loading: false
                });
            }
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
                            <div className='row'>
                                <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                    <div className="form-group">
                                        <h5>
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Cobro
                                            <small className="text-secondary"> proceso</small>
                                        </h5>
                                    </div>
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
                                                    title="Lista de conceptos"
                                                    className="form-control"
                                                    ref={this.refConcepto}
                                                    value={this.state.idConcepto}
                                                    onChange={(event) => {
                                                        this.setState({
                                                            idConcepto: event.target.value,
                                                            monto: "1"
                                                        });
                                                        this.refMonto.current.focus()
                                                    }}>
                                                    <option value="">-- seleccione --</option>
                                                    {
                                                        this.state.conceptos.map((item, index) => (
                                                            <option key={index} value={item.idConcepto}>{item.nombre}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group col-md-6">
                                            <div className="input-group">
                                                <div className="input-group-prepend">
                                                    <div className="input-group-text"><i className="bi bi-cash-coin"></i></div>
                                                </div>
                                                <input
                                                    title="Valor a cobrar"
                                                    type="text"
                                                    className="form-control"
                                                    ref={this.refMonto}
                                                    value={this.state.monto}
                                                    onChange={async (event) => {
                                                        if (event.target.value.trim().length > 0) {
                                                            await this.setStateAsync({
                                                                monto: event.target.value,
                                                                messageWarning: '',
                                                            });
                                                        } else {
                                                            await this.setStateAsync({
                                                                monto: event.target.value,
                                                                messageWarning: 'Ingrese el monto',
                                                            });
                                                        }
                                                    }}
                                                    placeholder="Ingrese el monto"
                                                    onKeyPress={keyNumberFloat}
                                                />
                                                <button className="btn btn-outline-secondary ml-1" type="button" title="Agregar" onClick={() => this.addConcepto()}><i className="bi bi-plus-circle"></i></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="table-responsive">
                                            <table className="table table-striped table-bordered rounded">
                                                <thead>
                                                    <tr>
                                                        <th width="5%">#</th>
                                                        <th width="30%">Concepto</th>
                                                        <th width="10%">Cantidad</th>
                                                        <th width="20%">Impuesto</th>
                                                        <th width="10%">Valor</th>
                                                        <th width="10%">Total</th>
                                                        <th width="5%">Quitar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.detalleConcepto.length === 0 ? (
                                                            <tr className="text-center">
                                                                <td colSpan="7"> Agregar datos a la tabla </td>
                                                            </tr>
                                                        ) : (

                                                            this.state.detalleConcepto.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{++index}</td>
                                                                    <td>{item.concepto}</td>
                                                                    <td>{formatMoney(item.cantidad)}</td>
                                                                    <td>
                                                                        <select className="form-control"
                                                                            id={index + "imc"}
                                                                            value={item.idImpuesto}
                                                                            onChange={(event) => this.handleSelect(event, item.idConcepto)}>
                                                                            <option value="">- Seleccione -</option>
                                                                            {
                                                                                item.impuestos.map((imp, iimp) => (
                                                                                    <option key={iimp} value={imp.idImpuesto}
                                                                                    >{imp.nombre}</option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                    </td>
                                                                    <td>{formatMoney(item.monto)}</td>
                                                                    <td>{formatMoney(item.cantidad * item.monto)}</td>
                                                                    <td>
                                                                        <button className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => this.removerConcepto(item.id)}><i className="bi bi-trash"></i></button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )
                                                    }
                                                </tbody>

                                            </table>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <button type="button" className="btn btn-success" onClick={() => this.onEventGuardar()}>
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
                                                onChange={async (event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        await this.setStateAsync({
                                                            idCliente: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                        this.loadLoteCliente(this.state.idCliente)
                                                    } else {
                                                        await this.setStateAsync({
                                                            idCliente: event.target.value,
                                                            messageWarning: "Seleccione el cliente.",
                                                        });
                                                    }
                                                }}>
                                                <option value="">-- Cliente --</option>
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
                                                <div className="input-group-text"><i className="bi bi-bank"></i></div>
                                            </div>
                                            <select
                                                title="Lista de caja o banco a depositar"
                                                className="form-control"
                                                ref={this.refCuentaBancaria}
                                                value={this.state.idBanco}
                                                onChange={async (event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        await this.setStateAsync({
                                                            idBanco: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        await this.setStateAsync({
                                                            idBanco: event.target.value,
                                                            messageWarning: 'Seleccione el banco a depositar.',
                                                        });
                                                    }
                                                }}>
                                                <option value="">-- Cuenta bancaria --</option>
                                                {
                                                    this.state.cuentasBancarias.map((item, index) => (
                                                        <option key={index} value={item.idBanco}>{item.nombre}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-credit-card-2-back"></i></div>
                                            </div>
                                            <select
                                                title="Lista metodo de pago"
                                                className="form-control"
                                                value={this.state.metodoPago}
                                                ref={this.refMetodoPago}
                                                onChange={async (event) => {
                                                    if (event.target.value.length > 0) {
                                                        await this.setStateAsync({
                                                            metodoPago: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        await this.setStateAsync({
                                                            metodoPago: event.target.value,
                                                            messageWarning: 'Seleccione el metodo de pago.',
                                                        });
                                                    }
                                                }}>
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
                                                onChange={async (event) => {
                                                    if (event.target.value.length > 0) {
                                                        await this.setStateAsync({
                                                            idMoneda: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        await this.setStateAsync({
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
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-box"></i></div>
                                            </div>
                                            <select
                                                title="Lista de lotes del cliente"
                                                className="form-control"
                                                ref={this.refLote}
                                                value={this.state.idLote}
                                                onChange={async (event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        await this.setStateAsync({
                                                            idLote: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        await this.setStateAsync({
                                                            idLote: event.target.value,
                                                            messageWarning: "Seleccione un lote del cliente.",
                                                        });
                                                    }
                                                }}>
                                                <option value="">-- Lotes del cliente --</option>

                                                {
                                                    this.state.lotes.map((item, index) => (
                                                        <option key={index} value={item.idLote}>{item.lote + " - " + item.manzana}</option>
                                                    ))
                                                }

                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-chat-dots-fill"></i></div>
                                            </div>
                                            <textarea
                                                title="Observaciones..."
                                                className="form-control"
                                                style={{ fontSize: '13px' }}
                                                ref={this.refObservacion}
                                                value={this.state.observacion}
                                                onChange={(event) => this.setState({ observacion: event.target.value, })}
                                                placeholder="Ingrese alguna observación">
                                            </textarea>
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
                        </>
                }
            </>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(CobroProceso);