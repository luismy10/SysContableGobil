import React from 'react';
import axios from 'axios';
import {
    numberFormat,
    spinnerLoading
} from '../../tools/Tools';
import Paginacion from '../../tools/Paginacion';

class ModalProductos extends React.Component {

    constructor(props) {
        super(props); 
        this.state = { 
            
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

        this.refSearch = React.createRef()
        this.abortControllerModal = new AbortController()

    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.loadInit();
    }

    componentWillUnmount() {
        this.abortControllerModal.abort();
    }

    loadInit = async () => {
        if (this.state.loadModalTable) return;

        await this.setStateAsync({ paginacion: 1 });
        this.fillTable(0, "");
        await this.setStateAsync({ opcion: 0 });
    }

    fillTable = async (opcion, buscar) => {

        try {
            await this.setStateAsync({ loadModalTable: true, lista: [], msgModalTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get('/api/producto/listprodalmacen', {
                signal: this.abortControllerModal.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar,
                    "idAlmacen": this.props.idAlmacen,
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

    async searchText(text) {
        if (this.state.loadModalTable) return;

        if (text.trim().length === 0) return;

        await this.setStateAsync({ paginacion: 1 });
        this.fillTable(1, text.trim());
        await this.setStateAsync({ opcion: 1 });
    }

    render() {
        return (
            <div className="modal fade" id={this.props.idModal} data-bs-keyboard="false" data-bs-backdrop="static">
                <div className={`modal-dialog ${this.props.sizeModal}`}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{this.props.titleModal}</h5>
                            <button type="button" className="close" onClick={ ()=>this.props.closeProductosModal()}>
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
                                    <table className="table table-striped table-hover table-bordered rounded">
                                        <thead>
                                            <tr>
                                                <th width="5%" className="p-1">#</th>
                                                <th width="55%" className="p-1">Nombre</th>
                                                <th width="10%" className="p-1">Cantidad</th>
                                                <th width="10%" className="p-1">Impuesto</th>
                                                <th width="10%" className="p-1">Costo</th>
                                                <th width="10%" className="p-1">Precio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                this.state.loadModalTable ? (
                                                    <tr>
                                                        <td className="text-center p-1" colSpan="6">
                                                            {spinnerLoading(this.state.msgModalTable)}
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
                                                                <tr key={item.idProducto} onClick={() => this.props.addObjectTable(item)}>
                                                                    <td className="p-1">{++index}</td>
                                                                    <td className="p-1">{item.codigo}<br />{item.nombre}</td>
                                                                    <td className="p-1">{item.cantidad}<br />{item.medida}</td>
                                                                    <td className="p-1">{item.impuesto}</td>
                                                                    <td className="p-1">{numberFormat(item.costo)}</td>
                                                                    <td className="p-1">{numberFormat(item.precio)}</td>
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
                            <button type="button" className="btn btn-danger" onClick={() => this.props.closeProductosModal()}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ModalProductos;