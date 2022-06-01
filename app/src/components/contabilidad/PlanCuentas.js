import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    ModalAlertDialog,
    viewModal,
    clearModal,
    showModal,
    hideModal,
    capitalizeFirstLetter
} from '../tools/Tools';
import { connect } from 'react-redux';
import { TreeTable } from '../../recursos/js/treeone.js';

class PlanCuentas extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            idConcepto: '',
            codigo: '',
            nombre: '',
            tipo: '',
            nivel: '',
            sistema: 0,
            estado: '',
            descripcion: '',
            idRelacion: '',
            idUsuario: '',

            cuentas: [],

            loading: true,

            tipoOperacion: '',

            loadModal: false,
            msgModal: 'Cargando datos...',
            messageWarning: '',


        }

        this.refTxtSearch = React.createRef();

        this.refCodigo = React.createRef()
        this.refNombre = React.createRef()

        // this.refNivel = React.createRef()
        // this.refTipo = React.createRef()
        // this.refAnalisis = React.createRef()

        this.abortControllerTable = new AbortController();

        this.pertenencia = '';
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadDataInit();

        viewModal("modalCuenta", () => {
            this.abortControllerModal = new AbortController();

            this.loadDataById(this.state.idConcepto, this.state.tipoOperacion)

        });

        clearModal("modalCuenta", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({

                idConcepto: '',
                codigo: '',
                nombre: '',
                tipo: '',
                nivel: '',
                sistema: 0,
                estado: '',
                descripcion: '',
                idRelacion: '',
                idUsuario: '',

                tipoOperacion: '',

                loadModal: false,
                msgModal: 'Cargando datos...',
                messageWarning: '',
            });

            this.pertenencia = '';
        });
    }

    componentWillUnmount() {
        this.abortControllerTable.abort();
    }

    createArray(arr, idRelacion) {
        let output = []
        for (const obj of arr) {
            if (obj.idRelacion === idRelacion) {
                let children = this.createArray(arr, obj.idConcepto)

                if (children.length) {
                    obj.children = children
                } else {
                    obj.children = []
                }
                output.push(obj)
            }
        }
        return output
    }

    async loadDataInit() {

        await this.setStateAsync({
            loading: true,
        });

        try {
            let result = await axios.get("/api/concepto/listcuentas", {
                signal: this.abortControllerTable.signal,
            });

            let listTree = this.createArray(result.data, "");

            await this.setStateAsync({
                cuentas: listTree,
                loading: false,
            });

            new TreeTable("#cuentaTable");

        } catch (error) {
            await this.setStateAsync({
                loading: true,
            });

        }
    }

    openModal = async (idConcepto, operacion) => {

        await this.setStateAsync({ idConcepto: idConcepto, loadModal: true, tipoOperacion: operacion === 'nuevo' ? 'nuevo' : 'editar' });
        showModal('modalCuenta')

    }

    async loadDataById(id, operacion) {

        try {

            let result = await axios.get("/api/concepto/idcuenta", {
                signal: this.abortControllerModal.signal,
                params: {
                    "idConcepto": id
                }
            });

            this.pertenencia = result.data.nombre

            if (operacion === 'nuevo') {
                // Para nuevo
                await this.setStateAsync({
                    idConcepto: result.data.idConcepto,

                    tipo: result.data.tipo,
                    nivel: result.data.nivel,
                    estado: result.data.estado,

                    idUsuario: this.props.token.userToken.idUsuario,

                    loadModal: false
                });
            } else {
                // Para editar
                await this.setStateAsync({
                    idConcepto: result.data.idConcepto,

                    codigo: result.data.codigo,
                    nombre: result.data.nombre,
                    descripcion: result.data.descripcion,
                    sistema: result.data.sistema,

                    idUsuario: this.props.token.userToken.idUsuario,

                    loadModal: false
                });
            }

            // console.log(this.pertenencia)

        } catch (error) {
            console.log(error);
        }
    }

    onEventGuardar() {

        if (this.state.codigo === '') {
            this.setState({ messageWarning: "Ingrese el codigo de la cuenta" });
            this.refCodigo.current.focus();
        } else if (this.state.nombre === '') {
            this.setState({ messageWarning: "Ingrese el nombre de la cuenta" });
            this.refNombre.current.focus();
        } else {

            this.onSave();
        }

    }

    async onSave() {
        try {

            ModalAlertInfo("Cuenta", "Procesando información...");

            hideModal("modalCuenta");

            if (this.state.tipoOperacion === "nuevo") {

                const result = await axios.post("/api/concepto/addcuenta", {

                    "codigo": this.state.codigo.trim(),
                    "nombre": this.state.nombre.trim().toUpperCase(),
                    "tipo": this.state.tipo,
                    "nivel": parseInt(this.state.nivel) + 1,
                    "sistema": this.state.sistema,
                    "estado": this.state.estado,
                    "descripcion": this.state.descripcion.trim().toUpperCase(),
                    "idRelacion": this.state.idConcepto,
                    "idUsuario": this.state.idUsuario
                })

                ModalAlertSuccess("Cuenta", result.data, () => {
                    this.loadDataInit()
                });

            } else {

                const result = await axios.post("/api/concepto/updatecuenta", {

                    "codigo": this.state.codigo.trim(),
                    "nombre": this.state.nombre.trim().toUpperCase(),
                    "sistema": this.state.sistema,
                    "descripcion": this.state.descripcion.trim().toUpperCase(),
                    "idUsuario": this.state.idUsuario,
                    "idConcepto": this.state.idConcepto

                })

                ModalAlertSuccess("Cuenta", result.data, () => {
                    this.loadDataInit()
                });

            }


        } catch (error) {
            if (error.response !== undefined) {
                ModalAlertWarning("Cuenta", error.response.data)
            } else {
                ModalAlertWarning("Cuenta", "Se genero un error interno, intente nuevamente.")
            }
        }
    }

    recargarLista() {
        this.refTxtSearch.current.value = '';
        this.refTxtSearch.current.focus();

        this.loadDataInit();
    }

    eliminarCuenta = (id, codigo, nombre) => {

        ModalAlertDialog("Plan de cuentas", `¿Estás seguro de eliminar la cuenta: ${codigo === '' ? '' : codigo + ' - '}  ${nombre}?`, async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Plan de cuentas", "Procesando información...");

                    let result = await axios.delete("/api/concepto/deletecuenta", {
                        params: {
                            "idConcepto": id
                        }
                    })

                    ModalAlertSuccess("Plan de cuentas", result.data, () => {
                        this.loadDataInit();
                    });

                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Plan de cuentas", error.response.data)
                    } else {
                        ModalAlertWarning("Plan de cuentas", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>

                {/* Inicio modal*/}
                <div className="modal fade" id="modalCuenta" data-backdrop="static">
                    <div className="modal-dialog modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{`${capitalizeFirstLetter(this.state.tipoOperacion)} cuenta`}</h5>
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
                                        {
                                            this.state.tipoOperacion === 'nuevo' ?
                                                <span>Pertenece: <strong>{this.pertenencia}</strong></span>
                                                : <strong>{this.pertenencia}</strong>
                                        }

                                    </div>
                                    <div className="form-group col-md-12">
                                        <label>codigo <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group input-group-sm">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ingrese el codigo de la cuenta"
                                                ref={this.refCodigo}
                                                value={this.state.codigo}
                                                onChange={(event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        this.setState({
                                                            codigo: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            codigo: event.target.value,
                                                            messageWarning: 'Ingrese el codigo',
                                                        });
                                                    }
                                                }} />
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label>Nombre <i className="fa fa-asterisk text-danger small"></i></label>
                                        <div className="input-group input-group-sm">
                                            <textarea
                                                type="text"
                                                className="form-control"
                                                placeholder="Ingrese el nombre de la cuenta"
                                                ref={this.refNombre}
                                                value={this.state.nombre}
                                                onChange={(event) => {
                                                    if (event.target.value.trim().length > 0) {
                                                        this.setState({
                                                            nombre: event.target.value,
                                                            messageWarning: '',
                                                        });
                                                    } else {
                                                        this.setState({
                                                            nombre: event.target.value,
                                                            messageWarning: 'Ingrese el nombre de la cuenta',
                                                        });
                                                    }
                                                }} >
                                            </textarea>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label>Descripción:</label>
                                        <div className="input-group input-group-sm">
                                            <textarea
                                                className="form-control"
                                                placeholder="Ingrese la descripcion de la cuenta"
                                                value={this.state.descripcion}
                                                onChange={(event) => this.setState({ descripcion: event.target.value })} >
                                            </textarea>
                                        </div>
                                    </div>
                                    <div className="form-group col-md-12">
                                        <label>Sistema:</label>
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="switch1"
                                                checked={this.state.sistema}
                                                onChange={(value) => this.setState({ sistema: value.target.checked })} />
                                            <label className="custom-control-label" htmlFor="switch1">{this.state.sistema === 1 || this.state.sistema === true ? "Activo" : "Inactivo"}</label>
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
                {/* fin modal*/}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Plan de cuentas <small className="text-secondary"> CATALOGO</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">

                        <div className="form-group">
                            <div className="input-group input-group-sm">
                                <div className="input-group-prepend">
                                    <div className="input-group-text btn-sm"><i className="bi bi-search"></i></div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por codigo o nombre..."
                                    ref={this.refTxtSearch}
                                    onKeyUp={(event) => this.searchText(event.target.value)} />
                                <span className="btn btn-outline-secondary btn-sm ml-1" role="button" title="Recargar tabla" onClick={() => this.recargarLista()}><i className="bi bi-arrow-clockwise"></i></span>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="table-responsive">

                                <table className="table table-bordered table-hover rounded ">
                                    <thead>
                                        <tr>
                                            <th className="p-1" width="5%">Codigo</th>
                                            <th className="p-1" width="95%">Cuenta</th>
                                            {/* <th className="p-1" width="50%">Descripción</th> */}
                                            <th className="p-1" width="auto">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="cuentaTable">
                                        {
                                            this.state.loading ? (
                                                <tr>
                                                    <td className="text-center" colSpan="3">
                                                        {spinnerLoading()}
                                                    </td>
                                                </tr>
                                            ) : this.state.cuentas.length === 0 ? (
                                                <tr className="text-center">
                                                    <td colSpan="3">¡No hay datos registrados!</td>
                                                </tr>
                                            ) : (
                                                <OptionsList options={this.state.cuentas}
                                                    openModal={this.openModal} eliminarCuenta={this.eliminarCuenta} />
                                            )
                                        }

                                    </tbody>
                                </table>
                                {/* <table>
                                    <tbody>
                                    <OptionsList options={this.state.cuentas}
                                            openModal={this.openModal} />
                                    </tbody>
                                </table> */}
                            </div>
                        </div>

                    </div>

                </div>

            </>
        )
    }
}

