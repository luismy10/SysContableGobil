import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    ModalAlertDialog
} from '../tools/Tools';
import Paginacion from '../tools/Paginacion';

class Asientos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lista: [],
            loading: true,

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas'
        }

        this.refSearch = React.createRef()

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
        await this.setStateAsync({ paginacion: 1 });
        this.fillTable(0, "");
        await this.setStateAsync({ opcion: 0 });
    }

    fillTable = async (opcion, buscar) => {
        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get('/api/asiento/list', {
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

    async searchText(text) {

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

    render() {
        return (
            <>
                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Asientos contables <small className="text-secondary">LISTA</small></h5>
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
                                    placeholder="Buscar por correlativo"
                                    ref={this.refSearch}
                                    onKeyUp={(event) => this.searchText(event.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <div className="input-group">
                                <button className="btn btn-outline-info btn-sm" onClick={() => this.props.history.push(`${this.props.location.pathname}/proceso`)}>
                                    <i className="bi bi-file-plus"></i> Nuevo Registro
                                </button>
                                <button className="btn btn-outline-secondary btn-sm ml-1" onClick={() => this.loadInit()}>
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
                                        <th width="10%" className="p-1">Correlativo</th>
                                        <th width="10%" className="p-1">Fecha</th>
                                        <th width="60%" className="p-1">Observacines</th>
                                        <th width="10%" className="p-1">Estado</th>
                                        <th width="10%" className="p-1">Total</th>
                                        <th width="auto" className="p-1 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center p-1" colSpan="7">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="7" className="p-1">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (

                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index} style={{ "fontSize": "12px" }}>
                                                        <td className="p-1">{item.correlativo}</td>
                                                        <td className="p-1">{item.fecha}</td>
                                                        <td className="p-1">{item.observacion === '' ? 'NINGUNA' : item.observacion}</td>
                                                        <td className="text-center p-1">
                                                            <span className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>
                                                                {item.estado === 1 ? "PROCESADO" : "ANULADO"}
                                                            </span>
                                                        </td>
                                                        <td className="text-right p-1">{item.total}</td>
                                                        <td className="d-flex p-1">
                                                            <button
                                                                className="btn btn-outline-primary btn-sm"
                                                                title="Ver detalle"
                                                                onClick={() => {
                                                                    this.props.history.push({ pathname: `${this.props.location.pathname}/detalle`, search: "?idAsiento=" + item.idAsiento })
                                                                }}>
                                                                <i className="fa fa-eye"></i>
                                                            </button>
                                                            <button className="btn btn-outline-danger btn-sm ml-1" title="Editar" onClick={() => this.onEventEliminar(item.idAsiento)}><i className="bi bi-trash"></i></button>
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

export default Asientos