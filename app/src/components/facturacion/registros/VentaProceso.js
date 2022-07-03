import React from 'react';
import axios from 'axios';
import {
    formatMoney,
    numberFormat,
    calculateTaxBruto,
    calculateTax,
    keyNumberFloat,
    isNumeric,
    showModal,
    hideModal,
    spinnerLoading
} from '../../tools/Tools';
import ModalProductos from './ModalProductos';
import VentaCobro from './VentaCobro'

class VentaProceso extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

            almacenes: [],
            idAlmacen: '',
            nombreAlmacen: '',

            idComprobante: '',
            comprobantes: [],

            idCliente: '',
            nombreDoc: '',
            numeroDoc: '',
            infoCliente: '',
            direccion: '',

            idMoneda: '',
            monedas: [],

            impuestos: [],

            detalleVenta: [],
            importeTotal: 0,

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',

            loadCliente: true,
            msgCliente: 'Cargando información...',

            //Modals 
            idModalProductos: 'Productos',
            isViewModalProductos: false,

            idModalCobro: 'Cobro',
            isViewModalCobro: false
        }

        this.refAlmacen = React.createRef();
        this.refComprobante = React.createRef();
        this.refNumeroDocumento = React.createRef();
        this.refMoneda = React.createRef();

        this.refBtnProductos = React.createRef();

        this.abortControllerView = new AbortController();
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

            const almacenVenta = await axios.get("/api/almacen/listcomboventa", {
                signal: this.abortControllerView.signal,
            });

            const comprobante = await axios.get("/api/comprobante/listcombo", {
                signal: this.abortControllerView.signal,
                params: {
                    "tipo": "1"
                }
            });

            const cliente = await axios.get("/api/cliente/clientepredeterminado", {
                signal: this.abortControllerView.signal
            });

            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const impuesto = await axios.get("/api/impuesto/listcombo", {
                signal: this.abortControllerView.signal,
            });

            const almacenFilter = almacenVenta.data.filter(item => item.predeterminado === 1)

            const comprobanteFilter = comprobante.data.filter(item => item.preferida === 1);

            const monedaFilter = moneda.data.filter(item => item.predeterminado === 1);

            const clientePredeterminado = cliente.data

            await this.setStateAsync({
                almacenes: almacenVenta.data,
                idAlmacen: almacenFilter.length > 0 ? almacenFilter[0].idAlmacen : '',
                nombreAlmacen: almacenFilter.length > 0 ? almacenFilter[0].nombre : '',

                comprobantes: comprobante.data,
                idComprobante: comprobanteFilter.length > 0 ? comprobanteFilter[0].idComprobante : '',

                idCliente: clientePredeterminado !== false ? clientePredeterminado.idCliente : '',
                nombreDoc: clientePredeterminado !== false ? clientePredeterminado.nombreDoc : '',
                numeroDoc: clientePredeterminado !== false ? clientePredeterminado.numeroDoc : '',
                infoCliente: clientePredeterminado !== false ? clientePredeterminado.informacion : '',
                direccion: clientePredeterminado !== false ? clientePredeterminado.direccion : '',

                monedas: moneda.data,
                idMoneda: monedaFilter.length > 0 ? monedaFilter[0].idMoneda : '',

                impuestos: impuesto.data,

                loading: false,
                loadCliente: false
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    // Productos

    openProductosModal = async () => {
        if (this.state.idAlmacen === "") {
            this.setState({ messageWarning: "Seleccione el almacen." });
            this.refAlmacen.current.focus();
        } else {
            await this.setStateAsync({
                isViewModalProductos: true
            })
            showModal(this.state.idModalProductos)
        }

    }

    closeProductosModal = async () => {
        hideModal(this.state.idModalProductos)
        await this.setStateAsync({
            isViewModalProductos: false
        })
    }

    consultaDocumento = async () => {
        if (this.refNumeroDocumento.current.value === undefined || this.refNumeroDocumento.current.value === '') {
            this.refNumeroDocumento.current.focus()
            return
        }

        try {
            await this.setStateAsync({ loadCliente: true });
            const cliente = await axios.get("/api/cliente/consultadocumento", {
                signal: this.abortControllerView.signal,
                params: {
                    "documento": this.refNumeroDocumento.current.value.trim()
                }
            });

            if (cliente.data === false) {
                await this.setStateAsync({
                    idCliente: '',
                    nombreDoc: '',
                    numeroDoc: '',
                    infoCliente: '',
                    direccion: '',

                    messageWarning: 'Consulte un cliente.',
                    loadCliente: false
                });
            } else {
                const data = cliente.data
                await this.setStateAsync({
                    idCliente: data.idCliente,
                    nombreDoc: data.nombreDoc,
                    numeroDoc: data.numeroDoc,
                    infoCliente: data.informacion,
                    direccion: data.direccion,

                    messageWarning: '',
                    loadCliente: false
                });
            }

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgCliente: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    addObjectTable = async (producto) => {
        if (!this.validarDuplicado(producto.idProducto)) {
            let detalle = {
                "idProducto": producto.idProducto,
                "nombre": producto.nombre,
                "codigo": producto.codigo,
                "cantidad": 1,
                "idImpuesto": producto.idImpuesto,
                "impuestos": this.state.impuestos,
                "precio": parseFloat(producto.precio),
                "importe": parseFloat(producto.precio) * 1
            }
            this.state.detalleVenta.push(detalle)
        } else {
            for (let item of this.state.detalleVenta) {
                if (item.idProducto === producto.idProducto) {
                    let currenteObject = item;
                    currenteObject.cantidad = parseFloat(currenteObject.cantidad) + 1;
                    currenteObject.importe = parseFloat(currenteObject.precio) * parseFloat(currenteObject.cantidad)
                    break;
                }
            }
        }

        let newArr = [...this.state.detalleVenta];

        await this.setStateAsync({ detalleVenta: newArr, messageWarning: '' });

        const { total } = this.calcularTotales();

        await this.setStateAsync({ importeTotal: total })
    }

    validarDuplicado(id) {
        let value = false
        for (let item of this.state.detalleVenta) {
            if (item.idProducto === id) {
                value = true
                break;
            }
        }
        return value
    }

    async removeItemTable(id) {
        let newArr = [...this.state.detalleVenta];

        for (let i = 0; i < newArr.length; i++) {
            if (id === newArr[i].idProducto) {
                newArr.splice(i, 1)
                i--;
                break;
            }
        }

        await this.setStateAsync({ detalleVenta: newArr })

        const { total } = this.calcularTotales();

        await this.setStateAsync({ importeTotal: total })
    }

    handleSelectCantidad = async (event, idProducto) => {

        let updatedList = [...this.state.detalleVenta];
        for (let item of updatedList) {
            if (item.idProducto === idProducto) {
                item.cantidad = event.target.value;
                if (isNumeric(item.cantidad.toString())) {
                    item.importe = parseFloat(item.precio) * parseFloat(item.cantidad)
                }

                break;
            }
        }
        await this.setStateAsync({ detalleVenta: updatedList, messageWarning: '' })

        const { total } = this.calcularTotales();

        await this.setStateAsync({ importeTotal: total })
    }

    handleSelectImpuesto = async (event, idProducto) => {
        let updatedList = [...this.state.detalleVenta];
        for (let item of updatedList) {
            if (item.idProducto === idProducto) {
                item.idImpuesto = event.target.value;
                break;
            }
        }

        await this.setStateAsync({ detalleVenta: updatedList })

        const { total } = this.calcularTotales();

        await this.setStateAsync({ importeTotal: total })
    }

    handleSelectPrecio = async (event, idProducto) => {

        let updatedList = [...this.state.detalleVenta];
        for (let item of updatedList) {
            if (item.idProducto === idProducto) {
                item.precio = event.target.value;
                if (isNumeric(item.precio.toString())) {
                    item.importe = parseFloat(item.precio) * parseFloat(item.cantidad)
                }

                break;
            }
        }
        await this.setStateAsync({ detalleVenta: updatedList, messageWarning: '' })

        const { total } = this.calcularTotales();

        await this.setStateAsync({ importeTotal: total })
    }

    calcularTotales() {
        let subTotal = 0;
        let impuestoTotal = 0;
        let total = 0;

        for (let item of this.state.detalleVenta) {
            let cantidad = item.cantidad;

            let valor = parseFloat(item.precio);

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
                    <td className="text-right h4"> <strong className="text-primary">{numberFormat(total, codigo)}</strong> </td>
                </tr>
            </>
        )
    }

    openCobroModal = async () => {

        if (this.state.idAlmacen === "") {
            this.setState({ messageWarning: "Seleccione el almacen." });
            this.refAlmacen.current.focus();
            return;
        }
        if (this.state.idComprobante === "") {
            this.setState({ messageWarning: "Seleccione el comprobante." });
            this.refComprobante.current.focus();
            return;
        }
        if (this.state.idCliente === "") {
            this.setState({ messageWarning: "Consulte un cliente." });
            this.refNumeroDocumento.current.focus();
            return;
        }
        if (this.state.idMoneda === "") {
            this.setState({ messageWarning: "Seleccione la moneda." });
            this.refMoneda.current.focus();
            return;
        }
        if (this.state.detalleVenta.length === 0) {
            this.setState({ messageWarning: "Agregar datos a la tabla." });
            this.refBtnProductos.current.focus();
            return;
        } else {

            let cantidad = this.state.detalleVenta.reduce((acumulador, item) =>
                item.cantidad === "" || !isNumeric(item.cantidad.toString()) ? acumulador + 1 : acumulador + 0
                , 0);
            if (cantidad > 0) {
                let count = 0;
                for (let item of this.state.detalleVenta) {
                    count++;
                    if (item.cantidad === "" || !isNumeric(item.cantidad.toString())) {
                        document.getElementById(count + "cantv").focus()
                        return;
                    }
                }
                // return;
            }

            let count = 0;
            for (let item of this.state.detalleVenta) {
                count++;
                if (item.idImpuesto === "") {
                    document.getElementById(count + "imv").focus()
                    return;
                }
            }

            let precio = this.state.detalleVenta.reduce((acumulador, item) =>
                item.precio === "" || !isNumeric(item.precio.toString()) ? acumulador + 1 : acumulador + 0
                , 0);
            if (precio > 0) {
                let count = 0;
                for (let item of this.state.detalleVenta) {
                    count++;
                    if (item.precio === "" || !isNumeric(item.precio.toString())) {
                        document.getElementById(count + "precv").focus()
                        return;
                    }
                }
            }

            await this.setStateAsync({
                isViewModalCobro: true
            })
            showModal(this.state.idModalCobro)
        }

    }

    closeCobroModal = async () => {
        hideModal(this.state.idModalCobro)
        await this.setStateAsync({
            isViewModalCobro: false
        })
    }

    async onEventLimpiar() {
        await this.setStateAsync({
            detalleVenta: [],
            importeTotal: 0,

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',

            loadCliente: true,
            msgCliente: 'Cargando información...',
        });
        this.loadData();
    }

    render() {

        return (
            <>
                {
                    this.state.isViewModalProductos ?
                        <ModalProductos idModal={this.state.idModalProductos} idAlmacen={this.state.idAlmacen} titleModal={`Lista de Productos - ${this.state.nombreAlmacen}`} sizeModal={'modal-lg'} closeProductosModal={this.closeProductosModal} addObjectTable={this.addObjectTable} />
                        : null
                }

                {
                    this.state.isViewModalCobro ?
                        <VentaCobro idModal={this.state.idModalCobro} importeTotal={this.state.importeTotal} titleModal={`Completar Venta`} sizeModal={'modal-md'} closeCobroModal={this.closeCobroModal} />
                        : null
                }

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
                                        <div className="form-group col-md-6 col-sm-12">
                                            <div className="input-group input-group-sm">
                                                <div className="input-group-prepend">
                                                    <div className="input-group-text"><i className="bi bi-house-door-fill"></i></div>
                                                </div>
                                                <select
                                                    title="Lista de almacenes de venta(s)"
                                                    className="form-control"
                                                    ref={this.refAlmacen}
                                                    value={this.state.idAlmacen}
                                                    onChange={(event) => {

                                                        if (event.target.value.trim().length > 0) {
                                                            this.setState({
                                                                idAlmacen: event.target.value,
                                                                detalleVenta: [],
                                                                messageWarning: '',
                                                            });
                                                        } else {
                                                            this.setState({
                                                                idAlmacen: event.target.value,
                                                                detalleVenta: [],
                                                                messageWarning: 'Seleccione el almacen.',
                                                            });
                                                        }
                                                    }}>
                                                    <option value="">-- Almacenes --</option>
                                                    {
                                                        this.state.almacenes.map((item, index) => {
                                                            let tipo = item.tipo === 1 ? 'PRODUCTOS TERMINADOS'
                                                                : item.tipo === 2 ? 'MATERIAS PRIMAS'
                                                                    : item.tipo === 3 ? 'REPUESTOS Y/O ACCESORIOS' : ''
                                                            return <option key={index} value={item.idAlmacen}>{item.nombre + ' - ' + tipo}</option>
                                                        })
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group col-md-6 col-sm-12">
                                            <div className="input-group input-group-sm">
                                                <div className="input-group-prepend">
                                                    <div className="input-group-text"><i className="bi bi-upc-scan"></i></div>
                                                </div>
                                                <input
                                                    title="codigo"
                                                    type="text"
                                                    className="form-control"
                                                    placeholder='buscar por codigo...'
                                                />
                                                <button className="btn btn-outline-warning btn-sm ml-1" type="button" ref={this.refBtnProductos} title="Lista de productos" onClick={() => this.openProductosModal()}><i className="bi bi-boxes"></i></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="table-responsive">
                                            <table className="table table-striped table-bordered rounded">
                                                <thead>
                                                    <tr>
                                                        <th width="5%" className="p-1">#</th>
                                                        <th width="45%" className="p-1">Descripción</th>
                                                        <th width="10%" className="p-1">Cantidad </th>
                                                        <th width="20%" className="p-1">Impuesto</th>
                                                        <th width="10%" className="p-1">Precio </th>
                                                        <th width="10%" className="p-1">Importe </th>
                                                        <th width="auto" className="text-center p-1">Quitar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.detalleVenta.length === 0 ? (
                                                            <tr className="text-center">
                                                                <td className="p-1" colSpan="7"> Agregar datos a la tabla </td>
                                                            </tr>
                                                        ) : (
                                                            this.state.detalleVenta.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td className="p-1">{++index}</td>
                                                                    <td className="p-1">{item.codigo} <br /> {item.nombre}</td>
                                                                    <td className="p-1">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm"
                                                                            id={index + "cantv"}
                                                                            value={item.cantidad}
                                                                            onChange={(event) => this.handleSelectCantidad(event, item.idProducto)}
                                                                            onKeyPress={keyNumberFloat}
                                                                        />
                                                                    </td>
                                                                    <td className="p-1">
                                                                        <select className="form-control form-control-sm"
                                                                            id={index + "imv"}
                                                                            value={item.idImpuesto}
                                                                            onChange={(event) => this.handleSelectImpuesto(event, item.idProducto)}>
                                                                            <option value="">- Seleccione -</option>
                                                                            {
                                                                                item.impuestos.map((imp, indexImp) => (
                                                                                    <option key={indexImp} value={imp.idImpuesto}>{imp.nombre}</option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                    </td>
                                                                    <td className="p-1">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm"
                                                                            id={index + "precv"}
                                                                            value={item.precio}
                                                                            onChange={(event) => this.handleSelectPrecio(event, item.idProducto)}
                                                                            onKeyPress={keyNumberFloat}
                                                                        />
                                                                    </td>
                                                                    <td className="p-1">{formatMoney(item.importe)}</td>
                                                                    <td className="p-1">
                                                                        <button className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => this.removeItemTable(item.idProducto)}><i className="bi bi-trash"></i></button>
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
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-receipt"></i></div>
                                            </div>
                                            <select
                                                title="Comprobantes de venta"
                                                className="form-control"
                                                ref={this.refComprobante}
                                                value={this.state.idComprobante}
                                                onChange={(event) => {
                                                    if (event.target.value.length > 0) {
                                                        this.setState({
                                                            idComprobante: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            idComprobante: event.target.value,
                                                            messageWarning: "Seleccione el comprobante.",
                                                        });
                                                    }
                                                }}>
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
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-person-fill"></i></div>
                                            </div>
                                            <input
                                                title="Consulta de cliente"
                                                type="text"
                                                className="form-control"
                                                placeholder='Consulta por DNI o RUC'
                                                maxLength={25}
                                                ref={this.refNumeroDocumento}
                                                onKeyPress={keyNumberFloat} />
                                            <div className="input-group-append">
                                                <button className="btn btn-outline-info btn-sm" type="button" title="Consulta interna" onClick={() => this.consultaDocumento()}><i className="bi bi-stack"></i></button>
                                            </div>
                                            <div className="input-group-append">
                                                <button className="btn btn-outline-primary btn-sm" type="button" title="Consulta Reniec o Sunat"><i className="fa fa-database"></i></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="table-responsive">
                                            <table width="100%">
                                                <thead>
                                                    {
                                                        this.state.loadCliente ? (
                                                            <tr>
                                                                <th className="text-center p-1" colSpan="2">
                                                                    {spinnerLoading(this.state.msgCliente)}
                                                                </th>
                                                            </tr>
                                                        ) : (
                                                            <>
                                                                <tr>
                                                                    <th className="table-secondary w-25 p-1 font-weight-normal ">Documento</th>
                                                                    <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal"><small className="font-weight-bold">{this.state.nombreDoc + ' - ' + this.state.numeroDoc}</small></th>
                                                                </tr>
                                                                <tr>
                                                                    <th className="table-secondary w-25 p-1 font-weight-normal ">Información</th>
                                                                    <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal"><small className="font-weight-bold">{this.state.infoCliente}</small></th>
                                                                </tr>
                                                                <tr>
                                                                    <th className="table-secondary w-25 p-1 font-weight-normal ">Dirección</th>
                                                                    <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal"><small className="font-weight-bold">{this.state.direccion}</small></th>
                                                                </tr>
                                                            </>
                                                        )
                                                    }


                                                </thead>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-cash"></i></div>
                                            </div>
                                            <select
                                                title="Lista de monedas"
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
                                                            messageWarning: "Seleccione la moneda.",
                                                        });
                                                    }
                                                }}>
                                                <option value="">-- Monedas --</option>
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
                                            <button type="button" className="btn btn-success" onClick={() => this.openCobroModal()}>
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

export default VentaProceso;
