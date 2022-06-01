import React from 'react';
import axios from 'axios';
import {
    isNumeric,
    spinnerLoading,
    timeForma24,
    formatMoney,
    showModal,
    hideModal,
    viewModal,
    clearModal,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../tools/Tools';
import { connect } from 'react-redux';
import Paginacion from '../tools/Paginacion';

class Ventas extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idCliente: '',
            idUsuario: this.props.token.userToken.idUsuario,
            idMoneda: '',
            idBanco: '',
            idVenta: '',
            cliente: '',
            moneda: '',
            metodoPago: '',
            observacion: '',
            total: '0.00',
            cobrado: '0.00',
            porCobrar: '0.00',
            valorRecibido: '',
            bancos: [],

            loadModal: false,
            nameModal: 'Nuevo Cobro',
            messageWarning: '',
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
        this.refBanco = React.createRef();
        this.refMetodoPago = React.createRef();
        this.refValorRecibido = React.createRef();

        this.refTxtSearch = React.createRef();

        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.loadInit();

        viewModal("modalCobro", () => {
            this.abortControllerModal = new AbortController();

            this.loadData()
        });

        clearModal("modalCobro", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                idCliente: '',
                idMoneda: '',
                idBanco: '',
                idVenta: '',
                cliente: '',
                moneda: '',
                metodoPago: '',
                observacion: '',
                total: '0.00',
                cobrado: '0.00',
                porCobrar: '0.00',
                valorRecibido: '',
                bancos: [],

                loadModal: false,
                nameModal: 'Nuevo Cobro',
                messageWarning: '',
                msgModal: 'Cargando datos...',
            });
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

            const result = await axios.get('/api/factura/list', {
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

    onEventNuevaVenta = () => {
        this.props.history.push(`${this.props.location.pathname}/proceso`);
    }

    async openModalCobro(item) {
        showModal("modalCobro")
        await this.setStateAsync({
            nameModal: "Nuevo Cobro " + item.serie + "-" + item.numeracion,
            loadModal: true,
            idCliente: item.idCliente,
            idMoneda: item.idMoneda,
            idVenta: item.idVenta,
            cliente: item.informacion,
            moneda: item.simbolo,
        });
    }

    loadData = async () => {
        try {
            const banco = await axios.get("/api/banco/listcombo", {
                signal: this.abortControllerModal.signal,
            });

            const cobro = await axios.get("/api/cobro/cobroventa", {
                signal: this.abortControllerModal.signal,
                params: {
                    idVenta: this.state.idVenta,
                }
            });

            await this.setStateAsync({
                bancos: banco.data,
                total: formatMoney(cobro.data.venta),
                cobrado: formatMoney(cobro.data.cobrado),
                porCobrar: formatMoney(cobro.data.venta - cobro.data.cobrado),
                loadModal: false
            });
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgModal: "Se produjo un error interno, intente nuevamente"
                })
            }
        }
    }

    async onEventCobrar() {
        if (this.state.idBanco === "") {
            await this.setStateAsync({ messageWarning: "Seleccione la cuenta de destino." });
            this.refBanco.current.focus();
            return;
        }

        if (this.state.metodoPago === "") {
            await this.setStateAsync({ messageWarning: "Seleccione el metodo de pago." });
            this.refMetodoPago.current.focus();
            return;
        }


        if (!isNumeric(this.state.valorRecibido)) {
            await this.setStateAsync({ messageWarning: "Ingrese el valor recibido." });
            this.refValorRecibido.current.focus();
            return;
        }

        try {
            ModalAlertInfo("Cobro", "Procesando información...")
            hideModal("modalCobro");
            let result = await axios.post("/api/cobro/cobro", {
                "idCliente": this.state.idCliente,
                "idUsuario": this.state.idUsuario,
                'idMoneda': this.state.idMoneda,
                "idBanco": this.state.idBanco,
                "idVenta": this.state.idVenta,
                "metodoPago": this.state.metodoPago,
                "estado": 1,
                "observacion": this.state.observacion.trim().toUpperCase(),
                "valorRecibido": this.state.valorRecibido
            })
            ModalAlertSuccess("Cobro", result.data, () => {
                this.onEventPaginacion();
            });
        } catch (error) {
            ModalAlertWarning("Cobro", "Se produjo un error un interno, intente nuevamente.")
        }
    }

    render() {
        return (
            <>

                {/* Inicio modal */}
                <div className="modal fade" id="modalCobro" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">{this.state.nameModal}</h6>
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

                                {
                                    this.state.messageWarning === '' ? null :
                                        <div className="alert alert-warning" role="alert">
                                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                        </div>
                                }

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Cliente:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Información..."
                                            value={this.state.cliente}
                                            disabled />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Cuenta bancaria:</label>
                                        <div className="input-group">
                                            <select
                                                className="form-control"
                                                ref={this.refBanco}
                                                value={this.state.idBanco}
                                                onChange={(event) => {
                                                    if (event.target.value.length > 0) {
                                                        this.setState({
                                                            idBanco: event.target.value,
                                                            messageWarning: ''
                                                        })
                                                    } else {
                                                        this.setState({
                                                            idBanco: event.target.value,
                                                            messageWarning: 'Seleccione la cuenta de destino.'
                                                        })
                                                    }
                                                }}>
                                                <option value="">- Seleccione -</option>
                                                {
                                                    this.state.bancos.map((item, index) => (
                                                        <option key={index} value={item.idBanco}>{item.nombre + " - " + item.tipoCuenta}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Metodo de pago:</label>
                                        <select
                                            className="form-control"
                                            ref={this.refMetodoPago}
                                            value={this.state.metodoPago}
                                            onChange={(event) => {
                                                if (event.target.value.length > 0) {
                                                    this.setState({
                                                        metodoPago: event.target.value,
                                                        messageWarning: ''
                                                    })
                                                } else {
                                                    this.setState({
                                                        metodoPago: event.target.value,
                                                        messageWarning: "Seleccione el metodo de pago."
                                                    })
                                                }
                                            }}
                                        >
                                            <option value="">- Seleccione -</option>
                                            <option value="1">Efectivo</option>
                                            <option value="2">Consignación</option>
                                            <option value="3">Transferencia</option>
                                            <option value="4">Cheque</option>
                                            <option value="5">Tarjeta crédito</option>
                                            <option value="6">Tarjeta débito</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Moneda:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="..."
                                            value={this.state.moneda}
                                            disabled />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <label>Observación:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese alguna observación..."
                                            value={this.state.observacion}
                                            onChange={(event) => this.setState({ observacion: event.target.value })} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-3">
                                        <label>Total:</label>
                                        <span
                                            readOnly
                                            className="form-control"
                                        >{this.state.total}</span>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <label>Cobrado:</label>
                                        <span
                                            readOnly
                                            className="form-control text-success"
                                        >{this.state.cobrado}</span>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <label>Por cobrar:</label>
                                        <span
                                            readOnly
                                            className="form-control text-danger"
                                        >{this.state.porCobrar}</span>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <label>Valor recibido:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="0.00"
                                            ref={this.refValorRecibido}
                                            value={this.state.valorRecibido}
                                            onChange={(event) => {
                                                if (event.target.value.length > 0) {
                                                    this.setState({
                                                        valorRecibido: event.target.value,
                                                        messageWarning: ""
                                                    })
                                                } else {
                                                    this.setState({
                                                        valorRecibido: event.target.value,
                                                        messageWarning: "Ingrese el valor recibido."
                                                    })
                                                }
                                            }} />
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventCobrar()}>Guardar</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal */}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Ventas <small className="text-secondary">LISTA</small></h5>
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
                            <button className="btn btn-outline-info" onClick={this.onEventNuevaVenta}>
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
                                        <th width="5%">#</th>
                                        <th width="15%">Cliente</th>
                                        <th width="10%">Comprobante</th>
                                        <th width="10%">Fecha</th>
                                        <th width="10%">Tipo</th>
                                        <th width="10%">Total</th>
                                        <th width="10%">Estado</th>
                                        <th width="5%" className="text-center">Detalle</th>
                                        <th width="5%" className="text-center">Abonar</th>
                                        <th width="5%" className="text-center">Editar</th>
                                        <th width="5%" className="text-center">Anular</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="11">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="11">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{item.id}</td>
                                                        <td>{item.documento}{<br />}{item.informacion}</td>
                                                        <td>{item.comprobante}{<br />}{item.serie + "-" + item.numeracion}</td>
                                                        <td>{<span>{item.fecha}</span>}{<br></br>}{<span>{timeForma24(item.hora)}</span>}</td>
                                                        <td className="text-center">
                                                            {item.tipo === 1
                                                                ? <span>Contado</span>
                                                                : <span>Crédito</span>}
                                                        </td>
                                                        <td>{item.simbolo + " " + formatMoney(item.total)}</td>
                                                        <td className="text-center">
                                                            {
                                                                item.estado === 1
                                                                    ? <span className="text-success">Cobrado</span>
                                                                    : <span className="text-danger">Por Cobrar</span>
                                                            }
                                                        </td>
                                                        <td className="text-center">
                                                            <button className="btn btn-outline-primary btn-sm" title="Ver detalle" onClick={() => {
                                                                this.props.history.push({ pathname: `${this.props.location.pathname}/detalle`, search: "?idVenta=" + item.idVenta })
                                                            }}><i className="fa fa-eye"></i></button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button className="btn btn-outline-success btn-sm" disabled={item.estado === 1 ? true : false} title="Agregar pago" onClick={() => {
                                                                this.openModalCobro(item)
                                                            }}><i className="fa fa-money"></i></button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button className="btn btn-outline-warning btn-sm" disabled={item.estado === 1 ? true : false} title="Editar" onClick={() => { }}><i className="fa fa-edit"></i></button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button className="btn btn-outline-danger btn-sm" disabled={item.estado === 1 ? true : false} title="Anular" onClick={() => { }}><i className="fa fa-remove"></i></button>
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

export default connect(mapStateToProps, null)(Ventas);