import React from 'react';
import axios from 'axios';
import {
    showModal,
    hideModal,
    viewModal,
    clearModal,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading,
    keyNumberInteger,
    getExtension,
    readDataURL,
    imageSizeData,
    statePrivilegio
} from '../tools/Tools';
import { connect } from 'react-redux';
import noImage from '../../recursos/images/noimage.jpg';
import SearchBar from "../tools/SearchBar";
import Paginacion from '../tools/Paginacion';

class Sedes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idSede: '',

            ruc: '',
            razonSocial: '',
            nombreEmpresa: '',
            nombreSede: '',
            direccion: '',

            idUbigeo: '',
            ubigeo: '',

            celular: '',
            telefono: '',
            email: '',
            web: '',
            descripcion: '',
            useSol: '',
            claveSol: '',
            certificado: '',
            claveCert: '',

            filter: false,
            filteredData: [],

            imagen: noImage,
            imageBase64: null,
            extenBase64: null,

            loadModal: false,
            nameModal: 'Nuevo Comprobante',
            msgModal: 'Cargando datos...',

            edit: statePrivilegio(this.props.token.userToken.menus[5].submenu[3].privilegio[0].estado),

            loading: false,
            lista: [],

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas'
        }
        this.refRuc = React.createRef();
        this.refRazonSocial = React.createRef();
        this.refNombreEmpresa = React.createRef();
        this.refNombreSede = React.createRef();
        this.refCelular = React.createRef();

        this.refDireccion = React.createRef();
        this.refUbigeo = React.createRef();

        this.refTxtSearch = React.createRef();
        this.refFileImagen = React.createRef();

        this.idCodigo = "";
        this.selectItem = false;
        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadInit();
        this.refFileImagen.current.addEventListener("change", this.onEventFileImage);

        viewModal("modalSede", () => {
            this.abortControllerModal = new AbortController();

            if (this.idCodigo !== "") this.loadDataId(this.idCodigo);
        });

        clearModal("modalSede", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                idSede: '',
                ruc: '',
                razonSocial: '',
                nombreEmpresa: '',
                nombreSede: '',
                direccion: '',

                idUbigeo: '',
                ubigeo: '',

                celular: '',
                telefono: '',
                email: '',
                web: '',
                descripcion: '',
                useSol: '',
                claveSol: '',
                certificado: '',
                claveCert: '',

                filter: false,
                filteredData: [],

                imagen: noImage,
                imageBase64: null,
                extenBase64: null,

                loadModal: false,
                nameModal: 'Nuevo Comprobante',
                msgModal: 'Cargando datos...',
            });
            this.idCodigo = "";
        });
    }

    componentWillUnmount() {
        this.refFileImagen.current.removeEventListener("change", this.onEventFileImage);
        this.abortControllerTable.abort();
    }

    onEventFileImage = async (event) => {
        if (event.target.files.length !== 0) {
            await this.setStateAsync({
                imagen: URL.createObjectURL(event.target.files[0])
            });
        } else {
            await this.setStateAsync({
                imagen: noImage
            });
            this.refFileImagen.current.value = "";
        }
    }

    async clearImage() {
        await this.setStateAsync({
            imagen: noImage
        })
        this.refFileImagen.current.value = "";
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

            const result = await axios.get('/api/sede/list', {
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
            this.selectItem = true;

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
            showModal('modalSede')
            await this.setStateAsync({ nameModal: "Nueva Sede" });
        }
        else {
            showModal('modalSede')
            this.idCodigo = id;
            await this.setStateAsync({ idSede: id, nameModal: "Editar Sede", loadModal: true });
        }
    }

    loadDataId = async (id) => {
        try {
            const result = await axios.get("/api/sede/id", {
                signal: this.abortControllerModal.signal,
                params: {
                    "idSede": id
                }
            });

            const data = result.data;

            // console.log(data)

            await this.setStateAsync({
                idSede: data.idSede,
                ruc: data.ruc,
                razonSocial: data.razonSocial,
                nombreEmpresa: data.nombreEmpresa,
                nombreSede: data.nombreSede,
                direccion: data.direccion,

                idUbigeo: data.idUbigeo.toString(),
                ubigeo: data.departamento + "-" + data.provincia + "-" + data.distrito + " (" + data.ubigeo + ")",

                celular: data.celular,
                telefono: data.telefono,
                email: data.email,
                web: data.web,
                descripcion: data.descripcion,
                useSol: data.useSol,
                claveSol: data.claveSol,
                certificado: data.certificado,
                claveCert: data.claveCert,

                imagen: data.imagen !== "" ? `data:image/${data.extensionimagen};base64,${data.imagen}` : noImage,
                imageBase64: data.imagen,
                extenBase64: data.extension,

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

        if (this.state.ruc === "") {
            this.refRuc.current.focus();
        } else if (this.state.razonSocial === "") {
            this.refRazonSocial.current.focus();
        } else if (this.state.nombreEmpresa === "") {
            this.refNombreEmpresa.current.focus();
        } else if (this.state.nombreSede === "") {
            this.refNombreSede.current.focus();
        } else if (this.state.direccion === "") {
            this.refDireccion.current.focus();
        } else if (this.state.idUbigeo === "") {
            this.refUbigeo.current.focus();
        } else if (this.state.celular === "") {
            this.refCelular.current.focus();
        } else {
            try {

                ModalAlertInfo("Sede", "Procesando información...");
                let files = this.refFileImagen.current.files;
                if (files.length !== 0) {
                    let read = await readDataURL(files);
                    let base64String = read.replace(/^data:.+;base64,/, '');
                    let ext = getExtension(files[0].name);
                    let { width, height } = await imageSizeData(read);
                    if (width <= 1024 && height <= 629) {
                        this.save(base64String, ext);
                    } else {
                        ModalAlertWarning("Proyecto", "La imagen subida no tiene el tamaño establecido.");
                    }
                } else {
                    this.save("", "");
                }
                hideModal("modalSede");

            } catch (error) {
                if (error.response != null) {
                    ModalAlertWarning("Sede", error.response.data);
                } else {
                    ModalAlertWarning("Sede", "Se produjo un error un interno, intente nuevamente.");
                }

            }
        }
    }

    async save(image, extension) {
        if (this.state.idSede !== '') {
            let result = await axios.post('/api/sede/update', {
                "ruc": this.state.ruc,
                "razonSocial": this.state.razonSocial.trim().toUpperCase(),
                "nombreEmpresa": this.state.nombreEmpresa.trim().toUpperCase(),
                "nombreSede": this.state.nombreSede.trim().toUpperCase(),
                "direccion": this.state.direccion.trim().toUpperCase(),

                "idUbigeo": this.state.idUbigeo,

                "celular": this.state.celular.trim(),
                "telefono": this.state.telefono.trim(),
                "email": this.state.email.trim().toUpperCase(),
                "web": this.state.web.trim().toUpperCase(),
                "descripcion": this.state.descripcion.trim().toUpperCase(),
                "useSol": this.state.useSol.trim(),
                "claveSol": this.state.claveSol.trim(),
                "certificado": '',
                "claveCert": this.state.claveCert.trim(),

                "imagen": image === "" ? this.state.imageBase64 == null ? "" : this.state.imageBase64 : image,
                "extension": extension === "" ? this.state.extenBase64 == null ? "" : this.state.extenBase64 : extension,

                "idSede": this.state.idSede
            })

            ModalAlertSuccess("Sede", result.data, () => {
                this.onEventPaginacion();
            });
        } else {
            let result = await axios.post('/api/sede/add', {
                "ruc": this.state.ruc,
                "razonSocial": this.state.razonSocial.trim().toUpperCase(),
                "nombreEmpresa": this.state.nombreEmpresa.trim().toUpperCase(),
                "nombreSede": this.state.nombreSede.trim().toUpperCase(),
                "direccion": this.state.direccion.trim().toUpperCase(),

                "idUbigeo": this.state.idUbigeo,

                "celular": this.state.celular.trim(),
                "telefono": this.state.telefono.trim(),
                "email": this.state.email.trim().toUpperCase(),
                "web": this.state.web.trim().toUpperCase(),
                "descripcion": this.state.descripcion.trim().toUpperCase(),
                "useSol": this.state.useSol.trim(),
                "claveSol": this.state.claveSol.trim(),
                "certificado": '',
                "claveCert": this.state.claveCert.trim(),

                "imagen": image === "" ? this.state.imageBase64 == null ? "" : this.state.imageBase64 : image,
                "extension": extension === "" ? this.state.extenBase64 == null ? "" : this.state.extenBase64 : extension,

            });

            ModalAlertSuccess("Sede", result.data, () => {
                this.loadInit();
            });
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
                {/* Inicio modal */}
                <div className="modal fade" id="modalSede" data-bs-keyboard="false" data-bs-backdrop="static">
                    <div className="modal-dialog modal-lg">
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
                                        <label>RUC: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refRuc}
                                            value={this.state.ruc}
                                            onChange={(event) => this.setState({ ruc: event.target.value })}
                                            onKeyPress={keyNumberInteger}
                                            placeholder="Ingrese el número del ruc" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Razon Social: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refRazonSocial}
                                            value={this.state.razonSocial}
                                            onChange={(event) => this.setState({ razonSocial: event.target.value })}
                                            placeholder="Ingrese la razon social" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Nombre de Empresa: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refNombreEmpresa}
                                            value={this.state.nombreEmpresa}
                                            onChange={(event) => this.setState({ nombreEmpresa: event.target.value })}
                                            placeholder="Ingrese el nombre comercial de la empresa" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Nombre de Sede: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refNombreSede}
                                            value={this.state.nombreSede}
                                            onChange={(event) => this.setState({ nombreSede: event.target.value })}
                                            placeholder="Ingrese el nombre de la sede" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Dirección: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refDireccion}
                                            value={this.state.direccion}
                                            onChange={(event) => this.setState({ direccion: event.target.value })}
                                            placeholder="Ingrese el la dirección" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Ubigeo: <i className="fa fa-asterisk text-danger small"></i></label>
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

                                <div className="form-row">
                                    <div className="form-group col-md-4">
                                        <label>celular: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refCelular}
                                            value={this.state.celular}
                                            onChange={(event) => this.setState({ celular: event.target.value })}
                                            onKeyPress={keyNumberInteger}
                                            placeholder="Ingrese el número de celular" />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Telefono: </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.telefono}
                                            onChange={(event) => this.setState({ telefono: event.target.value })}
                                            onKeyPress={keyNumberInteger}
                                            placeholder="Ingrese el número de telefono" />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Email:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.email}
                                            onChange={(event) => this.setState({ email: event.target.value })}
                                            placeholder="Ingrese el email" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>WebSite:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.web}
                                            onChange={(event) => this.setState({ web: event.target.value })}
                                            placeholder="Ingrese la url" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Descripción:</label>
                                        <input
                                            type="text"
                                            className="form-control"

                                            value={this.state.descripcion}
                                            onChange={(event) => this.setState({ descripcion: event.target.value })}
                                            placeholder="Ingrese una descripción" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Usuario sol: </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.useSol}
                                            onChange={(event) => this.setState({ useSol: event.target.value })}
                                            placeholder="Ingrese el usuario sol" />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Contraseña sol: </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={this.state.claveSol}
                                            onChange={(event) => this.setState({ claveSol: event.target.value })}
                                            placeholder="Ingrese la contraseña sol" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="col-md-6">
                                        <label className="form-text" >Certificado:</label>
                                        <div className="form-group d-flex">
                                            <input type="file" className="form-control d-none" id="fileCertificado" />
                                            <div className="input-group">
                                                <label className="form-control" htmlFor="fileCertificado" id="lblNameCertificado">{'...'}</label>
                                                <div className="input-group-append">
                                                    <label htmlFor="fileCertificado" className="form-control ml-1" type="button" id="btnReloadCliente"><i className="bi bi-file-earmark-fill"></i></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-text">Contraseña certificado: </label>
                                        <div className="form-group">
                                            <input
                                                type="password"
                                                className="form-control"
                                                ref={this.refClaveSol}
                                                onChange={(event) => this.setState({ claveCert: event.target.value })}
                                                placeholder="Ingrese la contraseña del certificado" />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-12 text-center">
                                        <div className="text-center mb-2 ">
                                            <img src={this.state.imagen} alt="" className="img-fluid border border-primary rounded" width={250} />
                                        </div>
                                        <input type="file" id="fileImage" accept="image/png, image/jpeg, image/gif, image/svg" style={{ display: "none" }} ref={this.refFileImagen} />
                                        <label htmlFor="fileImage" className="btn btn-outline-secondary m-0">
                                            <div className="content-button">
                                                <i className="bi bi-image"></i>
                                                <span></span>
                                            </div>
                                        </label>
                                        {" "}
                                        <button className="btn btn-outline-secondary" onClick={() => this.clearImage()}>
                                            <i className="bi bi-trash"></i>
                                        </button>
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
                            <h5>Sedes <small className="text-secondary">LISTA</small></h5>
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
                            {/* <button className="btn btn-outline-info" onClick={() => this.openModal(this.state.idSede)}>
                                <i className="bi bi-file-plus"></i> Nuevo Registro
                            </button>
                            {" "} */}
                            <button className="btn btn-outline-secondary" onClick={() => this.fillTable(0, 1, "")}>
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
                                        <th width="10%">Sede</th>
                                        <th width="15%">Empresa</th>
                                        <th width="20%">Dirección</th>
                                        <th width="10%">Telefono</th>
                                        <th width="15%">Celular</th>
                                        <th width="5%" className="text-center">Editar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="7">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="7">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.nombreSede}</td>
                                                        <td>{item.nombreEmpresa}</td>
                                                        <td>{item.direccion}</td>
                                                        <td>{item.telefono}</td>
                                                        <td>{item.celular}</td>
                                                        <td className="text-center">
                                                            <button 
                                                            className="btn btn-outline-warning btn-sm"
                                                             title="Editar" 
                                                             onClick={() => this.openModal(item.idSede)}
                                                             disabled={!this.state.edit}>
                                                                 <i className="bi bi-pencil"></i>
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

export default connect(mapStateToProps, null)(Sedes);