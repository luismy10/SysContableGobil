import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import {
    showModal,
    hideModal,
    clearModal,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading,
    statePrivilegio,
} from '../tools/Tools';
import Paginacion from '../tools/Paginacion';

class Usuarios extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            resetClave: '',

            add: statePrivilegio(this.props.token.userToken.menus[1].submenu[1].privilegio[0].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[1].submenu[1].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[1].submenu[1].privilegio[2].estado),
            reset: statePrivilegio(this.props.token.userToken.menus[1].submenu[1].privilegio[3].estado),

            loading: false,
            lista: [],

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas'
        }

        this.refResetClave = React.createRef();

        this.refTxtSearch = React.createRef();

        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadInit();

        clearModal("modalClave", async () => {
            await this.setStateAsync({
                idUsuario: '',
                resetClave: ''
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

            const result = await axios.get('/api/usuario/list', {
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

    onEventDelete(idUsuario) {
        ModalAlertDialog("Eliminar Usuario", "¿Está seguro de que desea eliminar el usuario? Esta operación no se puede deshacer.", async (value) => {
            if (value) {
                try {
                    ModalAlertInfo("Usuario", "Procesando información...")
                    let result = await axios.delete('/api/usuario', {
                        params: {
                            "idUsuario": idUsuario
                        }
                    })
                    ModalAlertSuccess("Usuario", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Usuario", error.response.data)
                    } else {
                        ModalAlertWarning("Usuario", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    async openReset(id) {
        showModal('modalClave');
        await this.setStateAsync({ idUsuario: id });
    }

    async onEventReset() {
        if (this.state.resetClave === "") {
            this.refResetClave.current.focus();
        } else {
            try {
                ModalAlertInfo("Usuario", "Procesando información...");
                hideModal("modalClave");
                let result = await axios.post("/api/usuario/reset", {
                    "clave": this.state.resetClave,
                    "idUsuario": this.state.idUsuario
                });

                ModalAlertSuccess("Usuario", result.data);
            } catch (error) {
                ModalAlertWarning("Usuario", "Se produjo un error un interno, intente nuevamente.");
            }
        }
    }

    render() {
        return (
            <>

                {/* Inicio resetear */}
                <div className="modal fade" id="modalClave" data-bs-keyboard="false" data-bs-backdrop="static">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Resetear Contraseña</h5>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className='row py-1'>
                                    <div className='col-lg-4 col-md-4 col-sm-12 col-xs-12'>
                                        <label>Nueva Clave: </label>
                                    </div>
                                    <div className='col-lg-8 col-md-8 col-sm-12 col-xs-12'>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refResetClave}
                                            value={this.state.resetClave}
                                            onChange={(event) => this.setState({ resetClave: event.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventReset()}>Aceptar</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin resetear */}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Usuarios <small className="text-secondary">LISTA</small></h5>
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
                            <button className="btn btn-outline-info" onClick={() => {
                                this.props.history.push({ pathname: `${this.props.location.pathname}/proceso` })
                            }} disabled={!this.state.add}>
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
                                        <th width="20%">Nombre y Apellidos</th>
                                        <th width="10%">Telefono</th>
                                        <th width="10%">Email</th>
                                        <th width="10%">Perfil</th>
                                        <th width="10%">Representante</th>
                                        <th width="5%">Estado</th>
                                        <th width="5%">Editar</th>
                                        <th width="5%">Eliminar</th>
                                        <th width="5%">Resetear</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="10">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="10">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.dni}{<br />}{item.nombres + ", " + item.apellidos}</td>
                                                        <td>{item.telefono}</td>
                                                        <td>{item.email}</td>
                                                        <td>{item.perfil}</td>
                                                        <td>{item.representante === 1 ? "SI" : "NO"}</td>
                                                        <td className="text-center"><div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>{item.estado === 1 ? "ACTIVO" : "INACTIVO"}</div></td>
                                                        <td>
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => {
                                                                    this.props.history.push({ pathname: `${this.props.location.pathname}/proceso`, search: "?idUsuario=" + item.idUsuario })
                                                                }}
                                                                disabled={!this.state.edit}><i className="bi bi-pencil"></i></button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.onEventDelete(item.idUsuario )}
                                                                disabled={!this.state.remove}>
                                                                <i className="bi bi-trash">
                                                                </i></button>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-outline-info btn-sm"
                                                                title="Resetear"
                                                                onClick={() => this.openReset(item.idUsuario)}
                                                                disabled={!this.state.reset}
                                                            ><i className="bi bi-key"></i></button>
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


export default connect(mapStateToProps, null)(Usuarios);