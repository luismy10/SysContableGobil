import React from 'react';
import axios from 'axios';
import { getCookie } from '../tools/Tools';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { signIn } from '../../redux/actions';
import logoEmpresa from '../../recursos/images/INMOBILIARIA.png';
import './Login.css';

class Login extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            usuario: '',
            password: '',
            message: '',
            loading: false
        }

        this.usuarioInput = React.createRef();
        this.passwordInput = React.createRef();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        if (this.usuarioInput.current !== null) {
            this.usuarioInput.current.focus();
        }
        window.addEventListener('focus', this.onEventFocused)
    }

    componentWillUnmount() {
        window.removeEventListener('focus', this.onEventFocused)
    }

    onEventFocused =(event)=> {
        let userToken = window.localStorage.getItem('login');        
        if (userToken !== null) {
            this.props.restore(JSON.parse(userToken));
            this.props.history.push("principal");
        }
    }

    onEventForm = async () => {
        if (this.state.loading) return;

        if (this.state.usuario === "") {
            this.usuarioInput.current.focus();
            await this.setStateAsync({ message: "Ingrese su usuario para iniciar sesión." });
            return;
        }

        if (this.state.password === "") {
            this.passwordInput.current.focus();
            await this.setStateAsync({ message: "Ingrese su contraseña para iniciar sesión." });
            return;
        }

        try {

            await this.setStateAsync({ loading: true });

            let result = await axios.get('/api/login/createsession', {
                params: {
                    "usuario": this.state.usuario,
                    "password": this.state.password
                }
            });

            let menus = result.data.menu.map((item, index) => {
                let submenu = [];
                for (let value of result.data.submenu) {
                    let privilegio = [];
                    if (item.idMenu === value.idMenu) {

                        for (let content of result.data.privilegio) {
                            if (content.idSubMenu === value.idSubMenu && item.idMenu === content.idMenu) {
                                privilegio.push({
                                    "estado": content.estado,
                                    "idMenu": content.idMenu,
                                    "idPrivilegio": content.idPrivilegio,
                                    "idSubMenu": content.idSubMenu,
                                    "nombre": content.nombre,
                                });
                            }
                        }

                        submenu.push({
                            "estado": value.estado,
                            "idMenu": value.idMenu,
                            "idSubMenu": value.idSubMenu,
                            "nombre": value.nombre,
                            "ruta": value.ruta,
                            "privilegio": privilegio
                        });
                    }
                }

                return {
                    ...item,
                    submenu
                }
            });

            let user = {
                "apellidos": result.data.apellidos,
                "estado": result.data.estado,
                "idUsuario": result.data.idUsuario,
                "nombres": result.data.nombres,
                "token": result.data.token,
                menus
            }

            window.localStorage.setItem('login', JSON.stringify(user));
            this.props.restore(JSON.parse(window.localStorage.getItem('login')));
            this.props.history.push("principal");
            // document.cookie = `token=${user.data.token}; max-age=${10}; path=/; samesite=strict`;

        } catch (error) {
            if (error.response !== undefined) {
                await this.setStateAsync({ loading: false, message: error.response.data });
            } else {
                await this.setStateAsync({ loading: false, message: "Se genero un error de cliente, intente nuevamente." });
            }
        }
    }

    onEventRecuperar = () => {
        console.log(getCookie("token"))
        window.open("/api/login/report", "_blank");
    }

    handleChangeUsuario = (event) => {
        if (event.target.value.length > 0) {
            this.setState({
                usuario: event.target.value,
                message: ""
            });
        } else {
            this.setState({
                usuario: event.target.value,
                message: "Ingrese su usuario para iniciar sesión."
            });
        }
    }

    handleChangePassword = (event) => {
        if (event.target.value.length > 0) {
            this.setState({
                password: event.target.value,
                message: ""
            });
        } else {
            this.setState({
                password: event.target.value,
                message: "Ingrese su contraseña para iniciar sesión."
            });
        }
    }

    render() {

        const { usuario, password, message } = this.state;
        if (this.props.token.userToken != null) {
            return <Redirect to="/principal" />
        }

        return (
            <>
                <style>{'html,body,#root{height:100%;}'}</style>

                <div className="form-content text-center bg-white">
                    <form className="form-signin">
                        <img className="mb-4" src={logoEmpresa} alt="Logo" width="150" />
                        <h1 className="h3 mb-3 font-weight-normal">Ingrese los datos</h1>
                        {
                            message !== "" ?
                                <div className="alert alert-warning d-flex align-items-center" role="alert">
                                    <i className="bi bi-exclamation-diamond-fill m-1"></i>
                                    <div className=" m-1">
                                        {message}
                                    </div>
                                </div> : null
                        }

                        {
                            this.state.loading ?
                                <div className="m-3">
                                    <div className="spinner-border text-success" role="status">
                                    </div>
                                </div>
                                : null
                        }

                        <label htmlFor="inputUsuario" className="sr-only">Usuario</label>
                        <input
                            ref={this.usuarioInput}
                            onChange={this.handleChangeUsuario}
                            value={usuario}
                            type="text"
                            id="inputUsuario"
                            className="form-control"
                            placeholder="Ingrese su suario"
                            required=""
                            autoFocus=""
                            onKeyUp={(event) => {
                                if (event.keyCode === 13 || event.which === 13) {
                                    this.onEventForm();
                                    event.preventDefault();
                                }
                            }} />

                        <label htmlFor="inputPassword" className="sr-only">Password</label>
                        <input
                            ref={this.passwordInput}
                            onChange={this.handleChangePassword}
                            value={password}
                            type="password"
                            id="inputPassword"
                            className="form-control"
                            placeholder="Contraseña"
                            required=""
                            onKeyUp={(event) => {
                                if (event.keyCode === 13 || event.which === 13) {
                                    this.onEventForm();
                                    event.preventDefault();
                                }
                            }} />

                        <div className="checkbox mb-3">
                            <label>
                                <input type="checkbox" value="remember-me" /> Recuerdame
                            </label>
                        </div>
                        <button onClick={this.onEventForm} type="button" className="btn btn-lg btn-primary btn-block">Ingresar</button>
                        {/* <button onClick={this.onEventRecuperar} type="button" className="btn btn-lg btn-outline-primary btn-block">Recuperar</button> */}
                        <p className="mt-5 mb-3 text-muted">© 2022</p>
                    </form>
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

const mapDispatchToProps = (dispatch) => {
    return {
        restore: (user) => dispatch(signIn(user))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);