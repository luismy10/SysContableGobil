import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import {
    spinnerLoading,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    ModalAlertDialog,
    showModal,
    capitalizeFirstLetter,
    viewModal,
    clearModal,
    hideModal
} from '../tools/Tools';
import Paginacion from '../tools/Paginacion';
import SearchBar from "../tools/SearchBar";

class Almacenes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            idAlmacen: '',
            idUbigeo: '',
            ubigeo: '',
            nombre: '',
            direccion: '',
            tipo: '',
            estado: 1,

            filter: false,
            filteredData: [],

            lista: [],
            loading: false,

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas',

            loadModal: false,
            msgModal: 'Cargando datos...',
            messageWarning: '',

            tipoOperacion: ''

        }

        this.refSearch = React.createRef();

        this.refTipo = React.createRef();
        this.refNombre = React.createRef();
        this.refUbigeo = React.createRef();

        this.abortControllerTable = new AbortController();

        this.selectItem = false;
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadInit();

        viewModal("modalAlmacen", async () => {
            this.abortControllerModal = new AbortController();

            if (this.state.idAlmacen !== '') {
                this.loadDataById(this.state.idAlmacen)
            } else {
                await this.setStateAsync({
                    loadModal: false
                });
            }

        });

        clearModal("modalAlmacen", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({

                idAlmacen: '',
                idUbigeo: '',
                ubigeo: '',
                nombre: '',
                direccion: '',
                tipo: '',
                estado: 1,

                tipoOperacion: '',

                loadModal: false,
                msgModal: 'Cargando datos...',
                messageWarning: '',
            });

        });
    }

    componentWillUnmount() {
        this.abortControllerTable.abort();
    }

    loadInit = async () => {
        if (this.state.loading) return;

        await this.setStateAsync({ paginacion: 1 });
        this.fillTable(0, "");
        await this.setStateAsync({ opcion: 0 });
    }

    fillTable = async (opcion, buscar) => {

        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get('/api/almacen/list', {
                signal: this.abortControllerTable.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar,
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
                loading: false,
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    loading: false,
                    lista: [],
                    totalPaginacion: 0,
                    messageTable: "Se produjo un error interno, intente nuevamente por favor.",
                    messagePaginacion: "Mostranto 0 de 0 Páginas",
                });
            }
        }
    }

    async searchText(text) {
        if (this.state.loading) return;

        if (text.trim().length === 0) return;

        await this.setStateAsync({ paginacion: 1 });
        this.fillTable(1, text.trim());
        await this.setStateAsync({ opcion: 1 });
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

    handleFilter = async (event) => {

        const searchWord = this.selectItem ? "" : event.target.value;
        await this.setStateAsync({ idUbigeo: '', ubigeo: searchWord });
        this.selectItem = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ filteredData: [] });
            return;
        }

        if (this.state.filter) return;

        try {
            await this.setStateAsync({ filter: true });
            let result = await axios.get("/api/ubigeo/", {
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
            ubigeo: value.departamento + "-" + value.provincia + "-" + value.distrito + " (" + value.ubigeo + ")",
            filteredData: [],
            idUbigeo: value.idUbigeo,
            messageWarning: ""
        });
        this.selectItem = true;
    }

    onEventClearInput = async () => {
        await this.setStateAsync({ filteredData: [], idUbigeo: '', ubigeo: "" });
        this.selectItem = false;
    }

    openModal = async (idAlmacen, operacion) => {
        await this.setStateAsync({ idAlmacen: idAlmacen, loadModal: true, tipoOperacion: operacion === 'nuevo' ? operacion : 'editar' });
        showModal('modalAlmacen')
    }

    async loadDataById(id) {

        try {

            let result = await axios.get("/api/almacen/id", {
                signal: this.abortControllerModal.signal,
                params: {
                    "idAlmacen": id
                }
            });

            const data = result.data;

            await this.setStateAsync({

                idAlmacen: data.idAlmacen,

                idUbigeo: data.idUbigeo.toString(),
                ubigeo: data.departamento + "-" + data.provincia + "-" + data.distrito + " (" + data.ubigeo + ")",

                nombre: data.nombre,
                direccion: data.direccion,
                tipo: data.tipo,
                estado: data.estado,

                loadModal: false
            });

            this.selectItem = true;

            // this.selectItem = data.idUbigeo === 0 ? false : true;

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgModal: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    async onEventGuardar() {
        if (this.state.tipo === '') {
            this.setState({ messageWarning: "Seleccione el tipo de almacen." });
            this.refTipo.current.focus();
        } else if (this.state.nombre === '') {
            this.setState({ messageWarning: "Ingrese el nombre del almacen." });
            this.refNombre.current.focus();
        } else if (this.state.idUbigeo === "") {
            await this.setStateAsync({
                messageWarning: "Ingrese su ubigeo."
            });
            this.refUbigeo.current.focus();
        } else {
            this.onSave()
        }

    }

    async onSave() {
        try {
            ModalAlertInfo("Almacen", "Procesando información...");
            hideModal("modalAlmacen");
            if (this.state.idAlmacen !== "") {
                const almacen = await axios.post('/api/almacen/update', {

                    "idUbigeo": this.state.idUbigeo,
                    "idUsuario": this.props.token.userToken.idUsuario,
                    "nombre": this.state.nombre.trim().toUpperCase(),
                    "direccion": this.state.direccion.trim().toUpperCase(),
                    "tipo": parseInt(this.state.tipo),
                    "estado": this.state.estado,

                    "idAlmacen": this.state.idAlmacen

                })
                ModalAlertSuccess("Almacen", almacen.data, () => {
                    this.loadInit()
                });
            } else {
                const almacen = await axios.post('/api/almacen/add', {

                    "idUbigeo": this.state.idUbigeo,
                    "idUsuario": this.props.token.userToken.idUsuario,
                    "nombre": this.state.nombre.trim().toUpperCase(),
                    "direccion": this.state.direccion.trim().toUpperCase(),
                    "tipo": parseInt(this.state.tipo),
                    "estado": this.state.estado,

                })
                ModalAlertSuccess("Almacen", almacen.data, () => {
                    this.loadInit()
                });
            }

        } catch (error) {
            if (error.response !== undefined) {
                ModalAlertWarning("Almacen", error.response.data)
            } else {
                ModalAlertWarning("Almacen", "Se genero un error interno, intente nuevamente.")
            }
        }

    }

    onDelete = (id) => {

        ModalAlertDialog("Almacen", `¿Estás seguro de eliminar el almacen?`, async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Almacen", "Procesando información...");

                    let result = await axios.delete("/api/almacen/delete", {
                        params: {
                            "idAlmacen": id
                        }
                    })

                    ModalAlertSuccess("Almacen", result.data, () => {
                        this.loadInit();
                    });

                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Almacen", error.response.data)
                    } else {
                        ModalAlertWarning("Almacen", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                {/* Inicio modal*/}
                <div className="modal fade" id="modalAlmacen" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{`${capitalizeFirstLetter(this.state.tipoOperacion)} almacen`}</h5>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {
                                    this.state.loadModal ?
                                        <div className="clearfix absolute-all bg-white">
                                            {spinnerLoading(this.state.msgModal)}
                                        </div>
                                        : null
                                }

                                {
                                    this.state.messageWarning === '' ? null :
                                        <div className="alert alert-warning" role="alert">
                                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                        </div>
                                }


                                <div className="form-row">

                                    <div className="form-group col-md-12">
                                        <label>Tipo <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group input-group-sm">
                                            <select
                                                className="form-control"
                                                ref={this.refTipo}
                                                value={this.state.tipo}
                                                onChange={(event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        this.setState({
                                                            tipo: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            tipo: event.target.value,
                                                            messageWarning: 'Seleccione el tipo de almacen.',
                                                        });
                                                    }
                                                }} >
                                                <option value="">-- Seleccione --</option>
                                                <option value="1">PRODUCTOS TERMINADOS</option>
                                                <option value="2">MATERIAS PRIMAS</option>
                                                <option value="3">REPUESTOS Y/O ACCESORIOS</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label>Nombre <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group input-group-sm">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ingrese el nombre del almacen"
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
                                                            messageWarning: 'Ingrese el nombre del almacen.',
                                                        });
                                                    }
                                                }} />
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label>Ubigeo <i className="fa fa-asterisk text-danger small"></i></label>
                                        <SearchBar
                                            placeholder="Escribe para iniciar a filtrar..."
                                            refTxtUbigeo={this.refUbigeo}
                                            ubigeo={this.state.ubigeo}
                                            filteredData={this.state.filteredData}
                                            onEventClearInput={this.onEventClearInput}
                                            handleFilter={this.handleFilter}
                                            onEventSelectItem={this.onEventSelectItem}
                                        />
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label>Dirección</label>
                                        <div className="input-group input-group-sm">
                                            <input
                                                className="form-control"
                                                placeholder="Ingrese la dirección del almacen"
                                                value={this.state.direccion}
                                                onChange={(event) => this.setState({ direccion: event.target.value })} />
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12">
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
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Guardar</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal*/}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Almacenes <small className="text-secondary">LISTA</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <div className="input-group input-group-sm">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><i className="bi bi-search"></i></div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar..."
                                    ref={this.refSearch}
                                    onKeyUp={(event) => this.searchText(event.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <div className="form-group">
                                <button className="btn btn-outline-info btn-sm" onClick={() => this.openModal(this.state.idAlmacen, 'nuevo')}>
                                    <i className="bi bi-file-plus"></i> Nuevo Registro
                                </button>
                                {" "}
                                <button className="btn btn-outline-secondary btn-sm" title="Recargar" onClick={() => this.loadInit()}>
                                    <i className="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="5%" className="p-1">#</th>
                                        <th width="25%" className="p-1">Tipo</th>
                                        <th width="30%" className="p-1">Nombre</th>
                                        <th width="30%" className="p-1">Dirección</th>
                                        {/* <th width="10%" className="p-1">F/Registro</th> */}
                                        <th width="10%" className="text-center p-1">Estado</th>
                                        <th width="auto" className="text-center p-1">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center p-1" colSpan="6">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td className="p-1" colSpan="6">¡No hay datos registrados!</td>
                                            </tr>
                                        ) :

                                            (
                                                this.state.lista.map((item, index) => {
                                                    return (
                                                        <tr key={index} >
                                                            <td className="p-1">{item.id}</td>
                                                            <td className="p-1">
                                                                {
                                                                    item.tipo === 1 ? 'PRODUCTOS TERMINADOS'
                                                                        : item.tipo === 2 ? 'MATERIAS PRIMAS'
                                                                            : item.tipo === 3 ? 'REPUESTOS Y/O ACCESORIOS' : ''
                                                                }
                                                            </td>
                                                            <td className="p-1">{item.nombre}</td>
                                                            <td className="p-1">{item.direccion}</td>
                                                            {/* <td className="p-1">{item.fecha}</td> */}
                                                            <td className="text-center p-1">
                                                                <div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>
                                                                    {item.estado === 1 ? "ACTIVO" : "INACTIVO"}
                                                                </div>
                                                            </td>
                                                            <td className="d-flex p-1">
                                                                <button
                                                                    className="btn btn-outline-warning btn-sm"
                                                                    title="Editar"
                                                                    onClick={() => this.openModal(item.idAlmacen, 'editar')}>
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm ml-1"
                                                                    title="Eliminar"
                                                                    onClick={() => this.onDelete(item.idAlmacen)}>
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </td>
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

                <div className="row">
                    <div className="col-sm-12 col-md-5">
                        <div className="dataTables_info mt-2" role="status" aria-live="polite">{this.state.messagePaginacion}</div>
                    </div>
                    <div className="col-sm-12 col-md-7">
                        <div className="dataTables_paginate paging_simple_numbers">
                            <nav aria-label="Page navigation example">
                                <ul className="pagination pagination-sm justify-content-end">
                                    <Paginacion
                                        loading={this.state.loading}
                                        totalPaginacion={this.state.totalPaginacion}
                                        paginacion={this.state.paginacion}
                                        fillTable={this.paginacionContext}
                                    />
                                </ul>
                            </nav>
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

export default connect(mapStateToProps, null)(Almacenes);

