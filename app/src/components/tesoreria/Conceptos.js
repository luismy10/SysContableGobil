import React from 'react';
import axios from 'axios';
import {
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

class Conceptos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idConcepto: '',
            nombre: '',
            tipo: '',
            codigo: '',
            idUsuario: this.props.token.userToken.idUsuario,

            loadModal: false,
            nameModal: 'Nuevo Comprobante',
            messageWarning: '',
            msgModal: 'Cargando datos...',

            add: statePrivilegio(this.props.token.userToken.menus[4].submenu[0].privilegio[0].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[4].submenu[0].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[4].submenu[0].privilegio[2].estado),

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

        viewModal("modalConcepto", () => {
            this.abortControllerModal = new AbortController();

            if (this.idCodigo !== "") this.loadDataId(this.idCodigo);
        });

        clearModal("modalConcepto", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                nombre: '',
                tipo: '',
                codigo: '',
                idConcepto: '',

                loadModal: false,
                nameModal: 'Nuevo Concepto',
                messageWarning: '',
                msgModal: 'Cargando datos...',
            })
            this.idCodigo = "";
        })
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

            const result = await axios.get('/api/concepto/list', {
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
        if (id === "") {
            showModal('modalConcepto');
            await this.setStateAsync({ nameModal: "Nuevo Concepto" });
        } else {
            showModal('modalConcepto');
            this.idCodigo = id;
            await this.setStateAsync({ idConcepto: id, nameModal: "Editar Concepto", loadModal: true });
        }
    }

    loadDataId = async (id) => {
        try {
            const result = await axios.get("/api/concepto/id", {
                signal: this.abortControllerModal.signal,
                params: {
                    idConcepto: id
                }
            });

            await this.setStateAsync({
                nombre: result.data.nombre,
                tipo: result.data.tipo,
                idConcepto: result.data.idConcepto,
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
            this.setState({ messageWarning: "Ingrese el nombre del concepto" });
            this.refNombre.current.focus();
        } else if (this.state.tipo === "") {
            this.setState({ messageWarning: "Seleccione el concepto" })
            this.tipo.current.focus();
        } else {
            try {
                ModalAlertInfo("Concepto", "Procesando información...");
                hideModal("modalConcepto");
                if (this.state.idConcepto !== '') {
                    const result = await axios.post('/api/concepto/update', {
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "tipo": this.state.tipo,
                        "codigo": this.state.codigo,
                        "idUsuario": this.state.idUsuario,
                        "idConcepto": this.state.idConcepto
                    })

                    ModalAlertSuccess("Concepto", result.data, () => {
                        this.onEventPaginacion();
                    });
                } else {
                    const result = await axios.post('/api/concepto/add', {
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "tipo": this.state.tipo,
                        "codigo": this.state.codigo,
                        "idUsuario": this.state.idUsuario,
                    });

                    ModalAlertSuccess("Concepto", result.data, () => {
                        this.loadInit();
                    });
                }
            } catch (error) {
                ModalAlertWarning("Concepto", "Se produjo un error un interno, intente nuevamente.");
            }
        }
    }

    onEventDelete(idConcepto) {
        ModalAlertDialog("Concepto", "¿Estás seguro de eliminar el concepto?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Moneda", "Procesando información...")
                    let result = await axios.delete('/api/concepto', {
                        params: {
                            "idConcepto": idConcepto
                        }
                    })
                    ModalAlertSuccess("Concepto", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Concepto", error.response.data)
                    } else {
                        ModalAlertWarning("Concepto", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                {/* Inicio modal */}
                <div className="modal fade" id="modalConcepto" data-backdrop="static">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">{this.state.nameModal}</h6>
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
                                        <label>Concepto</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.nombre}
                                            ref={this.refNombre}
                                            onChange={(event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    this.setState({
                                                        nombre: event.target.value,
                                                        messageWarning: '',
                                                    });
                                                } else {
                                                    this.setState({
                                                        nombre: event.target.value,
                                                        messageWarning: 'Ingrese el nombre del concepto',
                                                    });
                                                }
                                            }}
                                            placeholder="Ingrese el nombre del concepto" />
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label>Tipo de Concepto:</label>
                                        <div className="input-group">
                                            <select
                                                className="form-control"
                                                value={this.state.tipo}
                                                ref={this.refTipo}
                                                onChange={(event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        this.setState({
                                                            tipo: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            tipo: event.target.value,
                                                            messageWarning: 'Seleccione el concepto',
                                                        });
                                                    }
                                                }}>
                                                <option value="">-- Seleccione --</option>
                                                <option value="1">CONCEPTO DE GASTO</option>
                                                <option value="2">CONCEPTO DE COBRO</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label>Código:</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={this.state.codigo}
                                                onChange={(event) => this.setState({ codigo: event.target.value })}
                                                placeholder="Código" />
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Aceptar</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal */}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Conceptos <small className="text-secondary">LISTA</small></h5>
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
                                        <th width="25%">Concepto</th>
                                        <th width="20%">Tipo Concepto</th>
                                        <th width="10%">Creacion</th>
                                        <th width="5%" className="text-center">Editar</th>
                                        <th width="5%" className="text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="6">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="6">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.nombre}</td>
                                                        <td>{item.tipo === 1 ? 'CONCEPTO DE GASTO' : 'CONCEPTO DE COBRO'}</td>
                                                        <td>{item.fecha}{<br />}{timeForma24(item.hora)}</td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.openModal(item.idConcepto)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Anular"
                                                                onClick={() => this.onEventDelete(item.idConcepto)}
                                                                disabled={!this.state.remove}>
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
        )
    }
}
const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(Conceptos);