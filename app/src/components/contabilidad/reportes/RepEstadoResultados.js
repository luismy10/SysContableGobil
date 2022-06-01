import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    currentDate
} from '../../tools/Tools';
import { TreeTable } from '../../../recursos/js/treeone.js';

class RepEstadoResultados extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            listaUtilidadBruta: [],
            listaUtilidadOperacional: [],
            listaUtilidadAntesImp: [],

            loading: true,
            messageWarning: ''
        }

        this.refFechaIni = React.createRef();
        this.refFechaFin = React.createRef();

        this.abortControllerView = new AbortController()
    }


    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.loadData()
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
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

    loadData = async () => {
        try {

            let result = await axios.get("/api/concepto/listautilidadbruta", {
                signal: this.abortControllerView.signal
            })

            let result2 = await axios.get("/api/concepto/listautilidadoperacional", {
                signal: this.abortControllerView.signal
            })

            let result3 = await axios.get("/api/concepto/listautilidadantesipm", {
                signal: this.abortControllerView.signal
            })

            // console.log(result.data)

            let value = this.createArray(result.data, "");
            let value2 = this.createArray(result2.data, "")
            let value3 = this.createArray(result3.data, "")

            await this.setStateAsync({
                listaUtilidadBruta: value,
                listaUtilidadOperacional: value2,
                listaUtilidadAntesImp: value3,
                fechaIni: currentDate(),
                fechaFin: currentDate(),
                loading: false,
            });

            new TreeTable("#tbUtilidad1");
            new TreeTable("#tbUtilidad2");
            new TreeTable("#tbUtilidad3");

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    render() {
        return (
            <>
                <div className="row">
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Estado de Resultados
                                <small className="text-secondary"> REPORTE</small>
                            </h5>
                        </div>
                    </div>
                </div>

                <div className="row">

                    <div className="col">
                        <div className="form-group">
                            <span>Filtro por fechas</span>
                            <div className="custom-control custom-switch">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="customSwitch1"
                                    checked={this.state.isFechaActive}
                                    onChange={(event) => {
                                        this.setState({ isFechaActive: event.target.checked, fechaIni: currentDate(), fechaFin: currentDate(), messageWarning: '' })
                                    }}
                                >
                                </input>
                                <label className="custom-control-label" htmlFor="customSwitch1">{this.state.isFechaActive ? 'Activo' : 'Inactivo'}</label>
                            </div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="form-group">
                            <span>Fecha inicial <i className="fa fa-asterisk text-danger small"></i></span>
                            {/* <small>Fecha inicial <i className="fa fa-asterisk text-danger small"></i></small> */}
                            <div className="input-group input-group-sm">
                                <input
                                    type="date"
                                    className="form-control"
                                    disabled={!this.state.isFechaActive}
                                    ref={this.refFechaIni}
                                    value={this.state.fechaIni}
                                    onChange={(event) => {
                                        if (event.target.value <= this.state.fechaIni) {
                                            this.setState({
                                                fechaIni: event.target.value,
                                                messageWarning: '',
                                            });
                                        } else {
                                            this.setState({
                                                fechaIni: event.target.value,
                                                messageWarning: 'La Fecha inicial no puede ser mayor a la fecha final.',
                                            });
                                        }
                                    }} />
                            </div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="form-group">
                            <span>Fecha final <i className="fa fa-asterisk text-danger small"></i></span>
                            <div className="input-group input-group-sm">
                                <input
                                    type="date"
                                    className="form-control"
                                    disabled={!this.state.isFechaActive}
                                    ref={this.refFechaFin}
                                    value={this.state.fechaFin}
                                    onChange={(event) => {
                                        if (event.target.value <= this.state.fechaFin) {
                                            this.setState({
                                                fechaFin: event.target.value,
                                                messageWarning: '',
                                            });
                                        } else {
                                            this.setState({
                                                fechaFin: event.target.value,
                                                messageWarning: 'La Fecha fin no puede ser mayor a la fecha final.',
                                            });
                                        }
                                    }} />
                            </div>
                        </div>
                    </div>

                    <div className="col">
                        <div className="form-group">
                            <span>Reporte</span>
                            <div className="input-group">
                                <button className="btn btn-outline-success btn-sm" title="Reporte excel"><i className="bi bi-file-earmark-excel-fill"></i></button>
                                <button className="btn btn-outline-warning btn-sm ml-1" title="Reporte pdf"><i className="bi bi-file-pdf-fill"></i></button>
                                <button className="btn btn-outline-info btn-sm ml-1" title="Imprimir"><i className="bi bi-printer-fill"></i></button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="80%">Cuenta Contable</th>
                                        <th width="20%">Total</th>
                                    </tr>
                                </thead>
                                <tbody id="tbUtilidad1">
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center" colSpan="2">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.listaUtilidadBruta.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="2">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            <OptionsList options={this.state.listaUtilidadBruta} />
                                        )
                                    }
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th className="py-1 text-right">Utilidad bruta: M</th>
                                        <th className="py-1">00.00</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="80%">Cuenta Contable</th>
                                        <th width="20%">Total</th>
                                    </tr>
                                </thead>
                                <tbody id="tbUtilidad2">
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center" colSpan="2">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.listaUtilidadOperacional.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="2">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            <OptionsList options={this.state.listaUtilidadOperacional} />
                                        )
                                    }
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th className="py-1 text-right">Utilidad operacional: M</th>
                                        <th className="py-1">00.00</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="80%">Cuenta Contable</th>
                                        <th width="20%">Total</th>
                                    </tr>
                                </thead>
                                <tbody id="tbUtilidad3">
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center" colSpan="2">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.listaUtilidadAntesImp.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="2">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            <OptionsList options={this.state.listaUtilidadAntesImp} />
                                        )
                                    }
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th className="py-1 text-right">Utilidad antes de impuestos: M</th>
                                        <th className="py-1">00.00</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

            </>
        )
    }
}

const OptionsList = ({ options }) => {

    return (
        <>
            {options.map((option, index) => {
                if (option.children.length === 0) {
                    return (
                        <tr key={++index} data-idrow={option.nivel} data-idtr={option.idConcepto} data-subidtr={option.idRelacion}>
                            <td>
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
                                    <span className="x-tree-node-text"><i className='fa fa-money'></i> {option.nombre}</span>
                                </div>
                            </td>
                            <td>0</td>
                        </tr>)
                } else {
                    return (<>
                        <tr key={++index} data-idrow={option.nivel} data-idtr={option.idConcepto} data-subidtr={option.idRelacion}>
                            <td>
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
                                    <span className="x-tree-node-text"><i className='fa fa-money'></i> {option.nombre}</span>
                                </div>
                            </td>
                            <td>0</td>

                        </tr>

                        {(option.children.length) &&
                            <OptionsList
                                options={option.children}
                            />}
                    </>
                    )
                }
            })
            }
        </>
    )
}

export default RepEstadoResultados;