import React from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
    formatMoney,
    spinnerLoading,
    timeForma24
} from '../../tools/Tools';

class LoteDetalle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idLote: '',
            lote: {},
            detalle: [],

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',
        }

        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        const url = this.props.location.search;
        const idLote = new URLSearchParams(url).get("idLote");
        if (idLote !== null) {
            this.loadDataId(idLote)
        } else {
            this.props.history.goBack();
        }
    }

    componentWillUnmount() {
        this.abortControllerTable.abort();
    }

    async loadDataId(id) {
        try {
            let result = await axios.get("/api/lote/detalle", {
                signal: this.abortControllerTable.signal,
                params: {
                    "idLote": id
                }
            });

            await this.setStateAsync({
                lote: result.data.cabecera,
                detalle: result.data.detalle,
                idLote: id,
                loading: false,
            });
        } catch (error) {
            if (error.message !== "canceled") {
                this.props.history.goBack();
            }
        }
    }

    async onEventImprimir() {
        const data = {
            "idLote": this.state.idLote,
            "idSede": "SD0001"
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/lote/replotedetalle?" + params, "_blank");

        //Despliegue 
        // window.open("/api/lote/replotedetalle?idLote=" + this.state.idLote + "&idSede=SD0001", "_blank");

        //Desarrollo
        // try {

        //     let result = await axios.get("/api/lote/replotedetalle", {
        //         responseType: "blob",
        //         params: {
        //             "idLote": this.state.idLote,
        //             "idSede": 'SD0001'
        //         }
        //     });

        //     const file = new Blob([result.data], { type: "application/pdf" });
        //     const fileURL = URL.createObjectURL(file);
        //     window.open(fileURL, "_blank");

        // } catch (error) {
        //     console.log(error)
        // }
    }

    render() {
        const { manzana,
            lote,
            costo,
            precio,
            lotestado,
            comprobante,
            serie,
            numeracion,
            documento,
            cliente,
            fecha,
            hora,
            tipo,
            estado,
            simbolo,
            monto
        } = this.state.lote;
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
                                            <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Lote
                                            <small className="text-secondary"> Detalle</small>
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
                                    <p className="lead">Descripcion</p>
                                    <div className="table-responsive">
                                        <table className="table table-borderless">
                                            <thead>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Comprobante:</th>
                                                    <th className="w-80 font-weight-bold p-0">{comprobante + " " + serie + "-" + numeracion}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Cliente:</th>
                                                    <th className="w-80 font-weight-bold p-0">{documento + " " + cliente}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Fecha:</th>
                                                    <th className="w-80 font-weight-bold p-0">{fecha + " " + hora}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Notas:</th>
                                                    <th className="w-80 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Forma de venta:</th>
                                                    <th className="w-80 font-weight-bold p-0"> {tipo === 1 ? "CONTADO" : "CRÉDITO"}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Estado:</th>
                                                    <th className="w-80 font-weight-bold p-0"> {estado === 1 ? "COBRADO" : "POR COBRAR"}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Total:</th>
                                                    <th className="w-80 font-weight-bold p-0"> {simbolo + " " + formatMoney(monto)}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-20  font-weight-normal p-0">Archivos adjuntos:</th>
                                                    <th className="w-80 font-weight-bold p-0"> { }</th>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>
                                </div>
                            </div>


                            <div className="row">
                                <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                    <p className="lead">Descripcion</p>
                                    <div className="table-responsive">
                                        <table className="table table-borderless">
                                            <thead>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Manzana:</th>
                                                    <th className="w-65 font-weight-bold p-0">{manzana}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Lote:</th>
                                                    <th className="w-65 font-weight-bold p-0">{lote}</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Estado:</th>
                                                    <th className="w-65 font-weight-bold p-0"> {lotestado}</th>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                    <p className="lead">Medidas</p>
                                    <div className="table-responsive">
                                        <table className="table table-borderless">
                                            <thead>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Medida Frontal (ML)</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Costado Derecho (ML)</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Costado Izquierdo (ML)</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0"> Medida Fondo (ML)</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0"> Area Lote (ML)</th>
                                                    <th className="w-65 font-weight-bold p-0"> { }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0"> N° Partida</th>
                                                    <th className="w-65 font-weight-bold p-0"> { }</th>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                    <p className="lead">Límites</p>
                                    <div className="table-responsive">
                                        <table className="table table-borderless">
                                            <thead>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Limite, Frontal / Norte / Noroeste</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Límite, Derecho / Este / Sureste</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Límite, Iquierdo / Sur / Sureste</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Límite, Posterior / Oeste / Noroeste</th>
                                                    <th className="w-65 font-weight-bold p-0">{ }</th>
                                                </tr>
                                                <tr>
                                                    <th className="w-35 font-weight-normal p-0">Ubicación del Lote</th>
                                                    <th className="w-65 font-weight-bold p-0"> { }</th>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                                    <div className="table-responsive">
                                        <table className="table table-light table-striped">
                                            <thead>
                                                <tr>
                                                    <th width="20%">Concepto</th>
                                                    <th width="20%">Monto</th>
                                                    <th width="20%">Método</th>
                                                    <th width="20%">Banco</th>
                                                    <th width="20%">Fecha</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    this.state.detalle.length === 0 ?
                                                        <tr><td colspan="5" className="text-center">No hay cobros asociados.</td></tr>
                                                        :
                                                        this.state.detalle.map((item, index) => {
                                                            return (
                                                                <tr key={index}>
                                                                    <td>{item.concepto === "" ? "CUOTA" : item.concepto}</td>
                                                                    <td>{item.simbolo + " " + formatMoney(item.monto)}</td>
                                                                    <td>{item.metodo}</td>
                                                                    <td>{item.banco} </td>
                                                                    <td>{item.fecha}{<br />}{timeForma24(item.hora)} </td>
                                                                </tr>
                                                            )
                                                        })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                }
            </>
        );
    }
}


export default LoteDetalle;