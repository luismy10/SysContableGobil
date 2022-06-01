import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    showModal,
    hideModal,
    viewModal,
    clearModal,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    statePrivilegio
} from '../tools/Tools';
import { connect } from 'react-redux';
import Paginacion from '../tools/Paginacion';

class Monedas extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idMoneda: '',
            nombre: '',
            codIso: '',
            simbolo: '',
            estado: true,
            idUsuario: this.props.token.userToken.idUsuario,

            add: statePrivilegio(this.props.token.userToken.menus[5].submenu[1].privilegio[0].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[5].submenu[1].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[5].submenu[1].privilegio[2].estado),

            loadModal: false,
            nameModal: 'Nuevo Comprobante',
            msgModal: 'Cargando datos...',

            loading: false,
            lista: [],

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas'
        }
        this.refTxtNombre = React.createRef();
        this.refTxtCodIso = React.createRef();
        this.refTxtSimbolo = React.createRef();
        this.refTxtSearch = React.createRef();

        this.idCodigo = "";
        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadInit();

        viewModal("modalMoneda", () => {
            this.abortControllerModal = new AbortController();

            if (this.idCodigo !== "") this.loadDataId(this.idCodigo);
        });

        clearModal("modalMoneda", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                idMoneda: '',
                nombre: '',
                codIso: '',
                simbolo: '',
                estado: '',
                ckEstado: true,

                loadModal: false,
                nameModal: 'Nuevo Comprobante',
                msgModal: 'Cargando datos...',
            });
            this.idCodigo = "";
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
                this.fillTable(1, this.refTxtSearch.current.value);
                break;
            default: this.fillTable(0, "");
        }
    }

    fillTable = async (opcion, buscar) => {
        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get('/api/moneda/list', {
                signal: this.abortControllerTable.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar.trim().toUpperCase(),
                    "posicionPagina": ((this.state.paginacion - 1) * this.state.filasPorPagina),
                    "filasPorPagina": this.state.filasPorPagina
                }
            });

            let totalPaginacion = parseInt(Math.ceil((parseFloat(result.data.total) / this.state.filasPorPagina)));
            let messagePaginacion = `Mostrando ${result.data.result.length} de ${totalPaginacion} Páginas`;

            await this.setStateAsync({
                loading: false,
                lista: result.data.result,
                totalPaginacion: totalPaginacion,
                messagePaginacion: messagePaginacion
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

    async openModal(id) {
        if (id === '') {
            showModal('modalMoneda')
            await this.setStateAsync({ nameModal: "Nueva Moneda" });
        }
        else {
            showModal('modalMoneda')
            this.idCodigo = id;
            await this.setStateAsync({ idMoneda: id, nameModal: "Editar Moneda", loadModal: true });
        }
    }

    loadDataId = async (id) => {
        try {
            const result = await axios.get("/api/moneda/id", {
                signal: this.abortControllerModal.signal,
                params: {
                    idMoneda: id
                }
            });

            await this.setStateAsync({
                nombre: result.data.nombre,
                codIso: result.data.codiso,
                simbolo: result.data.simbolo,
                estado: result.data.estado,
                idMoneda: result.data.idMoneda,
                loadModal: false
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgModal: "Se produjo un error interno, intente nuevamente"
                });
            }
        }
    }

    async onEventGuardar() {
        if (this.state.nombre === "") {
            this.refTxtNombre.current.focus();
        } else if (this.state.codIso === "") {
            this.refTxtCodIso.current.focus();
        } else if (this.state.estado === "") {
            this.estado.current.focus();
        } else {
            try {
                ModalAlertInfo("Moneda", "Procesando información...");
                hideModal("modalMoneda");

                if (this.state.idMoneda !== '') {
                    const result = await axios.post('/api/moneda/update', {
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "codiso": this.state.codIso.trim().toUpperCase(),
                        "simbolo": this.state.simbolo.trim().toUpperCase(),
                        "estado": this.state.estado,
                        "idUsuario": this.state.idUsuario,
                        "idMoneda": this.state.idMoneda
                    })
                    ModalAlertSuccess("Moneda", result.data, () => {
                        this.onEventPaginacion();
                    });

                } else {
                    const result = await axios.post('/api/moneda/add', {
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "codiso": this.state.codIso.trim().toUpperCase(),
                        "simbolo": this.state.simbolo.trim().toUpperCase(),
                        "estado": this.state.estado,
                        "idUsuario": this.state.idUsuario
                    });
                    ModalAlertSuccess("Moneda", result.data, () => {
                        this.loadInit();
                    });
                }
            } catch (error) {
                if (error.response !== undefined) {
                    ModalAlertWarning("Moneda", error.response.data)
                } else {
                    ModalAlertWarning("Moneda", "Se genero un error interno, intente nuevamente.")
                }
            }
        }
    }

    onEventDelete(idMoneda) {
        ModalAlertDialog("Moneda", "¿Estás seguro de eliminar la moneda?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Moneda", "Procesando información...")
                    let result = await axios.delete('/api/moneda', {
                        params: {
                            "idMoneda": idMoneda
                        }
                    })
                    ModalAlertSuccess("Moneda", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Moneda", error.response.data)
                    } else {
                        ModalAlertWarning("Moneda", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                {/* Inicio modal nuevo cliente*/}
                <div className="modal fade" id="modalMoneda" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{this.state.nameModal}</h5>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {this.state.loadModal ?
                                    <div className="clearfix absolute-all bg-white">
                                        {spinnerLoading(this.state.msgModal)}
                                    </div>
                                    : null}

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Moneda:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtNombre}
                                            value={this.state.nombre}
                                            onChange={(event) => this.setState({ nombre: event.target.value })}
                                            placeholder="Soles, dolares, etc" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Código ISO:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtCodIso}
                                            value={this.state.codIso}
                                            onChange={(event) => this.setState({ codIso: event.target.value })}
                                            placeholder="PEN, USD, etc" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Simbolo:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtSimbolo}
                                            value={this.state.simbolo}
                                            onChange={(event) => this.setState({ simbolo: event.target.value })}
                                            placeholder="S/, $, etc" />
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label>Estado:</label>
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="switch1"
                                                checked={this.state.estado}
                                                onChange={(value) => this.setState({ estado: value.target.checked })} />
                                            <label className="custom-control-label" htmlFor="switch1">Activo o Inactivo</label>
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
                {/* fin modal nuevo cliente*/}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Monedas <small className="text-secondary">LISTA</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <div className="input-group mb-2">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><i className="bi bi-search"></i></div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar..."
                                    ref={this.refTxtSearch}
                                    onKeyUp={(event) => this.searchText(event.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <button className="btn btn-outline-info" onClick={() => this.openModal('')} disabled={!this.state.add}>
                                <i className="bi bi-file-plus"></i> Nuevo Registro
                            </button>
                            {" "}
                            <button className="btn btn-outline-secondary" onClick={() => this.loadInit()}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="5%" className="text-center">#</th>
                                        <th width="15%">Moneda</th>
                                        <th width="15%">Codigo ISO</th>
                                        <th width="15%">Símbolo</th>
                                        <th width="15%">Estado</th>
                                        <th width="5%" className="text-center">Editar</th>
                                        <th width="5%" className="text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="7">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="7">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.nombre}</td>
                                                        <td>{item.codiso}</td>
                                                        <td>{item.simbolo}</td>
                                                        <td><div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>{item.estado === 1 ? "ACTIVO" : "INACTIVO"}</div></td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.openModal(item.idMoneda)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i></button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Eliminar"
                                                                onClick={() => this.onEventDelete(item.idMoneda)}
                                                                disabled={!this.state.remove}>
                                                                <i className="bi bi-trash"></i></button>
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
                                <ul className="pagination justify-content-end">
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
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(Monedas);