import React from 'react';
import axios from 'axios';
import {
    currentDate,
    keyNumberPhone,
    keyNumberInteger,
    spinnerLoading,
    convertNullText,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    keyNumberFloat,
    showModal,
    hideModal,
    viewModal,
    clearModal
} from '../../tools/Tools';
import SearchBarMedida from "../../tools/SearchBarMedida";

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

            loading: false,
            messageWarning: '',
            msgLoading: 'Cargando datos...',

            // Modal medida
            detalleMedidas: [],
            idTempMedida: '',
            newNameMedida: '',
            codigoMedida: '',
            loadModalTable: false,
            msgModalTable: 'Cargando datos...',
            msgWarningModal: '',
        }

        this.refNombre = React.createRef()
        this.refMedida = React.createRef()
        this.refAlmacen = React.createRef()
        this.refCosto = React.createRef()
        this.refImpuesto = React.createRef()
        this.refPrecio = React.createRef()

        this.refAlmacenSuministro = React.createRef()
        this.refCostoSuministro = React.createRef()

        this.refNewNameMedida = React.createRef()
        this.refSearchMedida = React.createRef()

        this.abortControllerView = new AbortController();

        this.selectItem = false;
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

        viewModal("modalMedida", () => {
            this.abortControllerModal = new AbortController();
            this.initLoadModal(0, '');
        });

        clearModal("modalMedida", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                detalleMedidas: [],
                idTempMedida: '',
                newNameMedida: '',
                codigoMedida: '',
                loadModalTable: false,
                msgModalTable: 'Cargando datos...',
                msgWarningModal: '',
            });

            this.refSearchMedida.current.value = '';

        });
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

            const data = producto.data;

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
            // nombreMedida: value.nombre +' '+ value.codigo,
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

    onEventAddItem() {
        showModal('modalMedida')
    }

    initLoadModal = async (opcion, buscar) => {
        try {

            await this.setStateAsync({ loadModalTable: true })

            const medida = await axios.get("/api/producto/listmedida", {
                signal: this.abortControllerModal.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar
                }
            });

            await this.setStateAsync({
                detalleMedidas: medida.data,
                idTempMedida: '',
                newNameMedida: '',
                codigoMedida: '',
                loadModalTable: false,
                msgModalTable: 'Cargando datos...',
                msgWarningModal: '',
            })


        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgModalTable: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    async onSaveMedida() {

        if (this.state.newNameMedida === '') {
            this.setState({ msgWarningModal: 'Ingrese el nombre.' })
            this.refNewNameMedida.current.focus();
            return;
        }

        try {
            ModalAlertInfo("Medida", "Procesando información...");

            if (this.state.idTempMedida !== "") {
                const editar = await axios.post('/api/producto/updatemedida', {
                    "nombre": this.state.newNameMedida.trim().toUpperCase(),
                    "codigo": this.state.codigoMedida.trim().toUpperCase(),
                    "idMedida": this.state.idTempMedida
                })
                ModalAlertSuccess("Medida", editar.data, () => {
                    this.initLoadModal(0, "")
                });
            } else {
                const agregar = await axios.post("/api/producto/addmedida", {
                    "nombre": this.state.newNameMedida.trim().toUpperCase(),
                    "codigo": this.state.codigoMedida.trim().toUpperCase()
                })
                ModalAlertSuccess("Medida", agregar.data, () => {
                    this.initLoadModal(0, "")
                });
            }

        } catch (error) {
            if (error.response !== undefined) {
                ModalAlertWarning("Medida", error.response.data)
            } else {
                ModalAlertWarning("Medida", "Se genero un error interno, intente nuevamente.")
            }

        }
    }

    searchText = async (text) => {
        this.initLoadModal(1, text)
    }

    onEventGuardar() {
        if (this.state.destino === 1) {
            this.prodVenta()
        } else {
            this.prodProduccionConsumo()
        }

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
        } else {
            
            try {
                ModalAlertInfo("Producto", "Procesando información...");

                let result = '';

                if(this.state.idProducto !== ''){
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

                        "idProducto": this.state.idProducto
                    });
                } else{
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

                if(this.state.idProducto !== ""){
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
                } else{
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

    render() {
        return (
            <>

                {/* Inicio modal*/}
                <div className="modal fade" id="modalMedida" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{this.state.idTempMedida === '' ? 'Nueva' : 'Editar'} unida de medida</h5>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                {
                                    this.state.msgWarningModal === '' ? null :
                                        <div className="alert alert-warning" role="alert">
                                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.msgWarningModal}
                                        </div>
                                }


                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Nombre <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group input-group-sm">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ingrese el nombre"
                                                maxLength={250}
                                                ref={this.refNewNameMedida}
                                                value={this.state.newNameMedida}
                                                onChange={async (event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        await this.setStateAsync({
                                                            newNameMedida: event.target.value,
                                                            msgWarningModal: ''
                                                        });
                                                    } else {
                                                        await this.setStateAsync({
                                                            newNameMedida: event.target.value,
                                                            msgWarningModal: 'Ingrese el nombre.'
                                                        });
                                                    }
                                                }} />
                                        </div>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Simbolo </label>
                                        <div className="input-group input-group-sm">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ingrese el simbolo"
                                                value={this.state.codigoMedida}
                                                onChange={(event) => this.setState({ codigoMedida: event.target.value })} />
                                            <button className={`btn btn-sm ml-1 ${this.state.idTempMedida === '' ? 'btn-outline-info' : 'btn-outline-warning'}`} title={this.state.idTempMedida === '' ? 'Agregar nueva medida' : 'Editar medida'} onClick={() => this.onSaveMedida()}>
                                                {
                                                    this.state.idTempMedida === '' ?
                                                        <i className="bi bi-plus-circle"></i> :
                                                        <i className="bi bi-pen-fill"></i>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* <div className="form-group col-md-12">
                                        <div className="text-center">
                                            <button className={`btn btn-sm ml-1 ${this.state.idTempMedida === '' ? 'btn-outline-info' : 'btn-outline-warning'}`} title={this.state.idTempMedida === '' ? 'Agregar nueva medida' : 'Editar medida'} onClick={() => this.onSaveMedida()}>
                                                {
                                                    this.state.idTempMedida === '' ?
                                                        <><i className="bi bi-plus-circle"></i> Nuevo</>
                                                        :
                                                        <><i className="bi bi-pen-fill"></i> Editar</>

                                                }
                                            </button>
                                        </div>
                                    </div> */}

                                </div>

                                <hr className="mt-0 mb-3" />

                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-search"></i></div>
                                            </div>
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Buscar..."
                                                ref={this.refSearchMedida}
                                                onKeyUp={(event) => this.searchText(event.target.value.trim().toUpperCase())} />
                                            <button className="btn btn-outline-secondary btn-sm ml-1" title="Recargar" onClick={() => this.initLoadModal(0, "")}>
                                                <i className="bi bi-arrow-clockwise"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="table-responsive">
                                        <table className="table table-striped table-bordered rounded">
                                            <thead>
                                                <tr>
                                                    <th width="5%" className="p-1">#</th>
                                                    <th width="85%" className="p-1">Nombre </th>
                                                    <th width="10%" className="p-1">Simbolo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    this.state.loadModalTable ? (
                                                        <tr>
                                                            <td className="text-center p-1" colSpan="3">
                                                                {spinnerLoading(this.state.msgModalTable)}
                                                            </td>
                                                        </tr>
                                                    ) : this.state.detalleMedidas.length === 0 ? (
                                                        <tr className="text-center">
                                                            <td className="p-1" colSpan="3">¡No hay datos registrados!</td>
                                                        </tr>
                                                    ) :

                                                        (
                                                            this.state.detalleMedidas.map((item, index) => {
                                                                return (
                                                                    <tr key={item.idMedida} onClick={() => this.setState({ idTempMedida: item.idMedida, newNameMedida: item.nombre, codigoMedida: item.codigo })}>
                                                                        <td className="p-1">{++index}</td>
                                                                        <td className="p-1">{item.nombre}</td>
                                                                        <td className="p-1">{item.codigo}</td>
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
                            <div className="modal-footer">
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal*/}

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

                            {
                                this.state.messageWarning === '' ? null :
                                    <div className="alert alert-warning" role="alert">
                                        <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                    </div>
                            }

                            <hr className="mt-0 mb-2"/>

                            <div className="mb-3">
                                <span className="text-info">Recuerda que al mover el producto a otro almacen, este se movera con sus cantidades.</span>
                            </div>

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
                                                        onEventAddItem={this.onEventAddItem}
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
                                                    <label>Precio <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group input-group-sm">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ingrese el precio del producto"
                                                            ref={this.refPrecio}
                                                            value={this.state.precio}
                                                            onChange={(event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    this.setState({
                                                                        precio: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    this.setState({
                                                                        precio: event.target.value,
                                                                        messageWarning: 'Ingrese el precio del producto.',
                                                                    });
                                                                }
                                                            }}
                                                            onKeyPress={keyNumberFloat} />
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
                                                        onEventAddItem={this.onEventAddItem}
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

export default ProductoProceso;