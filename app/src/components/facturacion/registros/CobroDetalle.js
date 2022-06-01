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
import { connect } from 'react-redux';

class CobroDetalle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idCobro: '',
            comprobante:'',
            estado: '',
            cliente: '',
            fecha: '',
            cuentaBancaria: '',
            notas: '',
            metodoPago: '',
            total: '',
            codiso: '',
            simbolo: '',

            cobro: true,
            detalle: [],

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
        const idResult = new URLSearchParams(url).get("idCobro");
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
            let result = await axios.get('/api/cobro/id', {
                signal: this.abortControllerView.signal,
                params: {
                    idCobro: id
                }
            });

            let cabecera = result.data.cabecera;

            await this.setStateAsync({
                idCobro: id,
                comprobante: cabecera.comprobante+" "+cabecera.serie+"-"+ cabecera.numeracion,
                estado: cabecera.estado.toString(),
                cliente: cabecera.documento + " - " + cabecera.informacion,
                fecha: cabecera.fecha + " " + timeForma24(cabecera.hora),
                cuentaBancaria: cabecera.banco,
                notas: cabecera.observacion,
                metodoPago: cabecera.metodoPago === 1 ? "Efectivo"
                    : cabecera.metodoPago === 2 ? "Consignación"
                        : cabecera.metodoPago === 3 ? "Transferencia"
                            : cabecera.metodoPago === 4 ? "Cheque"
                                : cabecera.metodoPago === 5 ? "arjeta crédito"
                                    : "Tarjeta débito",
                total: cabecera.monto,
                simbolo: cabecera.simbolo,
                codiso: cabecera.codiso,

                cobro: result.data.detalle.length !== 0 ? true : false,
                detalle: result.data.detalle.length !== 0 ? result.data.detalle : result.data.venta,

                loading: false
            });
        } catch (error) {
            if (error.message !== "canceled") {
                this.props.history.goBack();
            }
        }
    }


    renderTotal() {
        let subTotal = 0;
        let impuestoTotal = 0;
        let total = 0;

        if (this.state.cobro) {
            for (let item of this.state.detalle) {
                let cantidad = item.cantidad;
                let valor = item.precio;

                let impuesto = item.porcentaje;

                let valorActual = cantidad * valor;
                let valorSubNeto = calculateTaxBruto(impuesto, valorActual);
                let valorImpuesto = calculateTax(impuesto, valorSubNeto);
                let valorNeto = valorSubNeto + valorImpuesto;

                subTotal += valorSubNeto;
                impuestoTotal += valorImpuesto;
                total += valorNeto;
            }
        } else {
            for (let item of this.state.detalle) {
                total += item.precio;
            }
        }

        return (
            <>
                {
                    this.state.cobro ?
                        <>
                            <tr>
                                <th className="text-right">Sub Total:</th>
                                <th className="text-right">{numberFormat(subTotal, this.state.codiso)}</th>
                            </tr>
                            <tr>
                                <th className="text-right">Impuesto:</th>
                                <th className="text-right">{numberFormat(impuestoTotal, this.state.codiso)}</th>
                            </tr>
                            <tr className="border-bottom">
                            </tr>
                            <tr>
                                <th className="text-right h5">Total:</th>
                                <th className="text-right h5">{numberFormat(total, this.state.codiso)}</th>
                            </tr>
                        </> :
                        <>
                            <tr>
                                <th className="text-right h5">Total:</th>
                                <th className="text-right h5">{numberFormat(total, this.state.codiso)}</th>
                            </tr>
                        </>
                }
            </>
        )
    }

    onEventImprimir(){
        const data = {
            "idSede": "SD0001",
            "idCobro": this.state.idCobro,
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/cobro/repcomprobante?" + params, "_blank");
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
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Cobro
                                            <small className="text-secondary"> detalle</small>
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        <button type="button" className="btn btn-light" onClick={() => this.onEventImprimir()}><i className="fa fa-print"></i> Imprimir</button>
                                        {" "}
                                        <button type="button" className="btn btn-light"><i className="fa fa-file-archive-o"></i> Adjuntar</button>
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
                                                        <th className="table-secondary w-25 p-1 font-weight-normal "><span>Recibo de caja</span></th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.comprobante}</th>
                                                    </tr>
                                                    {/* <tr>
                                            <th className="table-secondary w-25 p-1 font-weight-normal ">Estado</th>
                                            <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal"></th>
                                        </tr> */}
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Cliente</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.cliente}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Fecha</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.fecha}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Cuenta bancaria</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.cuentaBancaria}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Notas</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.notas}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Método de pago</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.metodoPago}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Total</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{numberFormat(this.state.total, this.state.codiso)}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Archivos adjuntos</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{ }</th>
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
                                                    {
                                                        this.state.cobro ?
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Concepto</th>
                                                                <th>Cantidad</th>
                                                                <th>Impuesto</th>
                                                                <th>Valor</th>
                                                                <th>Monto</th>
                                                            </tr>
                                                            :
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Concepto</th>
                                                                <th>Total</th>
                                                                <th>Cobrado</th>
                                                                <th>Por Cobrar</th>
                                                                <th>Monto</th>
                                                            </tr>
                                                    }

                                                </thead>
                                                <tbody>
                                                    {
                                                        this.state.cobro ?
                                                            this.state.detalle.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{++index}</td>
                                                                    <td>{item.concepto}</td>
                                                                    <td className="text-right">{formatMoney(item.cantidad)}</td>
                                                                    <td className="text-right">{item.impuesto}</td>
                                                                    <td className="text-right">{numberFormat(item.precio, this.state.codiso)}</td>
                                                                    <td className="text-right">{numberFormat(item.cantidad * item.precio, this.state.codiso)}</td>
                                                                </tr>
                                                            ))
                                                            :
                                                            this.state.detalle.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{++index}</td>
                                                                    <td>{item.comprobante + ": " + item.serie + "-" + item.numeracion}</td>
                                                                    <td className="text-right">{numberFormat(item.total, this.state.codiso)}</td>
                                                                    <td className="text-right">{numberFormat(item.cobrado, this.state.codiso)}</td>
                                                                    <td className="text-right">{numberFormat(item.total - item.cobrado, this.state.codiso)}</td>
                                                                    <td className="text-right">{numberFormat(item.precio, this.state.codiso)}</td>
                                                                </tr>
                                                            ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
                                </div>
                                <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                    <table width="100%">
                                        <thead>
                                            {this.renderTotal()}
                                        </thead>
                                    </table>
                                </div>
                            </div>
                        </>
                }
            </>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(CobroDetalle);