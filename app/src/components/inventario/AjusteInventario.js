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

class AjusteInventario extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            idAjusteInventario: '',

            lista: [],
            loading: false,

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas',

        }

        this.refSearch = React.createRef();

        this.abortControllerTable = new AbortController();

    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        // this.loadInit();
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

            const result = await axios.get('/api/ajusteinventario/list', {
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

    onEventAdd() {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`
        })
    }

    onEventEdit(idAjusteInventario) {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`,
            search: "?idAjusteInventario=" + idAjusteInventario
        })
    }

    onEventDelete = (id) => {

        ModalAlertDialog("Producto", `¿Estás seguro de eliminar el producto?`, async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Producto", "Procesando información...");

                    let result = await axios.delete("/api/ajusteinventario/delete", {
                        params: {
                            "idAjusteInventario": id
                        }
                    })

                    ModalAlertSuccess("Producto", result.data, () => {
                        this.loadInit();
                    });

                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Producto", error.response.data)
                    } else {
                        ModalAlertWarning("Producto", "Se genero un error interno, intente nuevamente.")
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
                            <h5>Ajuste de Inventario <small className="text-secondary">LISTA</small></h5>
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
                                <button className="btn btn-outline-info btn-sm" onClick={() => this.onEventAdd()}>
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
                                        <th width="20%" className="p-1">Tipo Ajuste</th>
                                        <th width="20%" className="p-1">Fecha</th>
                                        <th width="20%" className="p-1">Almacen</th>
                                        <th width="35%" className="p-1">Observación</th>
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
                                                null
                                                // this.state.lista.map((item, index) => {
                                                //     return (
                                                //         <tr key={index} >
                                                //             <td className="p-1">{item.id}</td>
                                                //             <td className="p-1">
                                                //                 {item.codigo}<br />
                                                //                 {item.nombre}
                                                //             </td>
                                                //             <td className="p-1">{item.costo}</td>
                                                //             <td className="p-1">100</td>
                                                //             <td className="p-1">{item.impuesto}</td>
                                                //             <td className="text-center p-1">{item.cantidad}<br />{item.medida}</td>
                                                //             <td className="p-1">{item.almacen}</td>
                                                //             <td className="p-1">
                                                //                 <div className="d-flex">
                                                //                     <button
                                                //                         className="btn btn-outline-warning btn-sm"
                                                //                         title="Editar"
                                                //                         onClick={() => this.onEventEdit(item.idAjusteInventario)}>
                                                //                         <i className="bi bi-pencil"></i>
                                                //                     </button>
                                                //                     <button
                                                //                         className="btn btn-outline-danger btn-sm ml-1"
                                                //                         title="Eliminar"
                                                //                         onClick={() => this.onEventDelete(item.idAjusteInventario)}>
                                                //                         <i className="bi bi-trash"></i>
                                                //                     </button>
                                                //                 </div>
                                                //             </td>
                                                //         </tr>
                                                //     )
                                                // })
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


export default AjusteInventario;

