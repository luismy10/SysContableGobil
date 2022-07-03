import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
} from '../../tools/Tools';

class ModalMedida extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            detalleMedidas: [],
            idTempMedida: '',
            newNameMedida: '',
            codigoMedida: '',
            loadModalTable: false,
            msgModalTable: 'Cargando datos...',
            msgWarningModal: '',
        }

        this.refNewNameMedida = React.createRef()
        this.refSearchMedida = React.createRef()

        this.abortControllerModal = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.initLoadModal(0, '');
    }

    componentWillUnmount() {
        this.abortControllerModal.abort();
    }

    initLoadModal = async (opcion, buscar) => {
        try {
            await this.setStateAsync({ loadModalTable: true })
            const medida = await axios.get("/api/producto/listmedida", {
                signal: this.abortControllerModal.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar
                }
            });

            await this.setStateAsync({
                detalleMedidas: medida.data,
                idTempMedida: '',
                newNameMedida: '',
                codigoMedida: '',
                loadModalTable: false,
                msgModalTable: 'Cargando datos...',
                msgWarningModal: '',
            })

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgModalTable: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    searchText = async (text) => {
        this.initLoadModal(1, text);
    }

    async onSaveMedida() {
        if (this.state.newNameMedida === '') {
            this.setState({ msgWarningModal: 'Ingrese el nombre.' })
            this.refNewNameMedida.current.focus();
            return;
        }
        try {
            ModalAlertInfo("Medida", "Procesando información...");
            if (this.state.idTempMedida !== "") {
                const editar = await axios.post('/api/producto/updatemedida', {
                    "nombre": this.state.newNameMedida.trim().toUpperCase(),
                    "codigo": this.state.codigoMedida.trim().toUpperCase(),
                    "idMedida": this.state.idTempMedida
                })
                ModalAlertSuccess("Medida", editar.data, () => {
                    this.initLoadModal(0, "");
                    this.refSearchMedida.current.value = '';
                });
            } else {
                const agregar = await axios.post("/api/producto/addmedida", {
                    "nombre": this.state.newNameMedida.trim().toUpperCase(),
                    "codigo": this.state.codigoMedida.trim().toUpperCase()
                })
                ModalAlertSuccess("Medida", agregar.data, () => {
                    this.initLoadModal(0, "")
                    this.refSearchMedida.current.value = '';
                });
            }
        } catch (error) {
            if (error.response !== undefined) {
                ModalAlertWarning("Medida", error.response.data)
            } else {
                ModalAlertWarning("Medida", "Se genero un error interno, intente nuevamente.")
            }
        }
    }

    render() {
        return (
            <div className="modal fade" id={this.props.idModal} data-bs-keyboard="false" data-bs-backdrop="static">
                <div className={`modal-dialog ${this.props.sizeModal}`}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{this.props.titleModal}</h5>
                            <button type="button" className="close" onClick={ ()=>this.props.closeMedidaModal()}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {
                                this.state.msgWarningModal === '' ? null :
                                    <div className="alert alert-warning" role="alert">
                                        <i className="bi bi-exclamation-diamond-fill"></i> {this.state.msgWarningModal}
                                    </div>
                            }
                            <div className="form-row">
                                <div className="form-group col-md-6">
                                    <label>Nombre <i className="fa fa-asterisk text-danger small"></i></label>
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el nombre"
                                            maxLength={250}
                                            ref={this.refNewNameMedida}
                                            value={this.state.newNameMedida}
                                            onChange={async (event) => {
                                                if (event.target.value.trim().length > 0) {
                                                    await this.setStateAsync({
                                                        newNameMedida: event.target.value,
                                                        msgWarningModal: ''
                                                    });
                                                } else {
                                                    await this.setStateAsync({
                                                        newNameMedida: event.target.value,
                                                        msgWarningModal: 'Ingrese el nombre.'
                                                    });
                                                }
                                            }} />
                                    </div>
                                </div>
                                <div className="form-group col-md-6">
                                    <label>Simbolo </label>
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el simbolo"
                                            value={this.state.codigoMedida}
                                            onChange={(event) => this.setState({ codigoMedida: event.target.value })} />
                                        <button className={`btn btn-sm ml-1 ${this.state.idTempMedida === '' ? 'btn-outline-info' : 'btn-outline-warning'}`} title={this.state.idTempMedida === '' ? 'Agregar nueva medida' : 'Editar medida'} onClick={() => this.onSaveMedida()}>
                                            {
                                                this.state.idTempMedida === '' ?
                                                    <i className="bi bi-plus-circle"></i> :
                                                    <i className="bi bi-pen-fill"></i>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="mt-0 mb-3" />

                            <div className="form-row">
                                <div className="form-group col-md-12">
                                    <div className="input-group input-group-sm">
                                        <div className="input-group-prepend">
                                            <div className="input-group-text"><i className="bi bi-search"></i></div>
                                        </div>
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder="Buscar..."
                                            ref={this.refSearchMedida}
                                            onKeyUp={(event) => this.searchText(event.target.value.trim().toUpperCase())} />
                                        <button className="btn btn-outline-secondary btn-sm ml-1" title="Recargar" onClick={() => { this.initLoadModal(0, ""); this.refSearchMedida.current.value = '';}}>
                                            <i className="bi bi-arrow-clockwise"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover table-bordered rounded">
                                        <thead>
                                            <tr>
                                                <th width="5%" className="p-1">#</th>
                                                <th width="85%" className="p-1">Nombre </th>
                                                <th width="10%" className="p-1">Simbolo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                this.state.loadModalTable ? (
                                                    <tr>
                                                        <td className="text-center p-1" colSpan="3">
                                                            {spinnerLoading(this.state.msgModalTable)}
                                                        </td>
                                                    </tr>
                                                ) : this.state.detalleMedidas.length === 0 ? (
                                                    <tr className="text-center">
                                                        <td className="p-1" colSpan="3">¡No hay datos registrados!</td>
                                                    </tr>
                                                ) :

                                                    (
                                                        this.state.detalleMedidas.map((item, index) => {
                                                            return (
                                                                <tr key={item.idMedida} onClick={() => this.setState({ idTempMedida: item.idMedida, newNameMedida: item.nombre, codigoMedida: item.codigo })}>
                                                                    <td className="p-1">{++index}</td>
                                                                    <td className="p-1">{item.nombre}</td>
                                                                    <td className="p-1">{item.codigo}</td>
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
                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger" onClick={() => this.props.closeMedidaModal()}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

export default ModalMedida