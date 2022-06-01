import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    currentDate,
    formatMoney
} from '../../tools/Tools';
import { TreeTable } from '../../../recursos/js/treeone.js';

class RepBalanceGeneral extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fechaIni: '',
            fechaFin: '',
            isFechaActive: false,

            listActicos: [],
            listaPasivos: [],
            listaPatrimonio: [],

            sumaActivo: 0,
            sumaPasivo: 0,
            sumaPatrimonio: 0,

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

            let result = await axios.get("/api/concepto/listactivos", {
                signal: this.abortControllerView.signal
            })


            let result2 = await axios.get("/api/concepto/listapasivos", {
                signal: this.abortControllerView.signal
            })

            let result3 = await axios.get("/api/concepto/listapatrimonio", {
                signal: this.abortControllerView.signal
            })

            let resulIngresos = await axios.get("/api/concepto/sumaingresos", {
                signal: this.abortControllerView.signal
            })

            let resultGastos = await axios.get("/api/concepto/sumagastos", {
                signal: this.abortControllerView.signal
            })

            let sumaActivo = 0;
            for (let item of result.data) {
                sumaActivo += parseFloat(item.monto);
            }

            let sumaPasivo = 0;
            for (let item of result2.data) {
                sumaPasivo += parseFloat(item.monto);
            }

            let sumaPatrimonio = 0;
            for (let item of result3.data) {
                if (item.idConcepto === 'CP0012') {
                    item.monto = resulIngresos.data.monto - resultGastos.data.monto;
                }
                sumaPatrimonio += parseFloat(item.monto);
            }

            let value = this.createArray(result.data, "");
            let value2 = this.createArray(result2.data, "")
            let value3 = this.createArray(result3.data, "")

            await this.setStateAsync({
                listActicos: value,
                listaPasivos: value2,
                listaPatrimonio: value3,

                sumaActivo: sumaActivo,
                sumaPasivo: sumaPasivo,
                sumaPatrimonio: sumaPatrimonio,

                fechaIni: currentDate(),
                fechaFin: currentDate(),
                loading: false
            });

            new TreeTable("#tbActivos");
            new TreeTable("#tbUPasivos");
            new TreeTable("#tbPatrimonio");

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
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Balance General
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
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="80%" className="p-1">Cuenta Contable </th>
                                        <th width="20%" className="p-1">Total</th>
                                    </tr>
                                </thead>
                                <tbody id="tbActivos">
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center p-1" colSpan="2">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.listActicos.length === 0 ? (
                                            <tr className="text-center">
                                                <td className="p-1" colSpan="2">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            <OptionsList options={this.state.listActicos} />
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="80%">Cuenta Contable</th>
                                        <th width="20%">Total</th>
                                    </tr>
                                </thead>
                                <tbody id="tbUPasivos">
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center" colSpan="2">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.listaPasivos.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="2">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            <OptionsList options={this.state.listaPasivos} />
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">

                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="80%">Cuenta Contable</th>
                                        <th width="20%">Total</th>
                                    </tr>
                                </thead>
                                <tbody id="tbPatrimonio">
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center" colSpan="2">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.listaPatrimonio.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="2">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            <OptionsList options={this.state.listaPatrimonio} />
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <tfoot>
                                    <tr>
                                        <th width="80%" className="py-1">Total Activos</th>
                                        <th width="20%" className="py-1">{formatMoney(this.state.sumaActivo)}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <tfoot>
                                    <tr>
                                        <th width="80%" className="py-1">Total pasivos + patrimonio</th>
                                        <th width="20%" className="py-1">{formatMoney(this.state.sumaPasivo + this.state.sumaPatrimonio)}</th>
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
                        <tr key={++index} data-idrow={option.nivel} data-idtr={option.idConcepto} data-subidtr={option.idRelacion} style={{ "fontSize": "12px" }}>
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
                                    <span className="x-tree-node-text"><i className='fa fa-money'></i> {option.nombre}</span>
                                </div>
                            </td>
                            <td className="p-1">{formatMoney(option.monto)}</td>
                        </tr>)
                } else {
                    return (<>
                        <tr key={++index} data-idrow={option.nivel} data-idtr={option.idConcepto} data-subidtr={option.idRelacion} style={{ "fontSize": "12px" }}>
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
                                    <span className="x-tree-node-text"><i className='fa fa-money'></i> {option.nombre}</span>
                                </div>
                            </td>
                            <td className="p-1">{formatMoney(option.monto)}</td>

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

export default RepBalanceGeneral;