const OptionsList = ({ options, openModal, eliminarCuenta }) => {

    // return (
    //     <>
    //         {
    //             options.map((option, index) => {
    //                 if (option.children.length === 0) {
    //                     return <tr key={++index}><td>{option.nombre}</td></tr>
    //                 } else {
    //                     return (

    //                         <tr key={++index}>
    //                             <td>{option.nombre}</td>
    //                         </tr>


    //                     )
    //                 }
    //             })
    //         }
    //     </>
    // )

    return (
        <>
            {options.map((option, index) => {
                if (option.children.length === 0) {
                    return (
                        <tr key={++index} data-idrow={option.nivel} data-idtr={option.idConcepto} data-subidtr={option.idRelacion} style={{ "fontSize": "12px" }}>
                            <td className="p-1">
                                <span className={option.sistema === 1 ? 'font-weight-bold text-primary' : ''}>
                                    {option.codigo}
                                </span>
                            </td>
                            <td className="p-1">
                                <div>
                                    {
                                        Array.from({ length: (option.nivel + 1) }).map(() => (
                                            <img
                                                src={"data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="}
                                                alt=""
                                                className="x-tree-elbow-line" />
                                        ))
                                    }
                                    <span className='mr-1 mt-1 mb-1 fa fa-plus-square opacity-0'></span>
                                    <span className="x-tree-node-text"><i className='fa fa-money'></i><span className={option.sistema === 1 ? 'font-weight-bold text-primary' : ''}>{` ${option.nombre}`}</span></span>
                                </div>
                            </td>
                            {/* <td>{option.descripcion}</td> */}
                            <td className="d-flex p-1">
                                <button className="btn btn-info btn-sm" title="Nueva cuenta" onClick={() => openModal(option.idConcepto, 'nuevo')}><i className="bi bi-plus-circle-fill"></i></button>
                                <button className="btn btn-warning btn-sm ml-1" title="Editar cuenta" onClick={() => openModal(option.idConcepto, 'editar')}><i className="bi bi-pencil-fill"></i></button>
                                <button className="btn btn-danger btn-sm ml-1" title="Eliminar cuenta" disabled={option.idRelacion === '' ? true : false} onClick={() => eliminarCuenta(option.idConcepto, option.codigo, option.nombre)}><i className="bi bi-trash"></i></button>
                            </td>
                        </tr>)
                } else {
                    return (<>
                        <tr key={++index} data-idrow={option.nivel} data-idtr={option.idConcepto} data-subidtr={option.idRelacion} style={{ "fontSize": "12px" }}>
                            <td className="p-1">
                                <span className={option.sistema === 1 ? 'font-weight-bold text-primary' : ''}>
                                    {option.codigo}
                                </span>
                            </td>
                            <td className="p-1">
                                <div>
                                    {
                                        Array.from({ length: (option.nivel + 1) }).map(() => (
                                            <img
                                                src={"data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="}
                                                alt=""
                                                className="x-tree-elbow-line" />
                                        ))
                                    }
                                    <i className='cursor-pointer mr-1 mt-1 mb-1 fa fa-plus-square' data-idbtn={option.idConcepto}></i>
                                    <span className="x-tree-node-text"><i className='fa fa-money'></i><span className={option.sistema === 1 ? 'font-weight-bold text-primary' : ''}>{` ${option.nombre}`}</span></span>
                                </div>
                            </td>
                            {/* <td>{option.descripcion}</td> */}
                            <td className="d-flex p-1">
                                <button className="btn btn-info btn-sm" title="Nueva cuenta" onClick={() => openModal(option.idConcepto, 'nuevo')}><i className="bi bi-plus-circle-fill"></i></button>
                                <button className="btn btn-warning btn-sm ml-1" title="Editar cuenta" onClick={() => openModal(option.idConcepto, 'editar')}><i className="bi bi-pencil-fill"></i></button>
                                <button className="btn btn-danger btn-sm ml-1" title="Eliminar cuenta" disabled={option.idRelacion === '' ? true : false} onClick={() => eliminarCuenta(option.idConcepto, option.codigo, option.nombre)}><i className="bi bi-trash"></i></button>
                            </td>
                        </tr>

                        {(option.children.length) &&
                            <OptionsList
                                options={option.children}
                                openModal={openModal}
                                eliminarCuenta={eliminarCuenta}
                            />}
                    </>
                    )
                }

            })
            }
        </>
    )
}


const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(PlanCuentas);
