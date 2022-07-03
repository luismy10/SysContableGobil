import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import {
    spinnerLoading,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    keyNumberFloat,
    showModal,
    hideModal,
    isNumeric
} from '../../tools/Tools';
import SearchBarMedida from "../../tools/SearchBarMedida";
import ModalMedida from './ModalMedida';
import ListaPrecios from './ListaPrecios'

class ProductoProceso extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            idProducto: '',
            destino: 1,
            tipo: '1',
            codigo: '',
            nombre: '',

            idMedida: '',
            nombreMedida: '',
            filter: false,
            filteredData: [],

            idAlmacen: '',
            almacenes: [],
            costo: '',

            idAlmacenSuminitro: '',
            almacenesSuministro: [],
            costoSuministro: '',

            idImpuesto: '',
            impuestos: [],
            precio: '',
            idCategoria: '',
            idMarca: '',
            estado: true,
            descripcion: '',

            precioCheck: false,
            listaPrecios: [],

            loading: false,
            messageWarning: '',
            msgLoading: 'Cargando datos...',

            //Modals 
            idModalMedida: 'Medida',
            isViewModalMedida: false
        }

        this.refNombre = React.createRef()
        this.refMedida = React.createRef()
        this.refAlmacen = React.createRef()
        this.refCosto = React.createRef()
        this.refImpuesto = React.createRef()
        this.refPrecio = React.createRef()

        this.refAlmacenSuministro = React.createRef()
        this.refCostoSuministro = React.createRef()

        this.refBtnPrices = React.createRef()

        this.abortControllerView = new AbortController();

        this.selectItem = false;

    }

    updateListPrice = async (params) => {
        await this.setStateAsync({ listaPrecios: params })
    }

    updateMsgWarning = async (msg) => {
        await this.setStateAsync({ messageWarning: msg })
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        await this.setStateAsync({
            loading: true
        })
        const url = this.props.location.search;
        const idProducto = new URLSearchParams(url).get("idProducto");
        if (idProducto !== null) {
            this.loadDataId(idProducto)
        } else {
            this.loadData();
        }
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    loadData = async () => {
        try {
            const almacenVenta = await axios.get("/api/almacen/listcomboventa", {
                signal: this.abortControllerView.signal,
            });
            const almacenProdConsumo = await axios.get("/api/almacen/listcomboprodconsumo", {
                signal: this.abortControllerView.signal,
            });
            const impuesto = await axios.get("/api/impuesto/listcombo", {
                signal: this.abortControllerView.signal,
            });

            await this.setStateAsync({
                almacenes: almacenVenta.data,
                almacenesSuministro: almacenProdConsumo.data,
                impuestos: impuesto.data,
                loading: false
            })
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    loadDataId = async (id) => {
        try {
            const producto = await axios.get("/api/producto/id", {
                signal: this.abortControllerView.signal,
                params: {
                    "idProducto": id
                }
            });

            const data = producto.data.product;

            const allPrices = producto.data.prices;

            const almacenVenta = await axios.get("/api/almacen/listcomboventa", {
                signal: this.abortControllerView.signal,
            });
            const almacenProdConsumo = await axios.get("/api/almacen/listcomboprodconsumo", {
                signal: this.abortControllerView.signal,
            });
            const impuesto = await axios.get("/api/impuesto/listcombo", {
                signal: this.abortControllerView.signal,
            });

            await this.setStateAsync({
                almacenes: almacenVenta.data,
                almacenesSuministro: almacenProdConsumo.data,
                impuestos: impuesto.data,

                idProducto: data.idProducto,

                idAlmacen: data.destino === 1 ? data.idAlmacen : '',
                idAlmacenSuminitro: data.destino === 2 ? data.idAlmacen : '',

                idImpuesto: data.idImpuesto,
                idMedida: data.idMedida,
                nombreMedida: data.medida,

                destino: data.destino,
                tipo: (data.tipo).toString(),
                codigo: data.codigo,
                nombre: data.nombre,

                costo: data.destino === 1 ? data.costo : '',
                costoSuministro: data.destino === 2 ? data.costo : '',

                estado: data.estado,
                idCategoria: data.categoria,
                idMarca: data.marca,
                descripcion: data.descripcion,

                precio: data.precio,
                precioCheck: parseInt(allPrices) > 1 ? true : false,

                loading: false
            })

            this.selectItem = true;

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    handleFilter = async (event) => {
        const searchWord = this.selectItem ? "" : event.target.value;
        await this.setStateAsync({ idMedida: '', nombreMedida: searchWord });
        this.selectItem = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ filteredData: [] });
            return;
        }

        if (this.state.filter) return;

        try {
            await this.setStateAsync({ filter: true });
            let result = await axios.get("/api/producto/listfiltermedida", {
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
        await this.setStateAsync({
            nombreMedida: value.nombre,
            filteredData: [],
            idMedida: value.idMedida
        });
        this.selectItem = true;
    }

    onEventClearInput = async () => {
        await this.setStateAsync({ filteredData: [], idMedida: '', nombreMedida: "" });
        this.selectItem = false;
    }

    onEventGuardar() {
        if (this.state.destino === 1) {
            this.prodVenta()
        } else {
            this.prodProduccionConsumo()
        }
        // this.state.destino === 1 ? this.prodVenta() : this.prodProduccionConsumo()
    }

    async prodVenta() {
        if (this.state.nombre === '') {
            this.setState({ messageWarning: 'Ingrese el nombre del producto.' })
            this.refNombre.current.focus()
        } else if (this.state.idMedida === '') {
            this.setState({ messageWarning: 'Elija la unidad de medida.' })
            this.refMedida.current.focus()
        } else if (this.state.idAlmacen === '' && this.state.tipo === '1') {
            this.setState({ messageWarning: 'Seleccione el almacen.' })
            this.refAlmacen.current.focus()
        } else if (this.state.costo === '' && this.state.tipo === '1') {
            this.setState({ messageWarning: 'Ingrese el costo del producto.' })
            this.refCosto.current.focus()
        } else if (this.state.idImpuesto === '') {
            this.setState({ messageWarning: 'Seleccione el impuesto.' })
            this.refImpuesto.current.focus()
        } else if (this.state.precio === '') {
            this.setState({ messageWarning: 'Ingrese el precio del producto.' })
            this.refPrecio.current.focus()
        } else if (!isNumeric(this.state.precio.toString())) {
            this.setState({ messageWarning: 'Ingrese un precio númerico' })
            this.refPrecio.current.focus()
        } else {

            if (this.state.precioCheck) {
                if (this.state.listaPrecios.length === 0) {
                    await this.setStateAsync({
                        messageWarning: 'Agregar datos a la lista de precios'
                    });
                    this.refBtnPrices.current.focus();
                    return;
                } else {

                    let nombrePrecio = this.state.listaPrecios.reduce((acumulador, item) =>
                        item.nombrePrecio === "" ? acumulador + 1 : acumulador + 0
                        , 0)
                    if (nombrePrecio > 0) {
                        // await this.setStateAsync({ msgWarning: "Hay detalle(s) en la tabla con nombre vacio." });
                        let count = 0;
                        for (let item of this.state.listaPrecios) {
                            count++;
                            if (item.nombrePrecio === "") {
                                document.getElementById(count + "imc").focus()
                            }
                        }
                        return;
                    }

                    let valor = this.state.listaPrecios.reduce((acumulador, item) =>
                        item.valor === "" || !isNumeric(item.valor.toString()) ? acumulador + 1 : acumulador + 0
                        , 0);
                    if (valor > 0) {
                        let count = 0;
                        for (let item of this.state.listaPrecios) {
                            count++;
                            if (item.valor === "" || !isNumeric(item.valor.toString())) {
                                document.getElementById(count + "imd").focus()
                            }
                        }
                        return;
                    }

                    let factor = this.state.listaPrecios.reduce((acumulador, item) =>
                        item.factor === "" || !isNumeric(item.factor.toString()) ? acumulador + 1 : acumulador + 0
                        , 0);

                    if (factor > 0) {
                        let count = 0;
                        for (let item of this.state.listaPrecios) {
                            count++;
                            if (item.factor === "" || !isNumeric(item.factor.toString())) {
                                document.getElementById(count + "ime").focus()
                            }
                        }
                        return;
                    }
                }
            }

            try {
                ModalAlertInfo("Producto", "Procesando información...");

                let result = '';

                if (this.state.idProducto !== '') {
                    result = await axios.post("/api/producto/update", {
                        "destino": this.state.destino,
                        "tipo": parseInt(this.state.tipo),
                        "codigo": this.state.codigo.trim().toUpperCase(),
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "idMedida": this.state.idMedida,

                        "idAlmacen": this.state.tipo === '1' ? this.state.idAlmacen : '',
                        "costo": this.state.tipo === '1' ? parseFloat(this.state.costo) : 0,

                        "idImpuesto": this.state.idImpuesto,
                        "precio": parseFloat(this.state.precio),

                        "estado": this.state.estado,
                        "categoria": this.state.idCategoria,
                        "marca": this.state.idMarca,
                        "descripcion": this.state.descripcion.trim().toUpperCase(),

                        "precioCheck": this.state.precioCheck,
                        "listaPrecios": this.state.listaPrecios,

                        "idProducto": this.state.idProducto
                    });
                } else {
                    result = await axios.post("/api/producto/add", {
                        "destino": this.state.destino,
                        "tipo": parseInt(this.state.tipo),
                        "codigo": this.state.codigo.trim().toUpperCase(),
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "idMedida": this.state.idMedida,

                        "idAlmacen": this.state.tipo === '1' ? this.state.idAlmacen : '',
                        "costo": this.state.tipo === '1' ? parseFloat(this.state.costo) : 0,

                        "idImpuesto": this.state.idImpuesto,
                        "precio": parseFloat(this.state.precio),
                        "estado": this.state.estado,
                        "categoria": this.state.idCategoria,
                        "marca": this.state.idMarca,
                        "descripcion": this.state.descripcion.trim().toUpperCase(),

                        "precioCheck": this.state.precioCheck,
                        "listaPrecios": this.state.listaPrecios,

                    });
                }

                ModalAlertSuccess("Producto", result.data, () => {
                    this.props.history.goBack()
                });

            } catch (error) {
                if (error.response !== undefined) {
                    ModalAlertWarning("Producto", error.response.data)
                } else {
                    ModalAlertWarning("Producto", "Se genero un error interno, intente nuevamente.")
                }
            }
        }
    }

    async prodProduccionConsumo() {
        if (this.state.nombre === '') {
            this.setState({ messageWarning: 'Ingrese el nombre del producto.' })
            this.refNombre.current.focus()
        } else if (this.state.idMedida === '') {
            this.setState({ messageWarning: 'Elija la unidad de medida.' })
            this.refMedida.current.focus()
        } else if (this.state.idAlmacenSuminitro === '') {
            this.setState({ messageWarning: 'Seleccione el almacen.' })
            this.refAlmacenSuministro.current.focus()
        } else if (this.state.costoSuministro === '') {
            this.setState({ messageWarning: 'Ingrese el costo del producto.' })
            this.refCostoSuministro.current.focus()
        } else if (this.state.idImpuesto === '') {
            this.setState({ messageWarning: 'Seleccione el impuesto.' })
            this.refImpuesto.current.focus()
        } else {
            try {
                ModalAlertInfo("Producto", "Procesando información...");

                let result = null;

                if (this.state.idProducto !== "") {
                    result = await axios.post("/api/producto/update", {
                        "destino": this.state.destino,
                        "tipo": 0,
                        "codigo": this.state.codigo.trim().toUpperCase(),
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "idMedida": this.state.idMedida,

                        "idAlmacen": this.state.idAlmacenSuminitro,
                        "costo": parseFloat(this.state.costoSuministro),

                        "idImpuesto": this.state.idImpuesto,
                        "precio": 0,
                        "estado": this.state.estado,
                        "categoria": this.state.idCategoria,
                        "marca": this.state.idMarca,
                        "descripcion": this.state.descripcion.trim().toUpperCase(),

                        "idProducto": this.state.idProducto

                    });
                } else {
                    result = await axios.post("/api/producto/add", {
                        "destino": this.state.destino,
                        "tipo": 0,
                        "codigo": this.state.codigo.trim().toUpperCase(),
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "idMedida": this.state.idMedida,

                        "idAlmacen": this.state.idAlmacenSuminitro,
                        "costo": parseFloat(this.state.costoSuministro),

                        "idImpuesto": this.state.idImpuesto,
                        "precio": 0,
                        "estado": this.state.estado,
                        "categoria": this.state.idCategoria,
                        "marca": this.state.idMarca,
                        "descripcion": this.state.descripcion.trim().toUpperCase()
                    });
                }

                ModalAlertSuccess("Producto", result.data, () => {
                    this.props.history.goBack()
                });

            } catch (error) {
                if (error.response !== undefined) {
                    ModalAlertWarning("Producto", error.response.data)
                } else {
                    ModalAlertWarning("Producto", "Se genero un error interno, intente nuevamente.")
                }
            }
        }
    }

    openMedidaModal = async () => {
        await this.setStateAsync({
            isViewModalMedida: true
        })
        showModal(this.state.idModalMedida)
    }

    closeMedidaModal = async (e) => {
        hideModal(this.state.idModalMedida)
        await this.setStateAsync({
            isViewModalMedida: false
        })
    }

    render() {
        return (
            <>
                {
                    this.state.isViewModalMedida ?
                        <ModalMedida idModal={this.state.idModalMedida} titleModal={'Unidades de medida'} sizeModal={'modal-md'} closeMedidaModal={this.closeMedidaModal} />
                        : null
                }

                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        <>
                            <div className='row'>
                                <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                    <section className="content-header">
                                        <h5>
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> {this.state.idProducto === '' ? 'Nuevo ' : 'Editar '} producto
                                        </h5>
                                    </section>
                                </div>
                            </div>

                            <hr className="mt-0 mb-2" />

                            <div className="mb-3">
                                <span className="text-info">Recuerda que al mover el producto a otro almacen, este se movera con sus cantidades.</span>
                            </div>

                            {
                                this.state.messageWarning === '' ? null :
                                    <div className="alert alert-warning" role="alert">
                                        <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                    </div>
                            }

                            <div className="row">
                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <label>Destino</label>
                                </div>
                                <div className="col-md-4 col-sm-4">
                                    <button className={`btn ${this.state.destino === 1 ? "btn-primary" : "btn-light"} btn-block`}
                                        type="button"
                                        onClick={() => this.setState({ destino: 1 })}>
                                        <div className="text-center">
                                            <i className="bi bi-tags-fill"></i> Venta
                                        </div>
                                    </button>
                                </div>

                                <div className="col-md-4 col-sm-4">
                                    <button className={`btn ${this.state.destino === 2 ? "btn-primary" : "btn-light"} btn-block`}
                                        type="button"
                                        onClick={() => this.setState({ destino: 2 })}>
                                        <div className="text-center">
                                            <i className="bi bi-boxes"></i> Producción/Consumo
                                        </div>
                                    </button>
                                </div>

                            </div>

                            <br />

                            {
                                this.state.destino === 1 ?
                                    <div className="row">
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">

                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label>Tipo</label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            value={this.state.tipo}
                                                            onChange={async (event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    await this.setStateAsync({
                                                                        tipo: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                    //producto
                                                                    if (this.state.tipo === '1') {
                                                                        await this.setStateAsync({
                                                                            idMedida: '',
                                                                            nombreMedida: ''
                                                                        });
                                                                    }
                                                                    //servicio
                                                                    if (this.state.tipo === '2') {
                                                                        await this.setStateAsync({
                                                                            idMedida: '',
                                                                            nombreMedida: '',
                                                                            idAlmacen: '',
                                                                            costo: ''
                                                                        });
                                                                    }
                                                                }
                                                            }} >
                                                            <option value="1">PRODUCTOS</option>
                                                            <option value="2">SERVICIO</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label>Codigo </label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el codigo del producto"
                                                            maxLength={250}
                                                            value={this.state.codigo}
                                                            onChange={(event) => {
                                                                this.setState({
                                                                    codigo: event.target.value,
                                                                });
                                                            }} />
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="form-row">

                                                <div className="form-group col-md-6">
                                                    <label>Nombre <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el nombre del producto"
                                                            maxLength={250}
                                                            ref={this.refNombre}
                                                            value={this.state.nombre}
                                                            onChange={(event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    this.setState({
                                                                        nombre: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    this.setState({
                                                                        nombre: event.target.value,
                                                                        messageWarning: 'Ingrese el nombre del producto.',
                                                                    });
                                                                }
                                                            }} />
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label>Unidad de medida <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <SearchBarMedida
                                                        placeholder="Escribe el nombre para filtrar..."
                                                        refMedida={this.refMedida}
                                                        nombreMedida={this.state.nombreMedida}
                                                        filteredData={this.state.filteredData}
                                                        onEventClearInput={this.onEventClearInput}
                                                        handleFilter={this.handleFilter}
                                                        onEventSelectItem={this.onEventSelectItem}
                                                        onEventAddItem={this.openMedidaModal}
                                                    />
                                                </div>

                                            </div>

                                            <div className="form-row">

                                                <div className="form-group col-md-6">
                                                    <label>Almacen <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            disabled={this.state.tipo === '1' ? false : true}
                                                            ref={this.refAlmacen}
                                                            value={this.state.idAlmacen}
                                                            onChange={async (event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    await this.setStateAsync({
                                                                        idAlmacen: event.target.value,
                                                                        messageWarning: '',
                                                                    });

                                                                } else {
                                                                    await this.setStateAsync({
                                                                        idAlmacen: event.target.value,
                                                                        messageWarning: 'Seleccione el almacen.',
                                                                    });
                                                                }
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
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

                                                <div className="form-group col-md-6">
                                                    <label>Costo <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el costo del producto"
                                                            disabled={this.state.tipo === '1' ? false : true}
                                                            ref={this.refCosto}
                                                            value={this.state.costo}
                                                            onChange={(event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    this.setState({
                                                                        costo: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    this.setState({
                                                                        costo: event.target.value,
                                                                        messageWarning: 'Ingrese el costo del producto.',
                                                                    });
                                                                }
                                                            }}
                                                            onKeyPress={keyNumberFloat} />
                                                    </div>
                                                </div>

                                            </div>


                                            <div className="form-row">

                                                <div className="form-group col-md-6">
                                                    <label>Impuesto <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            ref={this.refImpuesto}
                                                            value={this.state.idImpuesto}
                                                            onChange={async (event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    await this.setStateAsync({
                                                                        idImpuesto: event.target.value,
                                                                        messageWarning: '',
                                                                    });

                                                                } else {
                                                                    await this.setStateAsync({
                                                                        idImpuesto: event.target.value,
                                                                        messageWarning: 'Seleccione el impuesto.',
                                                                    });
                                                                }
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
                                                            {
                                                                this.state.impuestos.map((item, index) => {
                                                                    return <option key={index} value={item.idImpuesto}>{item.nombre}</option>
                                                                })
                                                            }
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label>Precio general <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el precio del producto"
                                                            ref={this.refPrecio}
                                                            value={this.state.precio}
                                                            onChange={(event) => {
                                                                if (event.target.value !== '' && isNumeric(event.target.value.toString())) {
                                                                    this.setState({
                                                                        precio: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    this.setState({
                                                                        precio: event.target.value,
                                                                        precioCheck: false,
                                                                        messageWarning: 'Ingrese un precio númerico',
                                                                    });
                                                                }
                                                            }}
                                                            onKeyPress={keyNumberFloat} />
                                                        <div className="input-group-append" title="Lista de precios">
                                                            <div className="input-group-text">
                                                                <div className="form-check form-check-inline m-0">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={this.state.precioCheck}
                                                                        onChange={async (event) => {
                                                                            if (this.state.precio !== '' && isNumeric(this.state.precio.toString())) {
                                                                                await this.setStateAsync({
                                                                                    precioCheck: event.target.checked,
                                                                                    messageWarning: ''
                                                                                })
                                                                            } else {
                                                                                await this.setStateAsync({
                                                                                    precioCheck: false,
                                                                                    messageWarning: 'Ingrese un precio númerico'
                                                                                })
                                                                                this.refPrecio.current.focus()
                                                                            }

                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {
                                                this.state.precioCheck && (this.state.precio !== '' && isNumeric(this.state.precio.toString())) ?
                                                    <ListaPrecios
                                                        updateListPrice={this.updateListPrice}
                                                        updateMsgWarning={this.updateMsgWarning}
                                                        idProducto={this.state.idProducto}
                                                        refBtnPrices={this.refBtnPrices} /> : null
                                            }

                                            <div className="form-row">

                                                <div className="form-group col-md-4">
                                                    <label>Estado</label>
                                                    <div className="custom-control custom-switch">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-control-input"
                                                            id="switch1"
                                                            checked={this.state.estado}
                                                            onChange={(value) => this.setState({ estado: value.target.checked })} />
                                                        <label className="custom-control-label" htmlFor="switch1">{this.state.estado === 1 || this.state.estado === true ? "Activo" : "Inactivo"}</label>
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-4">
                                                    <label>Categoria</label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            value={this.state.idCategoria}
                                                            onChange={async (event) => {
                                                                this.setState({
                                                                    idCategoria: event.target.value,
                                                                });
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
                                                            <option value="1">Categoria 1</option>
                                                            <option value="2">Categoria 2</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-4">
                                                    <label>Marca</label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            value={this.state.idMarca}
                                                            onChange={async (event) => {
                                                                this.setState({
                                                                    idMarca: event.target.value,
                                                                });
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
                                                            <option value="1">Marca 1</option>
                                                            <option value="2">Marca 2</option>
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-12 col-sm-12">
                                                    <label>Descripción</label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese una descripción de producto"
                                                            value={this.state.descripcion}
                                                            onChange={(event) => {
                                                                this.setState({
                                                                    descripcion: event.target.value,
                                                                });
                                                            }} />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                    :
                                    null
                            }

                            {
                                this.state.destino === 2 ?
                                    <div className="row">
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">

                                            <div className="form-row">
                                                <div className="form-group col-md-4">
                                                    <label>Codigo </label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el codigo del producto"
                                                            maxLength={250}
                                                            value={this.state.codigo}
                                                            onChange={(event) => {
                                                                this.setState({
                                                                    codigo: event.target.value,
                                                                });
                                                            }} />
                                                    </div>
                                                </div>
                                                <div className="form-group col-md-4">
                                                    <label>Nombre <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el nombre del producto"
                                                            maxLength={250}
                                                            ref={this.refNombre}
                                                            value={this.state.nombre}
                                                            onChange={(event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    this.setState({
                                                                        nombre: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    this.setState({
                                                                        nombre: event.target.value,
                                                                        messageWarning: 'Ingrese el nombre del producto.',
                                                                    });
                                                                }
                                                            }} />
                                                    </div>
                                                </div>
                                                <div className="form-group col-md-4">
                                                    <label>Unidad de medida <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <SearchBarMedida
                                                        placeholder="Escribe el nombre para filtrar..."
                                                        refMedida={this.refMedida}
                                                        nombreMedida={this.state.nombreMedida}
                                                        filteredData={this.state.filteredData}
                                                        onEventClearInput={this.onEventClearInput}
                                                        handleFilter={this.handleFilter}
                                                        onEventSelectItem={this.onEventSelectItem}
                                                        onEventAddItem={this.openMedidaModal}
                                                    />
                                                </div>

                                            </div>

                                            <div className="form-row">

                                                <div className="form-group col-md-4">
                                                    <label>Almacen <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            ref={this.refAlmacenSuministro}
                                                            value={this.state.idAlmacenSuminitro}
                                                            onChange={async (event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    await this.setStateAsync({
                                                                        idAlmacenSuminitro: event.target.value,
                                                                        messageWarning: '',
                                                                    });

                                                                } else {
                                                                    await this.setStateAsync({
                                                                        idAlmacenSuminitro: event.target.value,
                                                                        messageWarning: 'Seleccione el almacen.',
                                                                    });
                                                                }
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
                                                            {
                                                                this.state.almacenesSuministro.map((item, index) => {
                                                                    let tipo = item.tipo === 1 ? 'PRODUCTOS TERMINADOS'
                                                                        : item.tipo === 2 ? 'MATERIAS PRIMAS'
                                                                            : item.tipo === 3 ? ' REPUESTOS Y/O ACCESORIOS' : ''
                                                                    return <option key={index} value={item.idAlmacen}>{item.nombre + ' - ' + tipo}</option>
                                                                })
                                                            }
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-4">
                                                    <label>Costo <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el costo del producto"
                                                            ref={this.refCostoSuministro}
                                                            value={this.state.costoSuministro}
                                                            onChange={(event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    this.setState({
                                                                        costoSuministro: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    this.setState({
                                                                        costoSuministro: event.target.value,
                                                                        messageWarning: 'Ingrese el costo del producto.',
                                                                    });
                                                                }
                                                            }}
                                                            onKeyPress={keyNumberFloat} />
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-4">
                                                    <label>Impuesto <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            ref={this.refImpuesto}
                                                            value={this.state.idImpuesto}
                                                            onChange={async (event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    await this.setStateAsync({
                                                                        idImpuesto: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    await this.setStateAsync({
                                                                        idImpuesto: event.target.value,
                                                                        messageWarning: 'Seleccione el impuesto.',
                                                                    });
                                                                }
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
                                                            {
                                                                this.state.impuestos.map((item, index) => {
                                                                    return <option key={index} value={item.idImpuesto}>{item.nombre}</option>
                                                                })
                                                            }
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="form-row">

                                                <div className="form-group col-md-4">
                                                    <label>Estado</label>
                                                    <div className="custom-control custom-switch">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-control-input"
                                                            id="switch1"
                                                            checked={this.state.estado}
                                                            onChange={(value) => this.setState({ estado: value.target.checked })} />
                                                        <label className="custom-control-label" htmlFor="switch1">{this.state.estado === 1 || this.state.estado === true ? "Activo" : "Inactivo"}</label>
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-4">
                                                    <label>Categoria</label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            value={this.state.idCategoria}
                                                            onChange={async (event) => {
                                                                this.setState({
                                                                    idCategoria: event.target.value,
                                                                });
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
                                                            <option value="1">Categoria 1</option>
                                                            <option value="2">Categoria 2</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group col-md-4">
                                                    <label>Marca</label>
                                                    <div className="input-group input-group-sm">
                                                        <select
                                                            className="form-control"
                                                            value={this.state.idMarca}
                                                            onChange={async (event) => {
                                                                this.setState({
                                                                    idMarca: event.target.value,
                                                                });
                                                            }} >
                                                            <option value="">-- Seleccione --</option>
                                                            <option value="1">Marca 1</option>
                                                            <option value="2">Marca 2</option>
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-12 col-sm-12">
                                                    <label>Descripción</label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese una descripción de producto"
                                                            value={this.state.descripcion}
                                                            onChange={(event) => {
                                                                this.setState({
                                                                    descripcion: event.target.value,
                                                                });
                                                            }} />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                    :
                                    null
                            }

                            <div className="row">
                                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                    <button type="button" className="btn btn-primary mr-2" onClick={() => this.onEventGuardar()}>Guardar</button>
                                    <button type="button" className="btn btn-danger" onClick={() => this.props.history.goBack()}>Cancelar</button>
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

export default connect(mapStateToProps)(ProductoProceso);