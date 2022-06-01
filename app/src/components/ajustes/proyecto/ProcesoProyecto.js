import React from 'react';
import axios from 'axios';
import {
    isNumeric,
    keyNumberFloat,
    getExtension,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    readDataURL,
    imageSizeData,
    spinnerLoading
} from '../../tools/Tools';
import { connect } from 'react-redux';
import noImage from '../../../recursos/images/noimage.jpg';
import SearchBar from "../../tools/SearchBar";

class ProcesoProyecto extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            idProyecto: '',
            nombre: '',
            idSede: '',
            sedes: [],
            area: '',
            estado: '1',

            ubicacion: '',
            idUbigeo: '',

            lnorte: '',
            leste: '',
            lsur: '',
            loeste: '',

            idMoneda: '',
            monedas: [],
            tea: '',
            preciometro: '',
            costoxlote: '',
            numContratoCorrelativo: '',
            numRecibocCorrelativo: '',

            imagen: noImage,
            imageBase64: null,
            extenBase64: null,

            idUsuario: this.props.token.userToken.idUsuario,

            loading: true,
            msgLoading: 'Cargando datos...',

            messageWarning: '',

            filter: false,
            ubigeo: '',
            filteredData: [],
        }

        this.refTxtNombre = React.createRef();
        this.refTxtSede = React.createRef();
        this.refTxtArea = React.createRef();
        this.refTxtUbicacion = React.createRef();
        this.refTxtUbigeo = React.createRef();

        this.refTxtMoneda = React.createRef();
        this.refTxtTea = React.createRef();
        this.refFileImagen = React.createRef();

        this.abortController = new AbortController();

        this.selectItem = false;
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.refFileImagen.current.addEventListener("change", this.onEventFileImage);

        const url = this.props.location.search;
        const idResult = new URLSearchParams(url).get("idProyecto");
        if (idResult !== null) {
            this.loadDataId(idResult)
        } else {
            this.loadData();
        }
    }

    componentWillUnmount() {
        this.refFileImagen.current.removeEventListener("change", this.onEventFileImage);
        this.abortController.abort();
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

    async loadData() {
        try {

            const sede = await axios.get("/api/sede/listcombo", {
                signal: this.abortController.signal,
            });

            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortController.signal,
            });

            await this.setStateAsync({
                sedes: sede.data,
                monedas: moneda.data,

                loading: false,
            });
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    async loadDataId(id) {
        try {

            const sede = await axios.get("/api/sede/listcombo", {
                signal: this.abortController.signal,
            });

            const moneda = await axios.get("/api/moneda/listcombo", {
                signal: this.abortController.signal,
            });

            const result = await axios.get("/api/proyecto/id", {
                signal: this.abortController.signal,
                params: {
                    idProyecto: id
                }
            });

            const data = result.data;

            await this.setStateAsync({
                idProyecto: id,
                nombre: data.nombre,
                idSede: data.idSede,
                area: data.area,
                estado: data.estado,

                ubicacion: data.ubicacion,
                idUbigeo: data.idUbigeo.toString(),
                ubigeo: data.departamento + "-" + data.provincia + "-" + data.distrito + " (" + data.ubigeo + ")",

                lnorte: data.lnorte,
                leste: data.leste,
                lsur: data.lsur,
                loeste: data.loeste,

                idMoneda: data.idMoneda,
                tea: data.tea.toString(),
                preciometro: data.preciometro.toString(),
                costoxlote: data.costoxlote.toString(),
                numContratoCorrelativo: data.numContratoCorrelativo,
                numRecibocCorrelativo: data.numRecibocCorrelativo,

                imagen: data.imagen !== "" ? `data:image/${data.extensionimagen};base64,${data.imagen}` : noImage,
                imageBase64: data.imagen,
                extenBase64: data.extension,

                sedes: sede.data,
                monedas: moneda.data,

                loading: false,
            });
            this.selectItem = true;
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    async onEventGuardar() {
        if (this.state.nombre === "") {
            await this.setStateAsync({ messageWarning: "Ingrese el nombre del proyecto." });
            this.onFocusTab("datos-tab", "datos");
            this.refTxtNombre.current.focus();
            return;
        }

        if (this.state.idSede === "") {
            await this.setStateAsync({
                messageWarning: "Seleccione la sede."
            });
            this.onFocusTab("datos-tab", "datos");
            this.refTxtSede.current.focus();
            return;
        }

        if (this.state.area === "") {
            await this.setStateAsync({
                messageWarning: "Ingrese el área total."
            });
            this.onFocusTab("datos-tab", "datos");
            this.refTxtArea.current.focus();
            return;
        }

        if (this.state.ubicacion === "") {
            await this.setStateAsync({
                messageWarning: "Ingrese la ubicación del proyecto."
            });
            this.onFocusTab("ubicacion-tab", "ubicacion");
            this.refTxtUbicacion.current.focus();
            return;
        }

        if (this.state.idUbigeo === "") {
            await this.setStateAsync({
                messageWarning: "Ingrese su ubigeo."
            });
            this.onFocusTab("ubicacion-tab", "ubicacion");
            this.refTxtUbigeo.current.focus();
            return;
        }

        if (this.state.idMoneda === "") {
            await this.setStateAsync({
                messageWarning: "Seleccione la moneda."
            });
            this.onFocusTab("ajustes-tab", "ajustes");
            this.refTxtMoneda.current.focus();
            return;
        }

        try {
            ModalAlertInfo("Proyecto", "Procesando información...");
            let files = this.refFileImagen.current.files;
            if (files.length !== 0) {
                let read = await readDataURL(files);
                let base64String = read.replace(/^data:.+;base64,/, '');
                let ext = getExtension(files[0].name);
                let { width, height } = await imageSizeData(read);
                if (width === 1024 && height === 629) {
                    let result = await this.saveProject(base64String, ext);
                    ModalAlertSuccess("Proyecto", result.data, () => {
                        this.props.history.goBack();
                    });
                } else {
                    ModalAlertWarning("Proyecto", "La imagen a subir no tiene el tamaño establecido.");
                }
            } else {
                let result = await this.saveProject("", "");
                ModalAlertSuccess("Proyecto", result.data, () => {
                    this.props.history.goBack();
                });
            }
        } catch (error) {
            if (error.response !== undefined) {
                ModalAlertWarning("Proyecto", error.response.data)
            } else {
                ModalAlertWarning("Proyecto", "Se genero un error interno, intente nuevamente.")
            }
        }
    }

    async saveProject(image, extension) {
        if (this.state.idProyecto === "") {
            return await axios.post('/api/proyecto', {
                //datos
                "nombre": this.state.nombre.trim().toUpperCase(),
                "idSede": this.state.idSede.trim().toUpperCase(),
                "area": this.state.area.trim(),
                "estado": this.state.estado,
                //ubicacion
                "ubicacion": this.state.ubicacion.trim().toUpperCase(),
                "idUbigeo": this.state.idUbigeo,
                //limite
                "lnorte": this.state.lnorte.trim().toUpperCase(),
                "leste": this.state.leste.trim().toUpperCase(),
                "lsur": this.state.lsur.trim().toUpperCase(),
                "loeste": this.state.loeste.trim().toUpperCase(),
                //ajustes
                "idMoneda": this.state.idMoneda,
                "tea": isNumeric(this.state.tea) ? this.state.tea : 0,
                "preciometro": isNumeric(this.state.preciometro) ? this.state.preciometro : 0,
                "costoxlote": isNumeric(this.state.costoxlote) ? this.state.costoxlote : 0,
                "numContratoCorrelativo": this.state.numContratoCorrelativo.trim().toUpperCase(),
                "numRecibocCorrelativo": this.state.numRecibocCorrelativo.trim().toUpperCase(),
                //imagen
                "imagen": image === "" ? this.state.imageBase64 == null ? "" : this.state.imageBase64 : image,
                "extension": extension === "" ? this.state.extenBase64 == null ? "" : this.state.extenBase64 : extension,
                "idUsuario": this.state.idUsuario,
            });
        } else {
            return await axios.put('/api/proyecto', {
                //datos
                "nombre": this.state.nombre.trim().toUpperCase(),
                "idSede": this.state.idSede.trim().toUpperCase(),
                "area": this.state.area.trim(),
                "estado": this.state.estado,
                //ubicacion
                "ubicacion": this.state.ubicacion.trim().toUpperCase(),
                "idUbigeo": this.state.idUbigeo,
                //limite
                "lnorte": this.state.lnorte.trim().toUpperCase(),
                "leste": this.state.leste.trim().toUpperCase(),
                "lsur": this.state.lsur.trim().toUpperCase(),
                "loeste": this.state.loeste.trim().toUpperCase(),
                //ajustes
                "idMoneda": this.state.idMoneda,
                "tea": this.state.tea.toString().trim().toUpperCase(),
                "preciometro": this.state.preciometro.toString().trim().toUpperCase(),
                "costoxlote": this.state.costoxlote.toString().trim().toUpperCase(),
                "numContratoCorrelativo": this.state.numContratoCorrelativo.trim().toUpperCase(),
                "numRecibocCorrelativo": this.state.numRecibocCorrelativo.trim().toUpperCase(),
                //imagen
                "imagen": image === "" ? this.state.imageBase64 == null ? "" : this.state.imageBase64 : image,
                "extension": extension === "" ? this.state.extenBase64 == null ? "" : this.state.extenBase64 : extension,
                "idUsuario": this.state.idUsuario,
                "idProyecto": this.state.idProyecto,
            });
        }
    }

    async clearImage() {
        await this.setStateAsync({
            imagen: noImage
        })
        this.refFileImagen.current.value = "";
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

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> : null
                }

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <div className="form-group">
                                <h5>
                                    <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Proyectos
                                    <small className="text-secondary"> PROCESO</small>
                                </h5>
                            </div>
                        </div>
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
                                <a className="nav-link active" id="datos-tab" data-bs-toggle="tab" href="#datos" role="tab" aria-controls="datos" aria-selected="true"><i className="bi bi-info-circle"></i> Datos</a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a className="nav-link" id="ubicacion-tab" data-bs-toggle="tab" href="#ubicacion" role="tab" aria-controls="ubicacion" aria-selected="false"><i className="bi bi-geo-alt-fill"></i> Ubicación</a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a className="nav-link" id="limite-tab" data-bs-toggle="tab" href="#limite" role="tab" aria-controls="limite" aria-selected="false"><i className="bi bi-border-all"></i> Limite</a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a className="nav-link" id="ajustes-tab" data-bs-toggle="tab" href="#ajustes" role="tab" aria-controls="ajustes" aria-selected="false"><i className="bi bi-gear"></i> Ajustes</a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a className="nav-link" id="imagen-tab" data-bs-toggle="tab" href="#imagen" role="tab" aria-controls="imagen" aria-selected="false"><i className="bi bi-image"></i> Imagen</a>
                            </li>
                        </ul>
                        <div className="tab-content pt-2" id="myTabContent">

                            <div className="tab-pane fade show active" id="datos" role="tabpanel" aria-labelledby="datos-tab">
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Nombre de Proyecto: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtNombre}
                                            value={this.state.nombre}
                                            onChange={(event) => this.setState({ nombre: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Sede: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <select
                                            className="form-control"
                                            ref={this.refTxtSede}
                                            value={this.state.idSede}
                                            onChange={(event) => this.setState({ idSede: event.target.value })}
                                        >
                                            <option value="">- Seleccione -</option>
                                            {
                                                this.state.sedes.map((item, index) => (
                                                    <option key={index} value={item.idSede}>{item.nombreSede}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Area Total(m²): <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtArea}
                                            value={this.state.area}
                                            onChange={(event) => this.setState({ area: event.target.value })}
                                            placeholder="Dijite ..." />

                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Estado: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group">
                                            <select
                                                className="form-control"
                                                value={this.state.estado}
                                                onChange={(event) => this.setState({ estado: event.target.value })}
                                            >
                                                <option value="1">Venta</option>
                                                <option value="2">Litigio</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="tab-pane fade" id="ubicacion" role="tabpanel" aria-labelledby="ubicacion-tab">
                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <label>Ubicacion del Proyecto: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtUbicacion}
                                            value={this.state.ubicacion}
                                            onChange={(event) => this.setState({ ubicacion: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <label>Ubigeo: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <SearchBar
                                            placeholder="Escribe para iniciar a filtrar..."
                                            refTxtUbigeo={this.refTxtUbigeo}
                                            ubigeo={this.state.ubigeo}
                                            filteredData={this.state.filteredData}
                                            onEventClearInput={this.onEventClearInput}
                                            handleFilter={this.handleFilter}
                                            onEventSelectItem={this.onEventSelectItem}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="tab-pane fade" id="limite" role="tabpanel" aria-labelledby="limite-tab">
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Limite, Norte/Noreste:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.lnorte}
                                            onChange={(event) => this.setState({ lnorte: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Limite, Este/Sureste:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.leste}
                                            onChange={(event) => this.setState({ leste: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Limite, Sur/Suroeste:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.lsur}
                                            onChange={(event) => this.setState({ lsur: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Limite, Oeste/Noroeste:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.loeste}
                                            onChange={(event) => this.setState({ loeste: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                </div>
                            </div>

                            <div className="tab-pane fade" id="ajustes" role="tabpanel" aria-labelledby="ajustes-tab">

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Moneda: <i className="fa fa-asterisk text-danger small"></i></label>
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
                                        <label>TEA %: </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            ref={this.refTxtTea}
                                            value={this.state.tea}
                                            onChange={(event) => this.setState({ tea: event.target.value })}
                                            onKeyDown={keyNumberFloat}
                                            placeholder="Dijite ..." />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Precio Metro Cuadrado:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.preciometro}
                                            onChange={(event) => this.setState({ preciometro: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Coste Aproximado x Lote:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.costoxlote}
                                            onChange={(event) => this.setState({ costoxlote: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label>Número Contrato Correlativo:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.numContratoCorrelativo}
                                            onChange={(event) => this.setState({ numContratoCorrelativo: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Número Recibo Correlativo:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.numRecibocCorrelativo}
                                            onChange={(event) => this.setState({ numRecibocCorrelativo: event.target.value })}
                                            placeholder="Dijite ..." />
                                    </div>
                                </div>

                            </div>

                            <div className="tab-pane fade" id="imagen" role="tabpanel" aria-labelledby="imagen-tab">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="form-group">
                                            <div className="row">
                                                <div className="col-lg-8 col-md-10 col-sm-12 col-xs-12">
                                                    <img src={this.state.imagen} alt="" className="card-img-top" />
                                                    <p>Imagen de portada 1024 x 629 pixeles </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="form-group text-center">

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

                            </div>
                        </div>
                    </div>
                </div>

                <div className='row'>
                    <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Guardar</button>
                    <button type="button" className="btn btn-secondary ml-2" onClick={() => this.props.history.goBack()}>Cerrar</button>
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

export default connect(mapStateToProps, null)(ProcesoProyecto);