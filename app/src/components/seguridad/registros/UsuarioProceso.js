import React from 'react';
import axios from 'axios';
import {
    keyNumberPhone,
    isNumeric,
    keyNumberFloat,
    getExtension,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading
} from '../../tools/Tools';
import { connect } from 'react-redux';

class UsuarioProceso extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            idUsuario: '',

            nombres: '',
            apellidos: '',
            dni: '',
            genero: '',
            direccion: '',
            telefono: '',
            email: '',

            idPerfil: '',
            perfiles: [],
            representante: '',
            estado: '1',
            usuario: '',
            clave: '',
            configClave: '',

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',
        }

        this.refNombres = React.createRef();
        this.refApellidos = React.createRef();
        this.refDni = React.createRef();
        this.refGenero = React.createRef();
        this.refDireccion = React.createRef();
        this.refTelefono = React.createRef();
        this.refEmail = React.createRef();

        this.refPerfil = React.createRef();
        this.refRepresentante = React.createRef();
        // this.refEstado = React.createRef()
        this.refUsuario = React.createRef();
        this.refClave = React.createRef();
        this.refConfigClave = React.createRef();

        this.abortController = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        const url = this.props.location.search;
        const idResult = new URLSearchParams(url).get("idUsuario");
        if (idResult !== null) {
            this.loadDataId(idResult)
        } else {
            this.loadData();
        }
    }

    componentWillUnmount() {
        this.abortController.abort();
    }

    loadData = async () => {
        try {
            const perfil = await axios.get("/api/perfil/listcombo", {
                signal: this.abortController.signal,
            });

            await this.setStateAsync({
                perfiles: perfil.data,
                loading: false,
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    loadDataId = async (id) => {
        try {
            const perfil = await axios.get("/api/perfil/listcombo", {
                signal: this.abortController.signal,
            });

            const result = await axios.get("/api/usuario/id", {
                signal: this.abortController.signal,
                params: {
                    idUsuario: id
                }
            });

            await this.setStateAsync({
                nombres: result.data.nombres,
                apellidos: result.data.apellidos,
                dni: result.data.dni,
                genero: result.data.genero,
                direccion: result.data.direccion,
                telefono: result.data.telefono,
                email: result.data.email,

                perfiles: perfil.data,
                idPerfil: result.data.idPerfil,
                representante: result.data.representante,
                estado: result.data.estado,
                usuario: result.data.usuario,
                clave: result.data.clave,
                configClave: result.data.clave,

                idUsuario: result.data.idUsuario,
                loading: false
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
        if (this.state.dni === "") {
            this.setState({ messageWarning: "Ingrese el numero de DNI" })
            this.onFocusTab("datos-tab", "datos");
            this.refDni.current.focus();
            return;
        }

        if (this.state.nombres === "") {
            this.setState({ messageWarning: "Ingrese los nombres" });
            this.onFocusTab("datos-tab", "datos");
            this.refNombres.current.focus();
            return;
        }

        if (this.state.apellidos === "") {
            this.setState({ messageWarning: "Ingrese los apellidos" })
            this.onFocusTab("datos-tab", "datos");
            this.refApellidos.current.focus();
            return;
        }

        if (this.state.genero === "") {
            this.setState({ messageWarning: "Seleccione el genero" });
            this.onFocusTab("datos-tab", "datos");
            this.refGenero.current.focus();
            return;
        }

        if (this.state.direccion === "") {
            this.setState({ messageWarning: "Ingrese la dirección" });
            this.onFocusTab("datos-tab", "datos");
            this.refDireccion.current.focus();
            return;
        }

        try {
            ModalAlertInfo("Usuario", "Procesando información...");

            if (this.state.idUsuario !== '') {
                let result = await axios.put('/api/usuario/', {
                    //datos
                    "nombres": this.state.nombres.trim().toUpperCase(),
                    "apellidos": this.state.apellidos.trim().toUpperCase(),
                    "dni": this.state.dni.toString().trim().toUpperCase(),
                    "genero": this.state.genero,
                    "direccion": this.state.direccion.trim().toUpperCase(),
                    "telefono": this.state.telefono.toString().trim().toUpperCase(),
                    "email": this.state.email.trim().toUpperCase(),
                    //login
                    "idPerfil": this.state.idPerfil.trim().toUpperCase(),
                    "representante": this.state.representante,
                    "estado": this.state.estado,
                    "usuario": this.state.usuario.trim().toUpperCase(),
                    "clave": this.state.clave.trim().toUpperCase(),

                    //idUsuario
                    "idUsuario": this.state.idUsuario
                })
                ModalAlertSuccess("Usuario", result.data, () => {
                    this.props.history.goBack();
                });

            } else {
                if (this.state.clave !== this.state.configClave) {
                    this.setState({ messageWarning: "Las contraseñas no coinciden" });
                    this.onFocusTab("login-tab", "login");
                    this.refConfigClave.current.focus();
                } else {
                    let result = await axios.post('/api/usuario/', {
                        //datos
                        "nombres": this.state.nombres.trim().toUpperCase(),
                        "apellidos": this.state.apellidos.trim().toUpperCase(),
                        "dni": this.state.dni.toString().trim().toUpperCase(),
                        "genero": this.state.genero,
                        "direccion": this.state.direccion.trim().toUpperCase(),
                        "telefono": this.state.telefono.toString().trim().toUpperCase(),
                        "email": this.state.email.trim().toUpperCase(),
                        //login
                        "idPerfil": this.state.idPerfil.trim().toUpperCase(),
                        "representante": this.state.representante,
                        "estado": this.state.estado,
                        "usuario": this.state.usuario.trim().toUpperCase(),
                        "clave": this.state.clave.trim().toUpperCase(),
                    });

                    ModalAlertSuccess("Usuario", result.data, () => {
                        this.props.history.goBack();
                    });
                }
            }
        } catch (error) {
            if (error.response !== undefined) {
                ModalAlertWarning("Usuario", error.response.data);
            } else {
                ModalAlertWarning("Usuario", "Se produjo un error un interno, intente nuevamente.");
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
                                    <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> {this.state.idUsuario === '' ? 'Registrar Usuario' : 'Editar Usuario'}
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
                                <a className="nav-link active" id="datos-tab" data-bs-toggle="tab" href="#datos" role="tab" aria-controls="datos" aria-selected="true">
                                    <i className="bi bi-info-circle"></i> Datos
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a className="nav-link" id="login-tab" data-bs-toggle="tab" href="#login" role="tab" aria-controls="login" aria-selected="false">
                                    <i className="bi bi-person-workspace"></i> Login
                                </a>
                            </li>
                        </ul>

                        <div className="tab-content pt-2" id="myTabContent">
                            <div className="tab-pane fade show active" id="datos" role="tabpanel" aria-labelledby="datos-tab">

                                <div className="form-group">
                                    <label htmlFor="dni">Dni <i className="fa fa-asterisk text-danger small"></i></label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="dni"
                                        value={this.state.dni}
                                        ref={this.refDni}
                                        onChange={(event) => {
                                            if (event.target.value.trim().length > 0) {
                                                this.setState({
                                                    dni: event.target.value,
                                                    messageWarning: '',
                                                });
                                            } else {
                                                this.setState({
                                                    dni: event.target.value,
                                                    messageWarning: 'Ingrese el numero de DNI',
                                                });
                                            }
                                        }}
                                        placeholder='Ingrese el numero de DNI' />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="nombres">Nombre(s) <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nombres"
                                            value={this.state.nombres}
                                            ref={this.refNombres}
                                            onChange={(event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    this.setState({
                                                        nombres: event.target.value,
                                                        messageWarning: '',
                                                    });
                                                } else {
                                                    this.setState({
                                                        nombres: event.target.value,
                                                        messageWarning: 'Ingrese los nombres',
                                                    });
                                                }
                                            }}
                                            placeholder='Ingrese los nombres' />
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label htmlFor="apellidos">Apellidos <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="apellidos"
                                            value={this.state.apellidos}
                                            ref={this.refApellidos}
                                            onChange={(event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    this.setState({
                                                        apellidos: event.target.value,
                                                        messageWarning: '',
                                                    });
                                                } else {
                                                    this.setState({
                                                        apellidos: event.target.value,
                                                        messageWarning: 'Ingrese los apellidos',
                                                    });
                                                }
                                            }}
                                            placeholder='ingrese apellidos del usuario' />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="genero">Genero <i className="fa fa-asterisk text-danger small"></i></label>
                                    <select
                                        className="form-control"
                                        id="genero"
                                        value={this.state.genero}
                                        ref={this.refGenero}
                                        onChange={(event) => {
                                            if (event.target.value.trim().length > 0) {
                                                this.setState({
                                                    genero: event.target.value,
                                                    messageWarning: '',
                                                });
                                            } else {
                                                this.setState({
                                                    genero: event.target.value,
                                                    messageWarning: 'Seleccione el genero.',
                                                });
                                            }
                                        }}>
                                        <option value="">-- Seleccione --</option>
                                        <option value="1">Masculino</option>
                                        <option value="2">Femenino</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="direccion">Dirección <i className="fa fa-asterisk text-danger small"></i></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="direccion"
                                        value={this.state.direccion}
                                        ref={this.refDireccion}
                                        onChange={(event) => {
                                            if (event.target.value.trim().length > 0) {
                                                this.setState({
                                                    direccion: event.target.value,
                                                    messageWarning: '',
                                                });
                                            } else {
                                                this.setState({
                                                    direccion: event.target.value,
                                                    messageWarning: 'Ingrese el N° de dirección',
                                                });
                                            }
                                        }}
                                        placeholder='Ingrese la dirección' />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="telefono">Telefono o celular</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="telefono"
                                            value={this.state.telefono}
                                            ref={this.refTelefono}
                                            onChange={(event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    this.setState({
                                                        telefono: event.target.value,
                                                        messageWarning: '',
                                                    });
                                                } else {
                                                    this.setState({
                                                        telefono: event.target.value,
                                                        messageWarning: 'Ingrese el N° de telefono',
                                                    });
                                                }
                                            }}
                                            onKeyPress={keyNumberPhone}
                                            placeholder='Ingrese el N° de telefono' />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="email">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            value={this.state.email}
                                            ref={this.refEmail}
                                            onChange={(event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    this.setState({
                                                        email: event.target.value,
                                                        messageWarning: '',
                                                    });
                                                } else {
                                                    this.setState({
                                                        email: event.target.value,
                                                        messageWarning: 'Ingrese el email',
                                                    });
                                                }
                                            }}
                                            placeholder='Ingrese el email' />
                                    </div>
                                </div>

                            </div>

                            <div className="tab-pane fade" id="login" role="tabpanel" aria-labelledby="login-tab">

                                <div className="form-group">
                                    <label htmlFor="perfil">Perfil</label>
                                    <select
                                        className="form-control"
                                        ref={this.refPerfil}
                                        value={this.state.idPerfil}
                                        onChange={(event) => this.setState({ idPerfil: event.target.value })}
                                    >
                                        <option value="">- Seleccione -</option>
                                        {
                                            this.state.perfiles.map((item, index) => (
                                                <option key={index} value={item.idPerfil}>{item.descripcion}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="representante">¿Representante?</label>
                                        <select
                                            className="form-control"
                                            id="representante"
                                            value={this.state.representante}
                                            ref={this.refRepresentante}
                                            onChange={(event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    this.setState({
                                                        representante: event.target.value,
                                                        messageWarning: '',
                                                    });
                                                } else {
                                                    this.setState({
                                                        representante: event.target.value,
                                                        messageWarning: 'Seleccione si es representante',
                                                    });
                                                }
                                            }}>
                                            <option value="">-- seleccione --</option>
                                            <option value="1">Si</option>
                                            <option value="2">No</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="estado">Estado</label>
                                        <select
                                            className="form-control"
                                            id="estado"
                                            value={this.state.estado}
                                            // ref={this.refEstado}
                                            onChange={(event) => this.setState({ estado: event.target.value })}>
                                            <option value="1">Activo</option>
                                            <option value="2">Inactivo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="usuario">usuario</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="usuario"
                                        value={this.state.usuario}
                                        ref={this.refUsuario}
                                        onChange={(event) => {
                                            if (event.target.value.trim().length > 0) {
                                                this.setState({
                                                    usuario: event.target.value,
                                                    messageWarning: '',
                                                });
                                            } else {
                                                this.setState({
                                                    usuario: event.target.value,
                                                    messageWarning: 'Ingrese el usuario',
                                                });
                                            }
                                        }}
                                        placeholder='Ingrese el usuario' />
                                </div>

                                {
                                    this.state.idUsuario === "" ?
                                        <div className="form-row">
                                            <div className="form-group col-md-6">
                                                <label htmlFor="contraseña">Contraseña</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    id="contraseña"
                                                    value={this.state.clave}
                                                    ref={this.refClave}
                                                    onChange={(event) => {
                                                        if (event.target.value.trim().length > 0) {
                                                            this.setState({
                                                                clave: event.target.value,
                                                                messageWarning: '',
                                                            });
                                                        } else {
                                                            this.setState({
                                                                clave: event.target.value,
                                                                messageWarning: 'Ingrese la contraseña',
                                                            });
                                                        }
                                                    }}
                                                    placeholder='Ingrese la contraseña' />
                                            </div>
                                            <div className="form-group col-md-6">
                                                <label htmlFor="contraseña2">Confirmar Contraseña</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    id="contraseña2"
                                                    value={this.state.configClave}
                                                    ref={this.refConfigClave}
                                                    onChange={(event) => {
                                                        if (event.target.value.trim().length > 0) {
                                                            this.setState({
                                                                configClave: event.target.value,
                                                                messageWarning: '',
                                                            });
                                                        } else {
                                                            this.setState({
                                                                configClave: event.target.value,
                                                                messageWarning: 'Ingrese contraseña nuevamente',
                                                            });
                                                        }
                                                    }}
                                                    placeholder='Ingrese contraseña nuevamente' />
                                            </div>
                                        </div>
                                        : null
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Aceptar</button>
                    <button type="button" className="btn btn-danger" onClick={() => this.props.history.goBack()}>Cerrar</button>
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

export default connect(mapStateToProps, null)(UsuarioProceso);