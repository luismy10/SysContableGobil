import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
    formatMoney,
    numberFormat,
    calculateTaxBruto,
    calculateTax,
    timeForma24,
    spinnerLoading,
} from '../../tools/Tools';

class BancoDetalle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            idBanco: '',
            nombre: '',
            tipoCuenta: '',
            numCuenta: '',
            moneda: '',
            saldo: '',
            codiso: '',

            lista: [],
            loading: true,
            msgLoading: 'Cargando datos...',
        }
        this.abortControllerView = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        const url = this.props.location.search;
        const idResult = new URLSearchParams(url).get("idBanco");
        if (idResult !== null) {
            this.loadDataId(idResult);
        } else {
            this.props.history.goBack();
        }
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    async loadDataId(id) {
        try {

            const detalle = await axios.get("/api/banco/detalle", {
                signal: this.abortControllerView.signal,
                params: {
                    "idBanco": id
                }
            });

            const cabecera = detalle.data.cabecera;

            await this.setStateAsync({
                idBanco: cabecera.idBanco,
                nombre: cabecera.nombre,
                tipoCuenta: cabecera.tipoCuenta,
                numCuenta: cabecera.numCuenta,
                moneda: cabecera.moneda,
                saldo: cabecera.saldo,
                codiso: cabecera.codiso,

                lista : detalle.data.lista,
                loading: false
            });


        } catch (error) {
            if (error.message !== "canceled") {
                this.props.history.goBack();
            }
        }
    }

    async onEventImprimir() {
        const data = {
            "idBanco": this.state.idBanco,
            "idSede": "SD0001"
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/banco/repdetallebanco?" + params, "_blank");

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
                                    <div className="form-group">
                                        <h5>
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Banco
                                            <small className="text-secondary"> detalle</small>
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        <button type="button" className="btn btn-light" onClick={ () => this.onEventImprimir() }><i className="fa fa-print"></i> Imprimir</button>
                                        {" "}
                                        <button type="button" className="btn btn-light"><i className="fa fa-plus"></i> Agregar dinero</button>
                                        {" "}
                                        <button type="button" className="btn btn-light"><i className="fa fa-minus"></i> Disminuir dinero</button>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        <div className="table-responsive">
                                            <table width="100%">
                                                <thead>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Caja / Banco</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.nombre}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Tipo de cuenta</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.tipoCuenta}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Número de cuenta</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.numCuenta}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Moneda</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.moneda}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Saldo</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal"><strong className={ this.state.saldo <= 0 ? 'text-danger' : 'text-success' }>{numberFormat(this.state.saldo, this.state.codiso )}</strong></th>
                                                    </tr>
                                                </thead>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        <div className="table-responsive">
                                            <table className="table table-light table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Fecha</th>
                                                        <th>Proveedor</th>
                                                        <th>Concepto</th>
                                                        <th>Salidas</th>
                                                        <th>Entradas</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.lista.length === 0 ?
                                                            (
                                                                <tr className="text-center">
                                                                    <td colSpan="6">¡No hay datos registrados!</td>
                                                                </tr>
                                                            )
                                                            :
                                                            this.state.lista.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{++index}</td>
                                                                    <td>{item.fecha}</td>
                                                                    <td>{item.proveedor}</td>
                                                                    <td className="text-left">{item.cuenta}</td>
                                                                    <td className="text-left text-danger">{item.salida <= 0 ? '' : `- ${formatMoney(item.salida)}`}</td>
                                                                    <td className="text-right text-success">{item.ingreso <= 0 ? '' : `+ ${formatMoney(item.ingreso)}`}</td>
                                                                </tr>
                                                            ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </>

                }
            </>
        )
    }
}

export default BancoDetalle