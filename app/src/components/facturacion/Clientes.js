import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import {
    spinnerLoading,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    ModalAlertDialog,
    statePrivilegio
} from '../tools/Tools';
import Paginacion from '../tools/Paginacion';

class Clientes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            lista: [],

            add: statePrivilegio(this.props.token.userToken.menus[2].submenu[0].privilegio[0].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[2].submenu[0].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[2].submenu[0].privilegio[2].estado),

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas'
        }
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

            const result = await axios.get('/api/cliente/list', {
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

    onEventAdd() {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`
        })
    }

    onEventEdit(idCliente) {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`,
            search: "?idCliente=" + idCliente
        })
    }

    onEventDelete(idCliente) {
        ModalAlertDialog("Eliminar cliente", "¿Está seguro de que desea eliminar el contacto? Esta operación no se puede deshacer.", async (value) => {
            if (value) {
                try {
                    ModalAlertInfo("Cliente", "Procesando información...")
                    let result = await axios.delete('/api/cliente', {
                        params: {
                            "idCliente": idCliente
                        }
                    })
                    ModalAlertSuccess("Cliente", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Cliente", error.response.data)
                    } else {
                        ModalAlertWarning("Cliente", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    updatePredeterminado = async (id, predeterminado) => {

        if(predeterminado === 1){
            ModalAlertSuccess("Cliente", "Este cliente ya es predeterminado", (event)=>{});
            return;
        } 

        ModalAlertDialog("Cliente", `¿Estás seguro de actulizar a predeterminado el cliente`, async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Cliente", "Procesando información...");

                    let result = await axios.post("/api/cliente/predeterminado", {
                        "idCliente": id
                    })

                    ModalAlertSuccess("Cliente", result.data, () => {
                        this.loadInit();
                    });

                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Cliente", error.response.data)
                    } else {
                        ModalAlertWarning("Cliente", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Clientes <small className="text-secondary">LISTA</small></h5>
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
                                    type="search"
                                    className="form-control"
                                    placeholder="Buscar..."
                                    ref={this.refTxtSearch}
                                    onKeyUp={(event) => this.searchText(event.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <div className="form-group">
                                <button className="btn btn-outline-secondary btn-sm" title="Recargar" onClick={() => this.loadInit()}>
                                    <i className="bi bi-arrow-clockwise"></i>
                                </button>
                                {" "}
                                <button className="btn btn-outline-info btn-sm" onClick={() => this.onEventAdd()} disabled={!this.state.add}>
                                    <i className="bi bi-file-plus"></i> Nuevo Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-hover table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="5%" className="p-1">#</th>
                                        <th width="15%" className="p-1">DNI / RUC</th>
                                        <th width="20%" className="p-1">Cliente</th>
                                        <th width="10%" className="p-1">Cel. / Tel.</th>
                                        <th width="30%" className="p-1">Dirección</th>
                                        <th width="10%" className="p-1">Estado</th>
                                        <th width="10%" className="p-1">Predeterminado</th>
                                        <th width="auto" className="text-center p-1">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody style={{'fontSize': '12px'}}>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center p-1" colSpan="8">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td className="p-1" colSpan="8">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="p-1">{item.id}</td>
                                                        <td className="p-1">{item.tipodocumento}<br />{item.documento}</td>
                                                        <td className="p-1">{item.informacion}</td>
                                                        <td className="p-1">{item.celular}{<br />}{item.telefono}</td>
                                                        <td className="p-1">{item.direccion}</td>
                                                        <td className="text-center p-1">
                                                            <div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>
                                                                {item.estado === 1 ? "ACTIVO" : "INACTIVO"}
                                                            </div>
                                                        </td>
                                                        <td className="text-center p-1">
                                                            <span role="button" onClick={() => this.updatePredeterminado(item.idCliente, item.predeterminado)}>
                                                                <i className={`bi ${item.predeterminado === 1 ? 'bi-toggle-on text-primary' : 'bi-toggle-off text-secondary'} h4`}></i>
                                                            </span>
                                                        </td>
                                                        <td className="p-1">
                                                            <div className="d-flex">
                                                                <button
                                                                    className="btn btn-outline-warning btn-sm"
                                                                    title="Editar"
                                                                    onClick={() => this.onEventEdit(item.idCliente)}
                                                                    disabled={!this.state.edit}>
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm ml-1"
                                                                    title="Eliminar"
                                                                    onClick={() => this.onEventDelete(item.idCliente)}
                                                                    disabled={!this.state.remove}>
                                                                    <i className="bi bi-trash">
                                                                    </i>
                                                                </button>
                                                            </div>
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


export default connect(mapStateToProps, null)(Clientes);