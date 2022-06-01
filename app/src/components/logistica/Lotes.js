import React from 'react';
import axios from 'axios';
import {
    isNumeric,
    keyNumberFloat,
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

class Lotes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idLote: '',
            idManzana: '',
            manzanas: [],
            idConcepto: '',
            conceptos: [],
            descripcion: '',
            costo: '',
            precio: '',
            estado: '',
            medidaFrontal: '',
            costadoDerecho: '',
            costadoIzquierdo: '',
            medidaFondo: '',
            areaLote: '',
            numeroPartida: '',
            limiteFrontal: '',
            limiteDerecho: '',
            limiteIzquierdo: '',
            limitePosterior: '',
            ubicacionLote: '',
            idProyecto: this.props.token.project.idProyecto,
            idUsuario: this.props.token.userToken.idUsuario,

            add: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[0].estado),
            view: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[1].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[2].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[3].estado),

            loadModal: false,
            nameModal: 'Nuevo Lote',
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
        this.refManzana = React.createRef();
        this.refConcepto = React.createRef();
        this.refDescripcion = React.createRef();
        this.refCosto = React.createRef();
        this.refPrecio = React.createRef();
        this.refEstado = React.createRef();

        this.refMedidaFrontal = React.createRef();
        this.refCostadoDerecho = React.createRef();
        this.refCostadoIzquiero = React.createRef();
        this.refMedidaFondo = React.createRef();
        this.refAreaLote = React.createRef();
        this.refNumeroPartida = React.createRef();

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

        viewModal("modalLote", () => {
            this.abortControllerModal = new AbortController();

            if (this.idCodigo !== "") {
                this.loadDataId(this.idCodigo);
            } else {
                this.loadData();
            }
        });

        clearModal("modalLote", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                idLote: '',
                idManzana: '',
                manzanas: [],
                idConcepto: '',
                conceptos: [],
                descripcion: '',
                costo: '',
                precio: '',
                estado: '',
                medidaFrontal: '',
                costadoDerecho: '',
                costadoIzquierdo: '',
                medidaFondo: '',
                areaLote: '',
                numeroPartida: '',
                limiteFrontal: '',
                limiteDerecho: '',
                limiteIzquierdo: '',
                limitePosterior: '',
                ubicacionLote: '',

                loadModal: false,
                nameModal: 'Nuevo Comprobante',
                msgModal: 'Cargando datos...',
            });
            this.onFocusTab("info-tab", "info");
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

            const result = await axios.get('/api/lote/list', {
                params: {
                    "idProyecto": this.state.idProyecto,
                    "opcion": opcion,
                    "buscar": buscar.trim(),
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
            showModal('modalLote');
            await this.setStateAsync({ nameModal: "Nuevo Lote", loadModal: true });
        } else {
            showModal('modalLote');
            this.idCodigo = id;
            await this.setStateAsync({ idLote: id, nameModal: "Editar Lote", loadModal: true });
        }
    }

    async loadData() {
        try {
            let manzana = await axios.get('/api/manzana/listcombo', {
                signal: this.abortControllerModal.signal,
            });

            const concepto = await axios.get("/api/concepto/listcombo", {
                signal: this.abortControllerModal.signal,
            });

            await this.setStateAsync({
                manzanas: manzana.data,
                conceptos: concepto.data,
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

    async loadDataId(id) {
        try {
            let manzana = await axios.get('/api/manzana/listcombo', {
                signal: this.abortControllerModal.signal,
            });

            const concepto = await axios.get("/api/concepto/listcombo", {
                signal: this.abortControllerModal.signal,
            });

            let result = await axios.get('/api/lote/id', {
                signal: this.abortControllerModal.signal,
                params: {
                    "idLote": id
                }
            });
            await this.setStateAsync({
                idLote: result.data.idLote,
                idManzana: result.data.idManzana,
                idConcepto: result.data.idConcepto,
                descripcion: result.data.descripcion,
                costo: result.data.costo.toString(),
                precio: result.data.precio.toString(),
                estado: result.data.estado,
                medidaFrontal: result.data.medidaFrontal,
                costadoDerecho: result.data.costadoDerecho,
                costadoIzquierdo: result.data.costadoIzquierdo,
                medidaFondo: result.data.medidaFondo,
                areaLote: result.data.areaLote,
                numeroPartida: result.data.numeroPartida,
                limiteFrontal: result.data.limiteFrontal,
                limiteDerecho: result.data.limiteDerecho,
                limiteIzquierdo: result.data.limiteIzquierdo,
                limitePosterior: result.data.limitePosterior,
                ubicacionLote: result.data.ubicacionLote,

                manzanas: manzana.data,
                conceptos: concepto.data,

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
        if (this.state.idManzana === "") {
            this.onFocusTab("info-tab", "info");
            this.refManzana.current.focus();
        } else if (this.state.descripcion === "") {
            this.onFocusTab("info-tab", "info");
            this.refDescripcion.current.focus();
        } else if (!isNumeric(this.state.costo)) {
            this.onFocusTab("info-tab", "info");
            this.refCosto.current.focus();
        } else if (!isNumeric(this.state.precio)) {
            this.onFocusTab("info-tab", "info");
            this.refPrecio.current.focus();
        } else if (this.state.estado === "") {
            this.onFocusTab("info-tab", "info");
            this.refEstado.current.focus();
        }
        else {
            try {
                ModalAlertInfo("Lote", "Procesando información...");
                hideModal("modalLote");
                if (this.state.idLote !== '') {
                    let result = await axios.put("/api/lote", {
                        "idLote": this.state.idLote,
                        "idManzana": this.state.idManzana,
                        "descripcion": this.state.descripcion.trim().toUpperCase(),
                        "costo": this.state.costo,
                        "precio": this.state.precio,
                        "estado": this.state.estado,
                        "medidaFrontal": this.state.medidaFrontal,
                        "costadoDerecho": this.state.costadoDerecho,
                        "costadoIzquierdo": this.state.costadoIzquierdo,
                        "medidaFondo": this.state.medidaFondo,
                        "areaLote": this.state.areaLote,
                        "numeroPartida": this.state.numeroPartida,
                        "limiteFrontal": this.state.limiteFrontal,
                        "limiteDerecho": this.state.limiteDerecho,
                        "limiteIzquierdo": this.state.limiteIzquierdo,
                        "limitePosterior": this.state.limitePosterior,
                        "ubicacionLote": this.state.ubicacionLote,
                        "idUsuario": this.state.idUsuario
                    });

                    ModalAlertSuccess("Lote", result.data, () => {
                        this.onEventPaginacion();
                    });
                } else {
                    let result = await axios.post("/api/lote", {
                        "idManzana": this.state.idManzana,
                        "descripcion": this.state.descripcion.trim().toUpperCase(),
                        "costo": this.state.costo,
                        "precio": this.state.precio,
                        "estado": this.state.estado,
                        "medidaFrontal": this.state.medidaFrontal,
                        "costadoDerecho": this.state.costadoDerecho,
                        "costadoIzquierdo": this.state.costadoIzquierdo,
                        "medidaFondo": this.state.medidaFondo,
                        "areaLote": this.state.areaLote,
                        "numeroPartida": this.state.numeroPartida,
                        "limiteFrontal": this.state.limiteFrontal,
                        "limiteDerecho": this.state.limiteDerecho,
                        "limiteIzquierdo": this.state.limiteIzquierdo,
                        "limitePosterior": this.state.limitePosterior,
                        "ubicacionLote": this.state.ubicacionLote,
                        "idUsuario": this.state.idUsuario
                    });

                    ModalAlertSuccess("Lote", result.data, () => {
                        this.loadInit();
                    });
                }
            } catch (error) {
                ModalAlertWarning("Lote", "Se produjo un error un interno, intente nuevamente.");
            }
        }
    }

    onFocusTab(idTab, idContent) {
        if (!document.getElementById(idTab).classList.contains('active')) {
            for (let child of document.getElementById('myTab').childNodes) {
                child.childNodes[0].classList.remove('active')
            }
            for (let child of document.getElementById('myTabContent').childNodes) {
                child.classList.remove('show', 'active')
            }
            document.getElementById(idTab).classList.add('active');
            document.getElementById(idContent).classList.add('show', 'active');
        }
    }

    onEventMostrar(idLote) {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/detalle`,
            search: "?idLote=" + idLote
        })
    }

    onEventDelete(idLote) {
        ModalAlertDialog("Lote", "¿Estás seguro de eliminar el lote?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Lote", "Procesando información...")
                    let result = await axios.delete('/api/lote', {
                        params: {
                            "idLote": idLote
                        }
                    })
                    ModalAlertSuccess("Lote", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Lote", error.response.data)
                    } else {
                        ModalAlertWarning("Lote", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                {/* Inicio modal nuevo cliente*/}
                <div className="modal fade" id="modalLote" tabIndex="-1" aria-labelledby="modalLoteLabel" aria-hidden="true">
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
                                    : null
                                }

                                {
                                    this.state.messageWarning === '' ? null :
                                        <div className="alert alert-warning" role="alert">
                                            <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                        </div>
                                }

                                <ul className="nav nav-tabs" id="myTab" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <a className="nav-link active" id="info-tab" data-bs-toggle="tab" href="#info" role="tab" aria-controls="info" aria-selected="true">
                                            <i className="bi bi-info-circle"></i> Descripcion
                                        </a>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <a className="nav-link" id="medida-tab" data-bs-toggle="tab" href="#medida" role="tab" aria-controls="medida" aria-selected="false">
                                            <i className="bi bi-aspect-ratio"></i> Medidas
                                        </a>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <a className="nav-link" id="limite-tab" data-bs-toggle="tab" href="#limite" role="tab" aria-controls="limite" aria-selected="false">
                                            <i className="bi bi-pip"></i> Limite
                                        </a>
                                    </li>
                                </ul>
                                <div className="tab-content pt-2" id="myTabContent">
                                    <div className="tab-pane fade show active" id="info" role="tabpanel" aria-labelledby="info-tab">
                                        <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                            <div className="form-group">
                                                <label htmlFor="manzana">Manzana <i className="fa fa-asterisk text-danger small"></i></label>
                                                <select
                                                    className="form-control"
                                                    id="manzana"
                                                    ref={this.refManzana}
                                                    value={this.state.idManzana}
                                                    onChange={(event) => {
                                                        this.setState({ idManzana: event.target.value })
                                                    }}
                                                >
                                                    <option value="">- Seleccione -</option>
                                                    {
                                                        this.state.manzanas.map((item, index) => (
                                                            <option key={index} value={item.idManzana}>{item.nombre}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="manzana">Concepto <i className="fa fa-asterisk text-danger small"></i></label>
                                                <select
                                                    className="form-control"
                                                    id="manzana"
                                                    ref={this.refConcepto}
                                                    value={this.state.idConcepto}
                                                    onChange={(event) => {
                                                        this.setState({ idConcepto: event.target.value })
                                                    }}
                                                >
                                                    <option value="">- Seleccione -</option>
                                                    {
                                                        this.state.conceptos.map((item, index) => (
                                                            <option key={index} value={item.idConcepto}>{item.nombre}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="descripción">Descripción del Lote <i className="fa fa-asterisk text-danger small"></i></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="descripcion"
                                                    placeholder='ej. Lote 07'
                                                    ref={this.refDescripcion}
                                                    value={this.state.descripcion}
                                                    onChange={(event) => {
                                                        this.setState({ descripcion: event.target.value })
                                                    }}
                                                />
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label htmlFor="cAproximado">Costo Aproximado <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="cAproximado"
                                                        placeholder='0.00'
                                                        ref={this.refCosto}
                                                        value={this.state.costo}
                                                        onChange={(event) => {
                                                            this.setState({ costo: event.target.value })
                                                        }}
                                                        onKeyPress={keyNumberFloat}
                                                    />
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label htmlFor="pvContado">Precio Venta Contado <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="pvContado"
                                                        placeholder='0.00'
                                                        ref={this.refPrecio}
                                                        value={this.state.precio}
                                                        onChange={(event) => {
                                                            this.setState({ precio: event.target.value })
                                                        }}
                                                        onKeyPress={keyNumberFloat}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="estado">Estado <i className="fa fa-asterisk text-danger small"></i></label>
                                                <select
                                                    className="form-control"
                                                    id="estado"
                                                    ref={this.refEstado}
                                                    value={this.state.estado}
                                                    onChange={(event) => {
                                                        this.setState({ estado: event.target.value })
                                                    }}
                                                >
                                                    <option value="">- Seleccione -</option>
                                                    <option value="1">Disponible</option>
                                                    <option value="2">Reservado</option>
                                                    <option value="3">Vendido</option>
                                                    <option value="4">Inactivo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tab-pane fade" id="medida" role="tabpanel" aria-labelledby="medida-tab">
                                        <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                            <div className="form-group">
                                                <label htmlFor="mFrontal">Medida Frontal (ML)</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="mFrontal"
                                                    placeholder='0'
                                                    ref={this.refMedidaFrontal}
                                                    value={this.state.medidaFrontal}
                                                    onChange={(event) => {
                                                        this.setState({ medidaFrontal: event.target.value })
                                                    }}
                                                    onKeyPress={keyNumberFloat}
                                                />
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label htmlFor="coDerecho">Costado Derecho (ML)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="coDerecho"
                                                        placeholder='0'
                                                        ref={this.refCostadoDerecho}
                                                        value={this.state.costadoDerecho}
                                                        onChange={(event) => {
                                                            this.setState({ costadoDerecho: event.target.value })
                                                        }}
                                                        onKeyPress={keyNumberFloat}
                                                    />
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label htmlFor="coIzquierdo">Costado Izquierdo (ML)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="coIzquierdo"
                                                        placeholder='0'
                                                        ref={this.refCostadoIzquiero}
                                                        value={this.state.costadoIzquierdo}
                                                        onChange={(event) => {
                                                            this.setState({ costadoIzquierdo: event.target.value })
                                                        }}
                                                        onKeyPress={keyNumberFloat}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label htmlFor="mFondo">Medida Fondo (ML)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="mFondo"
                                                        placeholder='0'
                                                        ref={this.refMedidaFondo}
                                                        value={this.state.medidaFondo}
                                                        onChange={(event) => {
                                                            this.setState({ medidaFondo: event.target.value })
                                                        }}
                                                        onKeyPress={keyNumberFloat}
                                                    />
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label htmlFor="aLote">Area Lote (M2)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="aLote"
                                                        placeholder='0'
                                                        ref={this.refAreaLote}
                                                        value={this.state.areaLote}
                                                        onChange={(event) => {
                                                            this.setState({ areaLote: event.target.value })
                                                        }}
                                                        onKeyPress={keyNumberFloat}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="nPartida">N° Partida</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="nPartida"
                                                    placeholder='0'
                                                    ref={this.refNumeroPartida}
                                                    value={this.state.numeroPartida}
                                                    onChange={(event) => {
                                                        this.setState({ numeroPartida: event.target.value })
                                                    }}
                                                    onKeyPress={keyNumberFloat}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tab-pane fade" id="limite" role="tabpanel" aria-labelledby="limite-tab">
                                        <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                            <div className="form-group">
                                                <label htmlFor="lFrontal">Limite, Frontal / Norte / Noreste</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="lFrontal"
                                                    placeholder='Limite'
                                                    value={this.state.limiteFrontal}
                                                    onChange={(event) => {
                                                        this.setState({ limiteFrontal: event.target.value })
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="lDerecho">Limite, Derecho / Este / Sureste</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="lDerecho"
                                                    placeholder='Limite'
                                                    value={this.state.limiteDerecho}
                                                    onChange={(event) => {
                                                        this.setState({ limiteDerecho: event.target.value })
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="lIzquierdo">Limite, Izquierdo / Sur / Suroeste</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="lIzquierdo"
                                                    placeholder='Limite'
                                                    value={this.state.limiteIzquierdo}
                                                    onChange={(event) => {
                                                        this.setState({ limiteIzquierdo: event.target.value })
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="lPosterior">Limite, Posterior / Oeste / Noroeste</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="lPosterior"
                                                    placeholder='Limite'
                                                    value={this.state.limitePosterior}
                                                    onChange={(event) => {
                                                        this.setState({ limitePosterior: event.target.value })
                                                    }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="ubicacionLote">Ubicación del Lote</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="ubicacionLote"
                                                    placeholder='ej. Frente al parque'
                                                    value={this.state.ubicacionLote}
                                                    onChange={(event) => {
                                                        this.setState({ ubicacionLote: event.target.value })
                                                    }}
                                                />
                                            </div>
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
                {/* fin modal nuevo cliente*/}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Lotes de Terreno <small className="text-secondary">LISTA</small></h5>
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
                                        <th width="15%">Descripción</th>
                                        <th width="25%">P. Venta</th>
                                        <th width="20%">M.F(ML)</th>
                                        <th width="20%">M.C.D(ML)</th>
                                        <th width="20%">Area(M2)</th>
                                        <th width="10%">Estado</th>
                                        <th width="5%">Mostar</th>
                                        <th width="5%" className="text-center">Editar</th>
                                        <th width="5%" className="text-center">Eliminar</th>
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
                                                        <td>{item.descripcion}</td>
                                                        <td>{item.precio}</td>
                                                        <td>{item.medidaFondo}</td>
                                                        <td>{item.medidaFrontal}</td>
                                                        <td>{item.areaLote}</td>
                                                        <td>
                                                            {
                                                                item.estado === 1 ? <span className="badge badge-warning">Disponible</span>
                                                                    : item.estado === 2 ? <span className="badge badge-info">Reservado</span>
                                                                        : item.estado === 3 ? <span className="badge badge-success">Vendido</span>
                                                                            : <span className="badge badge-warnin">Inactivo</span>
                                                            }
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-info btn-sm"
                                                                title="Detalle"
                                                                onClick={() => this.onEventMostrar(item.idLote)}
                                                                disabled={!this.state.view}>
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.openModal(item.idLote)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Anular"
                                                                onClick={() => this.onEventDelete(item.idLote)}
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

export default connect(mapStateToProps, null)(Lotes);
