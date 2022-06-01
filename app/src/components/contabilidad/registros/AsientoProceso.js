import React from 'react';
import axios from 'axios';
import {
    isNumeric,
    currentDate,
    spinnerLoading,
    keyNumberPhone,
    keyNumberInteger,
    keyNumberFloat,
    convertNullText,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../../tools/Tools';
import { connect } from 'react-redux';
import SearchBarConceptos from '../../tools/SearchBarConceptos';

class AsientoProceso extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            fecha: currentDate(),

            idConcepto: '',
            nombreConcepto: '',
            filter: false,
            filteredData: [],

            idComprobante: '',
            comprobantes: [],
            idCliente: '',
            clientes: [],
            observacion: '',
            sumaDebito: 0,
            sumaCredito: 0,

            detalleTabla: [],

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',
            comprobanteCheck: false,

        }

        this.refConcepto = React.createRef()
        this.refComprobante = React.createRef()

        this.abortControllerView = new AbortController();

        this.selectItem = false;
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadInit();
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    async loadInit() {
        try {

            const comprobante = await axios.get("/api/comprobante/listcomboall", {
                signal: this.abortControllerView.signal,
            });

            const cliente = await axios.get("/api/cliente/listcombo", {
                signal: this.abortControllerView.signal,
            });

            await this.setStateAsync({
                comprobantes: comprobante.data,
                clientes: cliente.data,

                loading: false,
            });

            this.refConcepto.current.focus()

        } catch (error) {
            console.log(error);
        }
    }

    handleFilter = async (event) => {

        const searchWord = this.selectItem ? "" : event.target.value;
        await this.setStateAsync({ idConcepto: '', nombreConcepto: searchWord });
        this.selectItem = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ filteredData: [] });
            return;
        }

        if (this.state.filter) return;

        try {
            await this.setStateAsync({ filter: true });
            let result = await axios.get("/api/concepto/listacomboconceptos", {
                params: {
                    filtrar: searchWord,
                },
            });
            await this.setStateAsync({ filter: false, filteredData: result.data });
        } catch (error) {
            await this.setStateAsync({ filter: false, filteredData: [] });
        }
    }

    onEventSelectItem = async (value) => {

        this.addObjectTable(value)

        await this.setStateAsync({
            nombreConcepto: `${value.codigo} - ${value.nombreConcepto}`,
            filteredData: [],
            idConcepto: value.idConcepto
        });
        this.selectItem = true;
    }

    onEventClearInput = async () => {
        await this.setStateAsync({ filteredData: [], idConcepto: '', nombreConcepto: "" });
        this.selectItem = false;
    }

    async addObjectTable(value) {

        let row = {
            "idConcepto": value.idConcepto,
            "codigo": value.codigo,
            "nombre": value.nombreConcepto,
            "descripcion": '',
            "debito": '',
            "credito": '',
            "disableDebito": false,
            "disableCredito": false
        }

        if (this.state.detalleTabla.length === 0) {

            this.state.detalleTabla.push(row)

        } else {

            if (!this.validarDuplicado(value.idConcepto)) {

                this.state.detalleTabla.push(row)

            } else {
                console.log('ya existe la cuenta en la tabla')
            }
        }
    }

    validarDuplicado(id) {
        let value = false
        for (let item of this.state.detalleTabla) {
            if (item.idConcepto === id) {
                value = true
                break;
            }
        }
        return value
    }

    async removeObjectTable(id) {

        let newArr = [...this.state.detalleTabla];

        for (let i = 0; i < newArr.length; i++) {
            if (id === newArr[i].idConcepto) {
                newArr.splice(i, 1)
                i--;
                break;
            }
        }

        const { debito, credito } = this.calculateTotal(newArr)

        await this.setStateAsync({
            detalleTabla: newArr,
            sumaDebito: debito,
            sumaCredito: credito
        })

    }

    async onEventSave() {

        if (parseFloat(this.state.sumaDebito) === parseFloat(this.state.sumaCredito)) {
            if (this.state.detalleTabla.length === 0) {
                this.refConcepto.current.focus();
            } else {
                try {
                    ModalAlertInfo("Asiento", "Procesando información...");

                    const asiento = await axios.post('/api/asiento/add', {
                        "idComprobante": this.state.idComprobante,
                        "idPersona": this.state.idCliente,
                        "idUsuario": this.props.token.userToken.idUsuario,
                        "serie": 'DC',
                        "numeracion": 1,
                        "total": this.state.sumaDebito,
                        "observacion": this.state.observacion.trim().toUpperCase(),
                        "tipo": 1,
                        "estado": 1,
                        "fecha": this.state.fecha,
                        "detalle": this.state.detalleTabla
                    })
                    ModalAlertSuccess("Asiento", asiento.data, () => {
                        this.loadInit()
                    });

                    this.onEventLimpiar()

                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Asiento", error.response.data)
                    } else {
                        ModalAlertWarning("Asiento", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }

        } else {
            console.log("no son iguales")
        }

    }

    async onEventLimpiar() {
        await this.setStateAsync({

            fecha: currentDate(),

            idConcepto: '',
            nombreConcepto: '',
            filter: false,
            filteredData: [],

            idComprobante: '',
            idCliente: '',

            observacion: '',
            sumaDebito: 0,
            sumaCredito: 0,

            comprobanteCheck: false,

            detalleTabla: [],

        })

        this.refConcepto.current.focus()
    }

    calculateTotal(array) {
        let debito = 0;
        let credito = 0;
        for (let item of array) {
            debito += isNumeric(item.debito) ? parseInt(item.debito) : 0;
            credito += isNumeric(item.credito) ? parseInt(item.credito) : 0;
        }
        return { debito, credito };
    }

    handleSelectDebito = async (event, idConcepto) => {
        const updateDetalleTabla = [...this.state.detalleTabla];
        for (let item of updateDetalleTabla) {
            if (item.idConcepto === idConcepto) {
                item.debito = event.target.value;

                item.disableCredito = item.debito !== "" ? true : false;
                break;
            }
        }

        const { debito, credito } = this.calculateTotal(updateDetalleTabla)

        await this.setStateAsync({
            detalleTabla: updateDetalleTabla,
            sumaDebito: debito,
            sumaCredito: credito
        })

    }

    handleSelectCredito = async (event, idConcepto) => {
        const updateDetalleTabla = [...this.state.detalleTabla];
        for (let item of updateDetalleTabla) {
            if (item.idConcepto === idConcepto) {
                item.credito = event.target.value;
                item.disableDebito = item.credito !== "" ? true : false;
                break;
            }
        }

        const { debito, credito } = this.calculateTotal(updateDetalleTabla)

        await this.setStateAsync({
            detalleTabla: updateDetalleTabla,
            sumaDebito: debito,
            sumaCredito: credito
        })
    }

    handleSelectDescripcion = async (event, idConcepto) => {
        const updateDetalleTabla = [...this.state.detalleTabla];
        for (let item of updateDetalleTabla) {
            if (item.idConcepto === idConcepto) {
                item.descripcion = event.target.value;
                break;
            }
        }
        await this.setStateAsync({
            detalleTabla: updateDetalleTabla,
        })
    }

    render() {
        return (
            <>

                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div>
                        :
                        <>
                            <div className='row'>
                                <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                    <section className="content-header">
                                        <h5>
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Registrar Asiento
                                        </h5>
                                    </section>
                                </div>
                            </div>

                            <div className="row">

                                <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-12">
                                    <div className="form-group">
                                        <span>Fecha <i className="fa fa-asterisk text-danger small"></i> </span>
                                        <div className="input-group input-group-sm">
                                            <input
                                                title="Fecha de registro"
                                                type="date"
                                                className="form-control"
                                                value={this.state.fecha}
                                                onChange={(event) => this.setState({ fecha: event.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-12">
                                    <div className="form-group">
                                        <span>Comprobantes</span>
                                        <div className="input-group input-group-sm">
                                            <select
                                                title="Lista de comprobantes"
                                                className="form-control"
                                                disabled={!this.state.comprobanteCheck}
                                                ref={this.refComprobante}
                                                value={this.state.idComprobante}
                                                onChange={(event) => this.setState({ idComprobante: event.target.value })}>
                                                <option value="">-- Seleccione --</option>
                                                {
                                                    this.state.comprobantes.map((item, index) => (
                                                        <option key={index} value={item.idComprobante}>{item.serie} - {item.nombre}</option>
                                                    ))
                                                }
                                            </select>
                                            <div className="input-group-append">
                                                <div className="input-group-text">
                                                    <div className="form-check form-check-inline m-0">
                                                        <input
                                                            title="Habilitar los comprobantes"
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={this.state.comprobanteCheck}
                                                            onChange={async (event) => {
                                                                await this.setStateAsync({ comprobanteCheck: event.target.checked })
                                                                this.refComprobante.current.focus();
                                                                if (!this.state.comprobanteCheck) {
                                                                    await this.setStateAsync({ idComprobante: '', idCliente: '' })
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-12">
                                    {
                                        this.state.comprobanteCheck ?
                                            <div className="form-group">
                                                <span>Personas</span>
                                                <div className="input-group input-group-sm">
                                                    <select
                                                        title="Lista de personas"
                                                        className="form-control"
                                                        ref={this.refCliente}
                                                        value={this.state.idCliente}
                                                        onChange={(event) => this.setState({ idCliente: event.target.value })}>
                                                        <option value="">-- Seleccione --</option>
                                                        {
                                                            this.state.clientes.map((item, index) => (
                                                                <option key={index} value={item.idCliente}>{item.informacion}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </div>
                                            : null
                                    }
                                </div>

                            </div>

                            <div className="row">
                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="form-group">
                                        <span>Observación</span>
                                        <div className="input-group input-group-sm">

                                            <input
                                                title="Observación a la transacción"
                                                className="form-control"
                                                placeholder="Ingreser una observación"
                                                value={this.state.observacion}
                                                onChange={(event) => this.setState({ observacion: event.target.value })}>
                                            </input>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">

                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="form-row">
                                        <div className="form-group col-md-12">
                                            <span>Cuentas</span>
                                            <SearchBarConceptos
                                                placeholder="Escribe el codigo o nombre para filtrar..."
                                                refConcepto={this.refConcepto}
                                                nombreConcepto={this.state.nombreConcepto}
                                                filteredData={this.state.filteredData}
                                                onEventClearInput={this.onEventClearInput}
                                                handleFilter={this.handleFilter}
                                                onEventSelectItem={this.onEventSelectItem}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="table-responsive">
                                            <table className="table table-striped table-bordered rounded">
                                                <thead>
                                                    <tr>
                                                        <th width="auto" className="p-1">Quitar</th>
                                                        <th width="40%" className="p-1">Cuenta</th>
                                                        <th width="40%" className="p-1">Descripcion</th>
                                                        <th width="10%" className="p-1">Débito</th>
                                                        <th width="10%" className="p-1">Crédito</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.detalleTabla.length === 0 ? (
                                                            <tr className="text-center">
                                                                <td colSpan="5" className="p-1"> Agregar datos a la tabla </td>
                                                            </tr>
                                                        ) : (
                                                            this.state.detalleTabla.map((item, index) => (
                                                                <tr key={index} style={{ "fontSize": "12px" }}>
                                                                    <td className="p-1">
                                                                        <button className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => this.removeObjectTable(item.idConcepto)}><i className="bi bi-trash"></i></button>
                                                                    </td>
                                                                    <td className="p-1"><span className="font-weight-bold">{item.codigo}</span> {item.nombre}</td>
                                                                    <td className="p-1">
                                                                        <input className="form-control form-control-sm"
                                                                            id={index}
                                                                            autoComplete="off"
                                                                            value={item.descripcion}
                                                                            onChange={(event) => this.handleSelectDescripcion(event, item.idConcepto)}
                                                                        />
                                                                    </td>
                                                                    <td className="p-1">
                                                                        <input className="form-control form-control-sm"
                                                                            id={index}
                                                                            autoComplete="off"
                                                                            disabled={item.disableDebito}
                                                                            value={item.debito}
                                                                            onChange={(event) => this.handleSelectDebito(event, item.idConcepto)}
                                                                            onKeyPress={keyNumberFloat}
                                                                        />
                                                                    </td>
                                                                    <td className="p-1">
                                                                        <input className="form-control form-control-sm"
                                                                            id={index}
                                                                            autoComplete="off"
                                                                            disabled={item.disableCredito}
                                                                            value={item.credito}
                                                                            onChange={(event) => this.handleSelectCredito(event, item.idConcepto)}
                                                                            onKeyPress={keyNumberFloat}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )
                                                    }
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td className="text-right p-1" width="auto" colSpan={3}>Total: M</td>
                                                        <td className="text-right p-1">{this.state.sumaDebito}</td>
                                                        <td className="text-right p-1">{this.state.sumaCredito}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="form-row">
                                        <div className="form-group col-md-12">
                                            <button type="button" className="btn btn-success" onClick={() => this.onEventSave()}>
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
        )
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(AsientoProceso);

