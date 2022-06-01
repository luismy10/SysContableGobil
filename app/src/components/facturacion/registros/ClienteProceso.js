import React from 'react';
import axios from 'axios';
import {
    currentDate,
    keyNumberPhone,
    keyNumberInteger,
    spinnerLoading,
    convertNullText,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../../tools/Tools';
import { connect } from 'react-redux';
import reniec from '../../../recursos/images/reniec.png';
import sunat from '../../../recursos/images/sunat.png';
import SearchBar from "../../tools/SearchBar";

class ClienteProceso extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idCliente: '',
            idTipoDocumento: '',
            tiposDocumentos: [],
            documento: '',
            informacion: '',
            telefono: '',
            celular: '',
            fechaNacimiento: currentDate(),
            email: '',
            genero: '',
            direccion: '',

            idUbigeo: '',
            ubigeo: '',

            estadoCivil: '',
            estado: true,
            observacion: '',
            idUsuario: this.props.token.userToken.idUsuario,

            filter: false,
            filteredData: [],

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',
        }

        this.refTipoDocumento = React.createRef();
        this.refDocumento = React.createRef();
        this.refInformacion = React.createRef();
        this.refCelular = React.createRef();
        this.refGenero = React.createRef();

        this.refDireccion = React.createRef();
        this.refUbigeo = React.createRef();
        this.refFechaNacimiento = React.createRef();

        this.abortControllerTable = new AbortController();

        this.selectItem = false;
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        const url = this.props.location.search;
        const idcliente = new URLSearchParams(url).get("idCliente");
        if (idcliente !== null) {
            this.loadDataId(idcliente)
        } else {
            this.loadData();
        }
    }

    componentWillUnmount() {
        this.abortControllerTable.abort();
    }

    loadData = async () => {
        try {
            const documento = await axios.get("/api/tipodocumento/listcombo", {
                signal: this.abortControllerTable.signal,
            });

            await this.setStateAsync({
                tiposDocumentos: documento.data,

                loading: false
            })
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    loadDataId = async (id) => {
        try {
            const documento = await axios.get("/api/tipodocumento/listcombo", {
                signal: this.abortControllerTable.signal
            });

            const result = await axios.get("/api/cliente/id", {
                signal: this.abortControllerTable.signal,
                params: {
                    "idCliente": id
                }
            });

            const data = result.data

            await this.setStateAsync({
                idCliente: data.idCliente,
                idTipoDocumento: data.idTipoDocumento,
                documento: data.documento,
                informacion: data.informacion,
                telefono: data.telefono,
                celular: data.celular,
                fechaNacimiento: data.fechaNacimiento,
                email: data.email,
                genero: data.genero,
                direccion: data.direccion,

                idUbigeo: data.idUbigeo === 0 ? '' : data.idUbigeo.toString(),
                ubigeo: data.ubigeo === '' ? '' : data.departamento + "-" + data.provincia + "-" + data.distrito + " (" + data.ubigeo + ")",

                estadoCivil: data.estadoCivil,
                estado: data.estado,
                observacion: data.observacion,

                tiposDocumentos: documento.data,

                loading: false
            })
            this.selectItem = data.idUbigeo === 0 ? false : true;
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    async onEventGuardar() {
        if (this.state.idTipoDocumento === "") {
            this.setState({ messageWarning: "Seleccione el tipo de documento." });
            this.onFocusTab("datos-tab", "datos");
            this.refTipoDocumento.current.focus();
            return;
        }

        if (this.state.documento === "") {
            this.setState({ messageWarning: "Ingrese el número de documento." });
            this.onFocusTab("datos-tab", "datos");
            this.refDocumento.current.focus();
            return;
        }

        if (this.state.informacion === "") {
            this.setState({ messageWarning: "Ingrese los apellidos y nombres." });
            this.onFocusTab("datos-tab", "datos");
            this.refInformacion.current.focus();
            return;
        }

        if (this.state.celular === "") {
            this.setState({ messageWarning: "Ingrese el número de celular." });
            this.onFocusTab("contacto-tab", "contacto");
            this.refCelular.current.focus();
            return;
        }

        if (this.state.genero === "") {
            this.setState({ messageWarning: "Seleccione un genero." });
            this.onFocusTab("datos-tab", "datos");
            this.refGenero.current.focus();
            return;
        }

        try {
            ModalAlertInfo("Cliente", "Procesando información...");
            if (this.state.idCliente !== '') {
                const cliente = await axios.post('/api/cliente/update', {
                    "idTipoDocumento": this.state.idTipoDocumento,
                    "documento": this.state.documento.toString().trim().toUpperCase(),
                    "informacion": this.state.informacion.trim().toUpperCase(),
                    "telefono": this.state.telefono.toString().trim().toUpperCase(),
                    "celular": this.state.celular.toString().trim().toUpperCase(),
                    "fechaNacimiento": this.state.fechaNacimiento,
                    "email": this.state.email.trim().toUpperCase(),
                    "genero": this.state.genero,
                    "direccion": this.state.direccion.trim().toUpperCase(),
                    "idUbigeo": this.state.idUbigeo,
                    "estadoCivil": this.state.estadoCivil,
                    "estado": this.state.estado,
                    "observacion": this.state.observacion.trim().toUpperCase(),
                    "idUsuario": this.state.idUsuario,
                    //idCliente
                    "idCliente": this.state.idCliente
                })
                ModalAlertSuccess("Cliente", cliente.data, () => {
                    this.props.history.goBack();
                });
            } else {
                const cliente = await axios.post('/api/cliente/add', {
                    "idTipoDocumento": this.state.idTipoDocumento,
                    "documento": this.state.documento.toString().trim().toUpperCase(),
                    "informacion": this.state.informacion.trim().toUpperCase(),
                    "telefono": this.state.telefono.toString().trim().toUpperCase(),
                    "celular": this.state.celular.toString().trim().toUpperCase(),
                    "fechaNacimiento": this.state.fechaNacimiento,
                    "email": this.state.email.trim().toUpperCase(),
                    "genero": this.state.genero,
                    "direccion": this.state.direccion.trim().toUpperCase(),
                    "idUbigeo": this.state.idUbigeo,
                    "estadoCivil": this.state.estadoCivil,
                    "estado": this.state.estado,
                    "observacion": this.state.observacion.trim().toUpperCase(),
                    "idUsuario": this.state.idUsuario
                });
                ModalAlertSuccess("Cliente", cliente.data, () => {
                    this.props.history.goBack();
                });
            }
        } catch (error) {
            if (error.response !== undefined) {
                ModalAlertWarning("Venta", error.response.data)
            } else {
                ModalAlertWarning("Venta", "Se genero un error interno, intente nuevamente.")
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

    async onEventGetApiReniec() {
        if (this.state.documento.length !== 8) {
            this.setState({ messageWarning: "Para iniciar la busqueda en número dni debe tener 8 caracteres." });
            return;
        }
        try {
            await this.setStateAsync({
                loading: true,
                msgLoading: 'Consultando número de DNI...',
            });

            let result = await axios.get("https://dniruc.apisperu.com/api/v1/dni/" + this.state.documento + "?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFsZXhhbmRlcl9keF8xMEBob3RtYWlsLmNvbSJ9.6TLycBwcRyW1d-f_hhCoWK1yOWG_HJvXo8b-EoS5MhE", {
                timeout: 5000,
            });


            await this.setStateAsync({
                documento: convertNullText(result.data.dni),
                informacion: convertNullText(result.data.apellidoPaterno) + " " + convertNullText(result.data.apellidoMaterno) + " " + convertNullText(result.data.nombres),
                loading: false,
            });
        } catch (error) {

        }
    }

    async onEventGetApiSunat() {
        if (this.state.documento.length !== 11) {
            this.setState({ messageWarning: "Para iniciar la busqueda en número ruc debe tener 11 caracteres." });
            return;
        }
        try {
            await this.setStateAsync({
                loading: true,
                msgLoading: 'Consultando número de RUC...',
            });

            let result = await axios.get("https://dniruc.apisperu.com/api/v1/ruc/" + this.state.documento + "?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFsZXhhbmRlcl9keF8xMEBob3RtYWlsLmNvbSJ9.6TLycBwcRyW1d-f_hhCoWK1yOWG_HJvXo8b-EoS5MhE", {
                timeout: 5000,
            });
            await this.setStateAsync({
                documento: convertNullText(result.data.ruc),
                informacion: convertNullText(result.data.razonSocial),
                direccion: convertNullText(result.data.direccion),
                loading: false,
            });
        } catch (error) {

        }
    }

    handleFilter = async (event) => {

        const searchWord = this.selectItem ? "" : event.target.value;
        await this.setStateAsync({ idUbigeo: '', ubigeo: searchWord });
        this.selectItem = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ filteredData: [] });
            return;
        }

        if (this.state.filter) return;

        try {
            await this.setStateAsync({ filter: true });
            let result = await axios.get("/api/ubigeo/", {
                params: {
                    filtrar: searchWord,
                },
            });
            await this.setStateAsync({ filter: false, filteredData: result.data });
        } catch (error) {
            await this.setStateAsync({ filter: false, filteredData: [] });
        }
    }

    onEventSelectItem = async (value) => {
        await this.setStateAsync({
            ubigeo: value.departamento + "-" + value.provincia + "-" + value.distrito + " (" + value.ubigeo + ")",
            filteredData: [],
            idUbigeo: value.idUbigeo
        });
        this.selectItem = true;
    }

    onEventClearInput = async () => {
        await this.setStateAsync({ filteredData: [], idUbigeo: '', ubigeo: "" });
        this.selectItem = false;
    }

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        <>

                            <div className='row'>
                                <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                    <section className="content-header">
                                        <h5>
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> {this.state.idCliente === '' ? 'Registrar Cliente' : 'Editar Cliente'}
                                        </h5>
                                    </section>
                                </div>
                            </div>

                            {
                                this.state.messageWarning === '' ? null :
                                    <div className="alert alert-warning" role="alert">
                                        <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                    </div>
                            }

                            <div className='row'>
                                <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                                        <li className="nav-item" role="presentation">
                                            <a className="nav-link active" id="datos-tab" data-bs-toggle="tab" href="#datos" role="tab" aria-controls="datos" aria-selected="true">
                                                <i className="bi bi-info-circle"></i> Datos
                                            </a>
                                        </li>
                                        <li className="nav-item" role="presentation">
                                            <a className="nav-link" id="contacto-tab" data-bs-toggle="tab" href="#contacto" role="tab" aria-controls="contacto" aria-selected="false">
                                                <i className="bi bi-person-workspace"></i> Contacto
                                            </a>
                                        </li>
                                    </ul>

                                    <div className="tab-content pt-2" id="myTabContent">
                                        <div className="tab-pane fade show active" id="datos" role="tabpanel" aria-labelledby="datos-tab">

                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label>Tipo Documento <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <select
                                                        className="form-control"
                                                        value={this.state.idTipoDocumento}
                                                        ref={this.refTipoDocumento}
                                                        onChange={(event) => {
                                                            if (event.target.value.trim().length > 0) {
                                                                this.setState({
                                                                    idTipoDocumento: event.target.value,
                                                                    messageWarning: '',
                                                                });
                                                            } else {
                                                                this.setState({
                                                                    idTipoDocumento: event.target.value,
                                                                    messageWarning: 'Seleccione el tipo de documento',
                                                                });
                                                            }
                                                        }}>
                                                        <option value="">-- Seleccione --</option>
                                                        {
                                                            this.state.tiposDocumentos.map((item, index) => (
                                                                <option key={index} value={item.idTipoDocumento}>{item.nombre}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label>N° de documento <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            ref={this.refDocumento}
                                                            value={this.state.documento}
                                                            onChange={(event) => {
                                                                if (event.target.value.trim().length > 0) {
                                                                    this.setState({
                                                                        documento: event.target.value,
                                                                        messageWarning: '',
                                                                    });
                                                                } else {
                                                                    this.setState({
                                                                        documento: event.target.value,
                                                                        messageWarning: 'Ingrese el número de documento',
                                                                    });
                                                                }
                                                            }}
                                                            onKeyPress={keyNumberInteger}
                                                            placeholder='00000000' />
                                                        <div className="input-group-append">
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                type="button"
                                                                title="Reniec"
                                                                onClick={() => this.onEventGetApiReniec()}>
                                                                <img src={reniec} alt="Reniec" width="12" />
                                                            </button>
                                                        </div>
                                                        <div className="input-group-append">
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                type="button"
                                                                title="Sunat"
                                                                onClick={() => this.onEventGetApiSunat()}>
                                                                <img src={sunat} alt="Sunat" width="12" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Razón Social/Apellidos y Nombres <i className="fa fa-asterisk text-danger small"></i></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={this.state.informacion}
                                                    onChange={(event) => {
                                                        if (event.target.value.trim().length > 0) {
                                                            this.setState({
                                                                informacion: event.target.value,
                                                                messageWarning: '',
                                                            });
                                                        } else {
                                                            this.setState({
                                                                informacion: event.target.value,
                                                                messageWarning: 'Ingrese la razón social o apellidos y nombres',
                                                            });
                                                        }
                                                    }}
                                                    placeholder='Ingrese la razón social o apellidos y nombres' />
                                            </div>

                                            <div className="form-group">
                                                <label>Fecha de Nacimiento</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    ref={this.refFechaNacimiento}
                                                    value={this.state.fechaNacimiento}
                                                    onChange={(event) => this.setState({ fechaNacimiento: event.target.value })}
                                                />
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group col-md-6">
                                                    <label>Genero <i className="fa fa-asterisk text-danger small"></i></label>
                                                    <select
                                                        className="form-control"
                                                        ref={this.refGenero}
                                                        value={this.state.genero}
                                                        onChange={(event) => this.setState({ genero: event.target.value })}>
                                                        <option value="">-- Seleccione --</option>
                                                        <option value="1">Masculino</option>
                                                        <option value="2">Femenino</option>
                                                    </select>
                                                </div>

                                                <div className="form-group col-md-6">
                                                    <label>Estado Civil</label>
                                                    <select
                                                        className="form-control"
                                                        value={this.state.estadoCivil}
                                                        onChange={(event) => this.setState({ estadoCivil: event.target.value })}>
                                                        <option value="">-- seleccione --</option>
                                                        <option value="1">Soltero(a)</option>
                                                        <option value="2">Casado(a)</option>
                                                        <option value="3">Viudo(a)</option>
                                                        <option value="4">Divorciado(a)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Observación</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={this.state.observacion}
                                                    onChange={(event) => this.setState({ observacion: event.target.value })}
                                                    placeholder='Ingrese alguna observación' />
                                            </div>

                                            <div className="form-group">
                                                <label>Estado:</label>
                                                <div className="custom-control custom-switch">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id="switch1"
                                                        checked={this.state.estado}
                                                        onChange={(value) => this.setState({ estado: value.target.checked })} />
                                                    <label className="custom-control-label" htmlFor="switch1">{this.state.estado === true ? "Activo" : "Inactivo"}</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="tab-pane fade" id="contacto" role="tabpanel" aria-labelledby="contacto-tab">

                                            <div className="form-group">
                                                <label>N° de Celular <i className="fa fa-asterisk text-danger small"></i></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={this.state.celular}
                                                    ref={this.refCelular}
                                                    onChange={(event) => {
                                                        if (event.target.value.trim().length > 0) {
                                                            this.setState({
                                                                celular: event.target.value,
                                                                messageWarning: '',
                                                            });
                                                        } else {
                                                            this.setState({
                                                                celular: event.target.value,
                                                                messageWarning: 'Ingrese el número de celular.',
                                                            });
                                                        }
                                                    }}
                                                    onKeyPress={keyNumberPhone}
                                                    placeholder='Ingrese el número de celular.' />
                                            </div>

                                            <div className="form-group">
                                                <label>N° de Telefono</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={this.state.telefono}
                                                    ref={this.refTelefono}
                                                    onChange={(event) => this.setState({ telefono: event.target.value, })}
                                                    onKeyPress={keyNumberPhone}
                                                    placeholder='Ingrese el número de telefono.' />
                                            </div>

                                            <div className="form-group">
                                                <label>E-Mail</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={this.state.email}
                                                    onChange={(event) => this.setState({ email: event.target.value })}
                                                    placeholder='Ingrese el email' />
                                            </div>

                                            <div className="form-group">
                                                <label>Dirección</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={this.state.direccion}
                                                    ref={this.refDireccion}
                                                    onChange={(event) => this.setState({ direccion: event.target.value })}
                                                    placeholder='Ingrese la dirección' />
                                            </div>

                                            <div className="form-group">
                                                <label>Ubigeo</label>
                                                <SearchBar
                                                    placeholder="Escribe para iniciar a filtrar..."
                                                    refTxtUbigeo={this.refUbigeo}
                                                    ubigeo={this.state.ubigeo}
                                                    filteredData={this.state.filteredData}
                                                    onEventClearInput={this.onEventClearInput}
                                                    handleFilter={this.handleFilter}
                                                    onEventSelectItem={this.onEventSelectItem}
                                                />
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="row">
                                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
                                    <button type="button" className="btn btn-primary mr-2" onClick={() => this.onEventGuardar()}>Guardar</button>
                                    <button type="button" className="btn btn-danger" onClick={() => this.props.history.goBack()}>Cancelar</button>
                                </div>
                            </div>
                        </>
                }

            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(ClienteProceso);