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

class AjusteInventarioDetalle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            
            idAjusteInventario: '',
            correlativo: '',
            usuarioInfo: '',
            fecha: '',
            almacen: '',
            observacion: '',
            estado: '',
            total: '',

            codiso: '',

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
        const idResult = new URLSearchParams(url).get("idAjusteInventario");
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
            const result = await axios.get("/api/ajusteinventario/id", {
                signal: this.abortControllerView.signal,
                params: {
                    "idAjusteInventario": id
                }
            });

            let cabecera = result.data.cabecera;

            await this.setStateAsync({
                idAjusteInventario: id,
                correlativo: cabecera.correlativo,
                usuarioInfo: cabecera.usuarioRegistro,
                fecha: cabecera.fecha + " - " + timeForma24(cabecera.hora),
                almacen: cabecera.almacen,
                observacion: cabecera.observacion,
                estado: cabecera.estado,
                total: formatMoney(cabecera.total),
                detalle: result.data.detalle,

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

        return (
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
            </>
        )
    }

    async onEventImprimir() {
        const data = {
            "idSede": "SD0001",
            "idAjusteInventario": this.state.idAjusteInventario,
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/factura/repcomprobante?" + params, "_blank");
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
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Ajuste de inventario
                                            <small className="text-secondary"> detalle</small>
                                        </h5>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="form-group">
                                        {/* <button type="button" className="btn btn-light" onClick={() => this.onEventImprimir()}><i className="fa fa-print"></i> Imprimir</button> */}
                                        {" "}
                                        {/* <button type="button" className="btn btn-light"><i className="fa fa-edit"></i> Editar</button> */}
                                        {" "}
                                        {/* <button type="button" className="btn btn-light"><i className="fa fa-remove"></i> Eliminar</button> */}
                                        {" "}
                                        {/* <button type="button" className="btn btn-light"><i className="fa fa-file-archive-o"></i> Adjuntar</button> */}
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
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Correlativo</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.correlativo}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Usuario</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.usuarioInfo}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Fecha</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.fecha}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Almacen</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.almacen}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Observación</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.observacion}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Estado</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{this.state.estado === 1 ? <span className="text-success font-weight-bold">Completado</span> : <span className="text-danger font-weight-bold">Cancelado</span>}</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="table-secondary w-25 p-1 font-weight-normal ">Total</th>
                                                        <th className="table-light border-bottom w-75 pl-2 pr-2 pt-1 pb-1 font-weight-normal">{numberFormat(this.state.total)}</th>
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
                                                        <th>Producto</th>
                                                        <th>Cantidad actual</th>
                                                        <th>Tipo de Ajuste</th>
                                                        <th>Cantidad</th>
                                                        <th>Costo</th>
                                                        <th>Cantida Final</th>
                                                        <th>Total Ajustado</th>
                                                    </tr>
                                                </thead>
                                                <tbody style={{'fontSize': '12px'}}>
                                                    {
                                                        this.state.detalle.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{++index}</td>
                                                                <td>{item.producto}</td>
                                                                <td>{item.cantidadActual}</td>
                                                                <td> 
                                                                    {item.tipoAjuste === 1 ? 'INCREMENTO' : 'DECREMENTO'}
                                                                    <span> <i className={`bi ${item.tipoAjuste === 1 ? 'bi-arrow-up-circle-fill text-primary' : 'bi-arrow-down-circle-fill text-danger'}`}></i></span> 
                                                                </td>
                                                                <td>{item.cantidad}</td>
                                                                <td className="text-right">{numberFormat(item.costo)}</td>
                                                                <td>{item.cantidadFinal}</td>
                                                                <td className="text-right">{numberFormat(item.totalAjuste)}</td>
                                                                {/* <td className="text-right">{formatMoney(item.cantidad)}</td> */}
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
                                            {/* {this.renderTotal()} */}
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

export default connect(mapStateToProps, null)(AjusteInventarioDetalle);

