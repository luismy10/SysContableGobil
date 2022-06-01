import React from 'react';
import axios from 'axios';
import {
    numberFormat,
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

class Bancos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idBanco: '',
            nombre: '',
            tipoCuenta: '',
            idMoneda: '',
            monedas: [],
            numCuenta: '',
            cci: '',
            idUsuario: this.props.token.userToken.idUsuario,

            add: statePrivilegio(this.props.token.userToken.menus[5].submenu[2].privilegio[0].estado),
            view: statePrivilegio(this.props.token.userToken.menus[5].submenu[2].privilegio[1].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[5].submenu[2].privilegio[2].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[5].submenu[2].privilegio[3].estado),

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
        this.refTipoCuenta = React.createRef();
        this.refTxtMoneda = React.createRef();
        this.refTxtNumCuenta = React.createRef();
        this.refTxtCci = React.createRef();

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

        viewModal("modalBanco", () => {
            this.abortControllerModal = new AbortController();

            if (this.idCodigo !== "") {
                this.loadDataId(this.idCodigo);
            } else {
                this.loadData();
            }
        });

        clearModal("modalBanco", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                nombre: '',
                tipoCuenta: '',
                idMoneda: '',
                monedas: [],
                numCuenta: '',
                cci: '',
                idBanco: '',

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

            const result = await axios.get('/api/banco/list', {
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
            showModal('modalBanco')
            await this.setStateAsync({ nameModal: "Nuevo Banco", loadModal: true });
        } else {
            showModal('modalBanco')
            this.idCodigo = id;
            await this.setStateAsync({ idBanco: id, nameModal: "Editar Banco", loadModal: true });
        }
    }

    loadData = async () => {
        try {
            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortControllerModal.signal,
            });

            await this.setStateAsync({
                monedas: moneda.data,
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

    loadDataId = async (id) => {
        try {

            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortControllerModal.signal,
            });

            const banco = await axios.get("/api/banco/id", {
                signal: this.abortControllerModal.signal,
                params: {
                    idBanco: id
                }
            });

            await this.setStateAsync({
                nombre: banco.data.nombre,
                tipoCuenta: banco.data.tipoCuenta,
                idMoneda: banco.data.idMoneda,
                numCuenta: banco.data.numCuenta,
                cci: banco.data.cci,
                idBanco: banco.data.idBanco,
                monedas: moneda.data,
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
        } else if (this.state.tipoCuenta === "") {
            this.tipoCuenta.current.focus();
        } else if (this.state.idMoneda === "") {
            this.refTxtMoneda.current.focus();
        } else {
            try {
                ModalAlertInfo("Banco", "Procesando información...");
                hideModal("modalBanco");
                if (this.state.idBanco !== '') {
                    const result = await axios.post('/api/banco/update', {
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "tipoCuenta": this.state.tipoCuenta,
                        "idMoneda": this.state.idMoneda.trim().toUpperCase(),
                        "numCuenta": this.state.numCuenta.trim().toUpperCase(),
                        "cci": this.state.cci.trim().toUpperCase(),
                        "idUsuario": this.state.idUsuario,
                        "idBanco": this.state.idBanco
                    })

                    ModalAlertSuccess("Banco", result.data, () => {
                        this.onEventPaginacion();
                    });
                } else {
                    const result = await axios.post('/api/banco/add', {
                        "nombre": this.state.nombre.trim().toUpperCase(),
                        "tipoCuenta": this.state.tipoCuenta,
                        "idMoneda": this.state.idMoneda.trim().toUpperCase(),
                        "numCuenta": this.state.numCuenta.trim().toUpperCase(),
                        "cci": this.state.cci.trim().toUpperCase(),
                        "idUsuario": this.state.idUsuario,
                    });

                    ModalAlertSuccess("Banco", result.data, () => {
                        this.loadInit();
                    });
                }
            } catch (error) {
                if (error.response !== undefined) {
                    ModalAlertWarning("Banco", error.response.data)
                } else {
                    ModalAlertWarning("Banco", "Se genero un error interno, intente nuevamente.")
                }
            }
        }
    }

    onEventDelete(idBanco) {
        ModalAlertDialog("Banco", "¿Estás seguro de eliminar el banco?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Banco", "Procesando información...")
                    let result = await axios.delete('/api/banco', {
                        params: {
                            "idBanco": idBanco
                        }
                    })
                    ModalAlertSuccess("Banco", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Banco", error.response.data)
                    } else {
                        ModalAlertWarning("Banco", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                {/* Inicio modal */}
                <div className="modal fade" id="modalBanco" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{this.state.nameModal}</h5>
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

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Nombre Banco <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtNombre}
                                            value={this.state.nombre}
                                            onChange={(event) => this.setState({ nombre: event.target.value })}
                                            placeholder="BCP, BBVA, etc" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Tipo de Cuenta <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group">
                                            <select
                                                className="form-control"
                                                ref={this.refTipoCuenta}
                                                value={this.state.tipoCuenta}
                                                onChange={(event) => this.setState({ tipoCuenta: event.target.value })} >
                                                <option value="">- Seleccione -</option>
                                                <option value="1">Banco</option>
                                                <option value="2">Tarjeta</option>
                                                <option value="3">Efectivo</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Moneda <i className="fa fa-asterisk text-danger small"></i></label>
                                        <select
                                            className="form-control"
                                            ref={this.refTxtMoneda}
                                            value={this.state.idMoneda}
                                            onChange={(event) => this.setState({ idMoneda: event.target.value })}
                                        >
                                            <option value="">- Seleccione -</option>
                                            {
                                                this.state.monedas.map((item, index) => (
                                                    <option key={index} value={item.idMoneda}>{item.nombre}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Número de cuenta </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtNumCuenta}
                                            value={this.state.numCuenta}
                                            onChange={(event) => this.setState({ numCuenta: event.target.value })}
                                            placeholder="##############" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>CCI </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtCci}
                                            value={this.state.cci}
                                            onChange={(event) => this.setState({ cci: event.target.value })}
                                            placeholder="####################" />
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


                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Bancos <small className="text-secondary">LISTA</small></h5>
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
                                        <th width="10%">Nombre</th>
                                        <th width="15%">Tipo Cuenta</th>
                                        <th width="10%">Moneda</th>
                                        <th width="20%">Número Cuenta</th>
                                        <th width="10%">Saldo</th>
                                        <th width="5%" className="text-center">Mostrar</th>
                                        <th width="5%" className="text-center">Editar</th>
                                        <th width="5%" className="text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="9">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="9">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.nombre}</td>
                                                        <td>{item.tipoCuenta.toUpperCase()}</td>
                                                        <td>{item.moneda}</td>
                                                        <td>{item.numCuenta}</td>
                                                        <td className={`text-right ${item.saldo >= 0 ? "text-success" : "text-danger"}`}>{numberFormat(item.saldo, item.codiso)}</td>

                                                        <td className="text-center">
                                                            <button className="btn btn-outline-info btn-sm" title="Detalle" onClick={() => {
                                                                this.props.history.push({ pathname: `${this.props.location.pathname}/detalle`, search: "?idBanco=" + item.idBanco })
                                                            }}
                                                            disabled={!this.state.view}>
                                                                <i className="fa fa-eye"></i>
                                                            </button>
                                                        </td>

                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.openModal(item.idBanco)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Anular"
                                                                onClick={() => this.onEventDelete(item.idBanco)}
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
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(Bancos);