import React from 'react';
import axios from 'axios';
import {
    currentDate,
    isNumeric,
    keyNumberFloat,
    spinnerLoading,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    showModal,
    viewModal,
    clearModal,
    numberFormat
} from '../../tools/Tools';
import Paginacion from '../../tools/Paginacion';
import { connect } from 'react-redux';

class AjusteInventarioProceso extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            fecha: currentDate(),

            idAlmacen: '',
            almacenes: [],
            nombreAlmacen: '',

            observacion: '',
            detalleTabla: [],
            importeTotal: 0,

            loading: false,

            messageWarning: '',
            msgLoading: 'Cargando datos...',

            //modal producto
            lista: [],
            loadModalTable: false,

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            msgModalTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas',
        }

        this.refAlmacen = React.createRef()

        this.abortControllerView = new AbortController();
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

        viewModal("modalProducto", () => {
            this.abortControllerModal = new AbortController();
            this.loadInit();
        });

        clearModal("modalProducto", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                loadModalTable: false,
                msgModalTable: 'Cargando datos...',
            });

        });

        this.loadData();
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    loadInit = async () => {
        if (this.state.loadModalTable) return;

        await this.setStateAsync({ paginacion: 1 });
        this.fillTable(0, "");
        await this.setStateAsync({ opcion: 0 });
    }

    async searchText(text) {
        if (this.state.loadModalTable) return;

        if (text.trim().length === 0) return;

        await this.setStateAsync({ paginacion: 1 });
        this.fillTable(1, text.trim());
        await this.setStateAsync({ opcion: 1 });
    }

    loadData = async () => {
        try {
            const almacen = await axios.get("/api/almacen/listcomboall", {
                signal: this.abortControllerView.signal,
            });

            await this.setStateAsync({
                almacenes: almacen.data,
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

    fillTable = async (opcion, buscar) => {

        try {
            await this.setStateAsync({ loadModalTable: true, lista: [], msgModalTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get('/api/producto/listprodalmacen', {
                signal: this.abortControllerModal.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar,
                    "idAlmacen": this.state.idAlmacen,
                    "posicionPagina": ((this.state.paginacion - 1) * this.state.filasPorPagina),
                    "filasPorPagina": this.state.filasPorPagina
                }
            });

            let totalPaginacion = parseInt(Math.ceil((parseFloat(result.data.total) / this.state.filasPorPagina)));
            let messagePaginacion = `Mostrando ${result.data.result.length} de ${totalPaginacion} Páginas`;

            await this.setStateAsync({
                lista: result.data.result,
                totalPaginacion: totalPaginacion,
                messagePaginacion: messagePaginacion,
                loadModalTable: false,
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    loadModalTable: false,
                    lista: [],
                    totalPaginacion: 0,
                    msgModalTable: "Se produjo un error interno, intente nuevamente por favor.",
                    messagePaginacion: "Mostranto 0 de 0 Páginas",
                });
            }
        }
    }

    openModalProduct() {
        if (this.state.idAlmacen === "") {
            this.setState({ messageWarning: "Seleccione el almacen." });
            this.refAlmacen.current.focus();
        } else {
            showModal('modalProducto')
        }

    }

    paginacionContext = async (listid) => {
        await this.setStateAsync({ paginacion: listid });
        this.onEventPaginacion();
    }

    onEventPaginacion = () => {
        switch (this.state.opcion) {
            case 0:
                this.fillTable(0, "");
                break;
            case 1:
                this.fillTable(1, this.refSearch.current.value);
                break;
            default: this.fillTable(0, "");
        }
    }

    async addObjectTable(producto) {

        if (!this.validarDuplicado(producto.idProducto)) {
            let detalle = {
                "idProducto": producto.idProducto,
                "codigoProducto": producto.codigo,
                "nombreProducto": producto.nombre,
                "cantidadActual": parseFloat(producto.cantidad),
                "tipoAjuste": '1',
                "cantidad": 1,
                "costo": parseFloat(producto.costo),
                "cantidadFinal": parseFloat(producto.cantidad) + 1,
                "totalAjuste": parseFloat(producto.costo) * 1
            }
            this.state.detalleTabla.push(detalle)
        } else {
            for (let item of this.state.detalleTabla) {
                if (item.idProducto === producto.idProducto) {
                    let currenteObject = item;

                    currenteObject.cantidad = parseFloat(currenteObject.cantidad) + 1;

                    currenteObject.cantidadFinal = currenteObject.tipoAjuste === '1' ?
                        parseFloat(currenteObject.cantidadActual) + parseFloat(currenteObject.cantidad)
                        : parseFloat(currenteObject.cantidadActual) - parseFloat(currenteObject.cantidad);
                    
                    currenteObject.totalAjuste = currenteObject.tipoAjuste === '1' ?
                        parseFloat(currenteObject.costo) * parseFloat(currenteObject.cantidad)
                        : parseFloat(currenteObject.costo) * parseFloat(-currenteObject.cantidad);

                    break;
                }
            }
        }

        let newArr = [...this.state.detalleTabla]

        await this.setStateAsync({
            detalleTabla: newArr,
            messageWarning: ''
        });

        const { total } = this.calculateTotals();

        await this.setStateAsync({
            importeTotal: total
        });
    }

    calculateTotals() {
        let total = 0;
        for (let item of this.state.detalleTabla) {
            total = total + item.totalAjuste
        }
        return { total }
    }

    validarDuplicado(id) {
        let value = false
        for (let item of this.state.detalleTabla) {
            if (item.idProducto === id) {
                value = true
                break;
            }
        }
        return value
    }

    async removeObjectTable(id) {
        let newArr = [...this.state.detalleTabla];

        for (let i = 0; i < newArr.length; i++) {
            if (id === newArr[i].idProducto) {
                newArr.splice(i, 1)
                i--;
                break;
            }
        }

        await this.setStateAsync({
            detalleTabla: newArr
        })

        const { total } = this.calculateTotals();

        await this.setStateAsync({
            importeTotal: total
        });
    }

    handleSelectTipoAjuste = async (event, idProducto) => {
        let updatedList = [...this.state.detalleTabla];
        for (let item of updatedList) {
            if (item.idProducto === idProducto) {
                item.tipoAjuste = event.target.value;

                if (isNumeric(item.cantidad.toString())) {
                    item.cantidadFinal = event.target.value === '1' ?
                        parseFloat(item.cantidadActual) + parseFloat(item.cantidad)
                        : parseFloat(item.cantidadActual) - parseFloat(item.cantidad);
                    item.totalAjuste = event.target.value === '1' ?
                        parseFloat(item.costo) * parseFloat(item.cantidad)
                        : parseFloat(item.costo) * parseFloat(-item.cantidad)
                }
                break;
            }
        }
        await this.setStateAsync({ detalleTabla: updatedList, messageWarning: ''})

        const { total } = this.calculateTotals();

        await this.setStateAsync({
            importeTotal: total
        });

    }

    handleSelectCantidad = async (event, idProducto) => {

        let updatedList = [...this.state.detalleTabla];
        for (let item of updatedList) {
            if (item.idProducto === idProducto) {
                item.cantidad = event.target.value;

                if (isNumeric(item.cantidad)) {
                    item.cantidadFinal = item.tipoAjuste === '1' ? parseFloat(item.cantidadActual) + parseFloat(item.cantidad)
                        : parseFloat(item.cantidadActual) - parseFloat(item.cantidad);

                    item.totalAjuste = item.tipoAjuste === '1' ?
                        parseFloat(item.costo) * parseFloat(item.cantidad)
                        : parseFloat(item.costo) * parseFloat(-item.cantidad)
                }
                break;
            }
        }
        await this.setStateAsync({ detalleTabla: updatedList, messageWarning: '' })

        const { total } = this.calculateTotals();

        await this.setStateAsync({
            importeTotal: total
        });
    }

    async onEventRemoveData() {
        await this.setStateAsync({
            idAlmacen: '',
            nombreAlmacen: '',
            fecha: currentDate(),
            observacion: '',
            detalleTabla: [],
            importeTotal: 0
        })
    }

    async onSave() {

        if (this.state.idAlmacen === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el almacen." })
            this.refAlmacen.current.focus()
            return;
        }
        if (this.state.detalleTabla.length === 0) {
            await this.setStateAsync({ messageWarning: "Agregar datos a la tabla." })
            return;
        }

        let validate = this.state.detalleTabla.reduce((acumulador, item) =>
            item.cantidad === "" || !isNumeric(item.cantidad.toString()) ? acumulador + 1 : acumulador + 0
            , 0);

        if (validate > 0) {
            await this.setStateAsync({ messageWarning: "Hay detalles en la tabla sin cantidad numerica." });
            let count = 0;
            for (let item of this.state.detalleTabla) {
                count++;
                if (item.cantidad === "" || !isNumeric(item.cantidad.toString())) {
                    document.getElementById(count + "imc").focus()
                }
            }
            return;
        } else {
            await this.setStateAsync({ messageWarning: "" });
        }

        ModalAlertDialog("Ajuste", "¿Estás seguro de continuar?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Ajuste", "Procesando información...");
                    let result = await axios.post('/api/ajusteinventario/add', {
                        "idAlmacen": this.state.idAlmacen,
                        "idUsuario": this.props.token.userToken.idUsuario,
                        "total": this.state.importeTotal,
                        "fecha": this.state.fecha,
                        "estado": 1,
                        "observacion": this.state.observacion.trim().toUpperCase(),
                        "ajusteDetalle": this.state.detalleTabla
                    });

                    ModalAlertSuccess("Ajuste", result.data, () => {
                        this.onEventRemoveData();
                    });
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Ajuste", error.response.data)
                    } else {
                        ModalAlertWarning("Ajuste", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        });
    }

    render() {
        return (
            <>
                {/* Inicio modal*/}
                <div className="modal fade" id="modalProducto" data-backdrop="static">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Lista de productos -  {this.state.nombreAlmacen}</h5>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <label className="text-info">Hacer click para agregar el producto a la tabla.</label>
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <div className="input-group-text"><i className="bi bi-search"></i></div>
                                            </div>
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Buscar por nombre o codigo del producto..."
                                                ref={this.refSearch}
                                                onKeyUp={(event) => this.searchText(event.target.value)} />
                                            <button className="btn btn-outline-secondary btn-sm ml-1" title="Recargar" onClick={() => this.loadInit()}>
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
                                                    <th width="65%" className="p-1">Nombre</th>
                                                    <th width="10%" className="p-1">Cantidad</th>
                                                    <th width="10%" className="p-1">Impuesto</th>
                                                    <th width="10%" className="p-1">Costo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    this.state.loadModalTable ? (
                                                        <tr>
                                                            <td className="text-center p-1" colSpan="5">
                                                                {spinnerLoading(this.state.msgModalTable)}
                                                            </td>
                                                        </tr>
                                                    ) : this.state.lista.length === 0 ? (
                                                        <tr className="text-center">
                                                            <td className="p-1" colSpan="5">¡No hay datos registrados!</td>
                                                        </tr>
                                                    ) :
                                                        (
                                                            this.state.lista.map((item, index) => {
                                                                return (
                                                                    <tr key={item.idProducto} onClick={() => this.addObjectTable(item)}>
                                                                        <td className="p-1">{++index}</td>
                                                                        <td className="p-1">{item.codigo}<br />{item.nombre}</td>
                                                                        <td className="p-1">{item.cantidad}<br />{item.medida}</td>
                                                                        <td className="p-1">{item.impuesto}</td>
                                                                        <td className="p-1">{numberFormat(item.costo)}</td>
                                                                    </tr>
                                                                )
                                                            })
                                                        )
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-sm-12 col-md-5 mb-0">
                                        <div className="dataTables_info mt-2" role="status" aria-live="polite">{this.state.messagePaginacion}</div>
                                    </div>
                                    <div className="form-group col-sm-12 col-md-7 mb-0">
                                        <div className="dataTables_paginate paging_simple_numbers">
                                            <nav aria-label="Page navigation example">
                                                <ul className="pagination pagination-sm justify-content-end my-0">
                                                    <Paginacion
                                                        loading={this.state.loadModalTable}
                                                        totalPaginacion={this.state.totalPaginacion}
                                                        paginacion={this.state.paginacion}
                                                        fillTable={this.paginacionContext}
                                                    />
                                                </ul>
                                            </nav>
                                        </div>
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
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Nuevo ajuste de inventario
                                        </h5>
                                    </section>
                                </div>
                            </div>

                            <hr className="mt-0 mb-2" />

                            {
                                this.state.messageWarning === '' ? null :
                                    <div className="alert alert-warning" role="alert">
                                        <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                    </div>
                            }

                            <div className="row">
                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">

                                    <div className="form-row">
                                        <div className="form-group col-md-4">
                                            <label>Almacen <i className="fa fa-asterisk text-danger small"></i></label>
                                            <div className="input-group input-group-sm">
                                                <select
                                                    className="form-control"
                                                    ref={this.refAlmacen}
                                                    value={this.state.idAlmacen}
                                                    onChange={async (event) => {

                                                        if (event.target.value.trim().length > 0) {

                                                            let nameAlmacen = ''
                                                            for (let item of this.state.almacenes) {
                                                                if (item.idAlmacen === event.target.value) {
                                                                    nameAlmacen = item.nombre
                                                                    break;
                                                                }
                                                            }

                                                            await this.setStateAsync({
                                                                idAlmacen: event.target.value,
                                                                nombreAlmacen: nameAlmacen,
                                                                fecha: currentDate(),
                                                                observacion: '',
                                                                detalleTabla: [],
                                                                importeTotal: 0,
                                                                messageWarning: '',
                                                            });

                                                        } else {
                                                            await this.setStateAsync({
                                                                idAlmacen: event.target.value,
                                                                nombreAlmacen: '',
                                                                fecha: currentDate(),
                                                                observacion: '',
                                                                detalleTabla: [],
                                                                importeTotal: 0,
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
                                        <div className="form-group col-md-4">
                                            <label>Fecha <i className="fa fa-asterisk text-danger small"></i></label>
                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={this.state.fecha}
                                                    onChange={(event) => {
                                                        this.setState({
                                                            fecha: event.target.value,
                                                        });
                                                    }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group col-md-12">
                                            <label>Observación </label>
                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Ingrese alguna observación"
                                                    value={this.state.observacion}
                                                    onChange={(event) =>
                                                        this.setState({
                                                            observacion: event.target.value,
                                                        })
                                                    } />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group col-md-12">
                                            <button className="btn btn-success" type="button" title="Guardar" onClick={() => this.onSave()}><i className="fa fa-save"></i> Guardar</button>
                                            {" "}
                                            <button className="btn btn-outline-warning" type="button" title="Abrir lista de productos" onClick={() => this.openModalProduct()}><i className="bi bi-boxes"></i> Producto</button>
                                            {" "}
                                            <button className="btn btn-outline-info" type="button" title="Limpiar" onClick={() => this.onEventRemoveData()}><i className="fa fa-trash"></i> Limpiar</button>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="table-responsive">
                                            <table className="table table-striped table-bordered rounded">
                                                <thead>
                                                    <tr>
                                                        <th width="auto" className="p-1">Quitar</th>
                                                        <th width="35%" className="p-1">Producto</th>
                                                        <th width="10%" className="p-1">Cantidad actual</th>
                                                        <th width="15%" className="p-1">Tipo de ajuste</th>
                                                        <th width="10%" className="p-1">Cantida</th>
                                                        <th width="10%" className="p-1">Costo</th>
                                                        <th width="10%" className="p-1">Cantidad final</th>
                                                        <th width="10%" className="p-1">Total ajustado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.detalleTabla.length === 0 ? (
                                                            <tr className="text-center">
                                                                <td colSpan="8" className="p-1"> Agregar datos a la tabla </td>
                                                            </tr>
                                                        ) : (
                                                            this.state.detalleTabla.map((item, index) => (
                                                                <tr key={index} style={{ "fontSize": "12px" }}>
                                                                    <td className="p-1">
                                                                        <button className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => this.removeObjectTable(item.idProducto)}><i className="fa fa-close"></i></button>
                                                                    </td>
                                                                    <td className="p-1">{item.codigoProducto}<br />{item.nombreProducto}</td>
                                                                    <td className="p-1">{item.cantidadActual}</td>
                                                                    <td className="p-1">
                                                                        <select
                                                                            className="form-control form-control-sm"
                                                                            value={item.tipoAjuste}
                                                                            onChange={(event) => this.handleSelectTipoAjuste(event, item.idProducto)}>
                                                                            <option value="1">INCREMENTO</option>
                                                                            <option value="2">DECREMENTO</option>
                                                                        </select>
                                                                    </td>
                                                                    <td className="p-1">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm"
                                                                            id={++index + "imc"}
                                                                            value={item.cantidad}
                                                                            onChange={(event) => this.handleSelectCantidad(event, item.idProducto)}
                                                                            onKeyPress={keyNumberFloat}
                                                                        />
                                                                    </td>
                                                                    <td className="p-1">{numberFormat(item.costo)}</td>
                                                                    <td className="p-1">{item.cantidadFinal}</td>
                                                                    <td className="p-1">{numberFormat(item.totalAjuste)}</td>
                                                                </tr>
                                                            ))
                                                        )
                                                    }
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td className="text-right p-1" width="auto" colSpan={7}><strong>Total</strong></td>
                                                        <td className="text-right p-1">{numberFormat(this.state.importeTotal)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
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

export default connect(mapStateToProps, null)(AjusteInventarioProceso);
