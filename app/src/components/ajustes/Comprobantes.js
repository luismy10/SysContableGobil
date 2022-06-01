import React from 'react';
import axios from 'axios';
import {
    keyNumberInteger,
    timeForma24,
    showModal,
    hideModal,
    viewModal,
    clearModal,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading,
    statePrivilegio
} from '../tools/Tools';
import { connect } from 'react-redux';
import Paginacion from '../tools/Paginacion';

class Comprobantes extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            idComprobante: '',
            tipo: '',
            nombre: '',
            serie: '',
            numeracion: '',
            impresion: '',
            estado: true,
            preferida: false,
            idUsuario: this.props.token.userToken.idUsuario,

            add: statePrivilegio(this.props.token.userToken.menus[5].submenu[0].privilegio[0].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[5].submenu[0].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[5].submenu[0].privilegio[2].estado),

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
        this.refTipo = React.createRef();
        this.refNombre = React.createRef();
        this.refSerie = React.createRef();
        this.refNumeracion = React.createRef();

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

        viewModal("modalComprobante", () => {
            this.abortControllerModal = new AbortController();

            if (this.idCodigo !== "") this.loadDataId(this.idCodigo);
        });

        clearModal("modalComprobante", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                idComprobante: '',
                tipo: '',
                nombre: '',
                serie: '',
                numeracion: '',
                impresion: '',
                estado: true,

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

            const result = await axios.get('/api/comprobante/list', {
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

    async openModal(id) {
        if (id === '') {
            showModal('modalComprobante')
            await this.setStateAsync({ nameModal: "Nuevo Comprobante" });
        } else {
            showModal('modalComprobante')
            this.idCodigo = id;
            await this.setStateAsync({ idComprobante: id, nameModal: "Editar Comprobante", loadModal: true });
        }
    }

    loadDataId = async (id) => {
        try {
            const result = await axios.get("/api/comprobante/id", {
                signal: this.abortControllerModal.signal,
                params: {
                    idComprobante: id
                }
            });

            await this.setStateAsync({
                idComprobante: result.data.idComprobante,
                tipo: result.data.tipo,
                nombre: result.data.nombre,
                serie: result.data.serie,
                numeracion: result.data.numeracion,
                impresion: result.data.impresion,
                estado: result.data.estado === 1 ? true : false,
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
        if (this.state.tipo === "") {
            this.refTipo.current.focus();
        } else if (this.state.nombre === "") {
            this.refNombre.current.focus();
        } else if (this.state.serie === "") {
            this.refSerie.current.focus();
        } else if (this.state.numeracion === "") {
            this.refNumeracion.current.focus();
        } else {
            try {
                ModalAlertInfo("Comprobante", "Procesando información...");
                hideModal("modalComprobante");
                if (this.state.idComprobante !== "") {
                    const result = await axios.post('/api/comprobante/edit', {
                        "tipo": this.state.tipo,
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "serie": this.state.serie.trim().toUpperCase(),
                        "numeracion": this.state.numeracion,
                        "impresion": this.state.impresion.trim(),
                        "estado": this.state.estado,
                        "preferida": this.state.preferida,
                        "idUsuario": this.state.idUsuario,
                        "idComprobante": this.state.idComprobante,
                    });

                    ModalAlertSuccess("Comprobante", result.data, () => {
                        this.onEventPaginacion();
                    });
                } else {
                    const result = await axios.post('/api/comprobante/add', {
                        "tipo": this.state.tipo,
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "serie": this.state.serie.trim().toUpperCase(),
                        "numeracion": this.state.numeracion,
                        "impresion": this.state.impresion.trim(),
                        "estado": this.state.estado,
                        "preferida": this.state.preferida,
                        "idUsuario": this.state.idUsuario
                    });

                    ModalAlertSuccess("Comprobante", result.data, () => {
                        this.loadInit();
                    });
                }
            } catch (error) {
                if (error.response !== undefined) {
                    ModalAlertWarning("Comprobante", error.response.data)
                } else {
                    ModalAlertWarning("Comprobante", "Se genero un error interno, intente nuevamente.")
                }
            }
        }
    }

    onEventDelete(idComprobante) {
        ModalAlertDialog("Comprobante", "¿Estás seguro de eliminar el comprobante?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Comprobante", "Procesando información...")
                    let result = await axios.delete('/api/comprobante', {
                        params: {
                            "idComprobante": idComprobante
                        }
                    })
                    ModalAlertSuccess("Comprobante", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Comprobante", error.response.data)
                    } else {
                        ModalAlertWarning("Comprobante", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                {/* inicio modal */}
                <div className="modal fade" id="modalComprobante" data-bs-keyboard="false" data-bs-backdrop="static">
                    <div className="modal-dialog">
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

                                <div className="form-group">
                                    <label htmlFor="estado">Tipo de Comprobante <i className="fa fa-asterisk text-danger small"></i></label>
                                    <select
                                        className="form-control"
                                        id="estado"
                                        ref={this.refTipo}
                                        value={this.state.tipo}
                                        onChange={(event) => {
                                            this.setState({ tipo: event.target.value })
                                        }}
                                    >
                                        <option value="">- Seleccione -</option>
                                        <option value="1">Facturación</option>
                                        <option value="2">Venta Libre</option>
                                        <option value="3">Nota de Crédito</option>
                                        <option value="4">Nota de Debito</option>
                                        <option value="5">Comprobante de Ingreso</option>
                                        <option value="6">Comprobante de Egreso</option>
                                        <option value="7">Cotización</option>
                                        <option value="8">Guía de Remisión</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="nombre" className="col-form-label">Nombre <i className="fa fa-asterisk text-danger small"></i></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ingresar el nombre del comprobante"
                                        id="nombre"
                                        ref={this.refNombre}
                                        value={this.state.nombre}
                                        onChange={(event) => this.setState({ nombre: event.target.value })} />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="serie">Serie <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="serie"
                                            placeholder={"B001, F001"}
                                            ref={this.refSerie}
                                            value={this.state.serie}
                                            onChange={(event) => this.setState({ serie: event.target.value })} />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="numeracion">Numeración <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="numeracion"
                                            placeholder={"1, 2, 3"}
                                            ref={this.refNumeracion}
                                            value={this.state.numeracion}
                                            onChange={(event) => this.setState({ numeracion: event.target.value })}
                                            onKeyPress={keyNumberInteger} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="impresion" className="col-form-label">Nombre de Impresión:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="impresion"
                                        value={this.state.impresion}
                                        onChange={(event) => this.setState({ impresion: event.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="cbEstado"
                                                checked={this.state.estado}
                                                onChange={(value) => this.setState({ estado: value.target.checked })} />
                                            <label className="custom-control-label" htmlFor="cbEstado">Activo o Inactivo</label>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-6">
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="cbPreferido"
                                                checked={this.state.preferida}
                                                onChange={(value) => this.setState({ preferida: value.target.checked })} />
                                            <label className="custom-control-label" htmlFor="cbPreferido">Preferido</label>
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
                {/* fin modal */}

                <div className="row">
                    <div className="col-md-12">
                        <div className="form-group">
                            <h5>Comprobantes <small className="text-secondary">LISTA</small></h5>
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
                    <div className="col-md-12 col-sm-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="5%" className="text-center">#</th>
                                        <th width="20%" >Tipo Comprobante</th>
                                        <th width="20%" >Nombre</th>
                                        <th width="10%" >Serie</th>
                                        <th width="10%" >Numeración</th>
                                        <th width="10%" >Creación</th>
                                        <th width="10%" >Preferida</th>
                                        <th width="10%" >Estado</th>
                                        <th width="5%" className="text-center">Edición</th>
                                        <th width="5%" className="text-center">Anular</th>
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
                                            <tr>
                                                <td className="text-center" colSpan="10">¡No hay comprobantes registrados!</td>
                                            </tr>
                                        ) :
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.tipo.toUpperCase()}</td>
                                                        <td>{item.nombre}</td>
                                                        <td>{item.serie}</td>
                                                        <td>{item.numeracion}</td>
                                                        <td>{<span>{item.fecha}</span>}{<br></br>}{<span>{timeForma24(item.hora)}</span>}</td>
                                                        <td className="text-center">
                                                            <div>
                                                                {item.preferida === 1 ? "Si" : "No"}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>
                                                                {item.estado === 1 ? "ACTIVO" : "INACTIVO"}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.openModal(item.idComprobante)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Anular"
                                                                onClick={() => this.onEventDelete(item.idComprobante)}
                                                                disabled={!this.state.remove}>
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
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

export default connect(mapStateToProps, null)(Comprobantes);