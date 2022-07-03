import React from 'react';
import axios from 'axios';
import {
    spinnerLoading,
    keyNumberFloat,
    isNumeric
} from '../../tools/Tools';

class ListaPrecios extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            priceList: [],
            loading: false,
            msgList: 'Cargando información...',
            msgWarning: '',
        }

        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {

        if(this.props.idProducto === ''){
            this.loadInit();
        } else {
            this.loadInitData();
        } 
        
    }

    async componentWillUnmount() {
        const { updateListPrice } = this.props;
        updateListPrice([])
        this.abortControllerTable.abort();
    }

    currentListPrice = (params) => {
        const { updateListPrice } = this.props;
        updateListPrice(params)
    }

    currentMsgWarning = (msg) => {
        const { updateMsgWarning } = this.props;
        updateMsgWarning(msg)
    }

    loadInit = async () => {
        try {
            await this.setStateAsync({ loading: true })

            await this.setStateAsync({
                loading: false,
                msgList: 'Cargando datos...',
                msgWarning: '',
            })

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgList: "Se produjo un error un interno, intente nuevamente."
                });
            }
        }
    }

    loadInitData = async (opcion, buscar) => {
        try {
            await this.setStateAsync({ loading: true })

            const precio = await axios.get("/api/producto/listprices", {
                signal: this.abortControllerTable.signal,
                params: {
                    "idProducto": this.props.idProducto,
                }
            });

            await this.setStateAsync({
                priceList: precio.data,

                loading: false,
                msgList: 'Cargando datos...',
                msgWarning: '',
            })

            this.currentListPrice(this.state.priceList);

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgList: "Se produjo un error un interno, intente nuevamente."
                });
            }
            console.log(error.message)
        }
    }

    async addObjectTable() {
        let count = 0;
        if (this.state.priceList.length > 0) {
            for (let item of this.state.priceList) {
                count = item.idPrecio + 1
            }
        } else { count++ }
        let detalle = {
            "idPrecio": count,
            "nombrePrecio": 'PRECIO ' + count,
            "valor": 0,
            "factor": 0,
        }
        this.state.priceList.push(detalle);
        let newArr = [...this.state.priceList];
        await this.setStateAsync({ priceList: newArr, msgWarning: ''});
        this.currentListPrice(this.state.priceList);
        this.currentMsgWarning('');
    }

    async removeObjectTable(id) {
        let newArr = [...this.state.priceList];
        for (let i = 0; i < newArr.length; i++) {
            if (id === newArr[i].idPrecio) {
                newArr.splice(i, 1)
                i--;
                break;
            }
        }
        await this.setStateAsync({ priceList: newArr, msgWarning: '' })
        this.currentListPrice(this.state.priceList);
    }

    handleSelectNombre = async (event, idPrecio) => {

        let updatedList = [...this.state.priceList];
        for (let item of updatedList) {
            if (item.idPrecio === idPrecio) {
                item.nombrePrecio = event.target.value;
                await this.setStateAsync({
                    msgWarning: event.target.value === '' ? 'Hay detalle(s) en la tabla con nombre vacio.' : ''
                })
                break;
            }
        }
        await this.setStateAsync({ priceList: updatedList })
        this.currentListPrice(this.state.priceList);
    }

    handleSelectValor = async (event, idPrecio) => {
        let updatedList = [...this.state.priceList];
        for (let item of updatedList) {
            if (item.idPrecio === idPrecio) {
                item.valor = event.target.value;
                await this.setStateAsync({
                    msgWarning: event.target.value === '' || !isNumeric(event.target.value.toString()) ? 'Hay detalle(s) en la tabla sin precio numérico.' : ''
                })
                break;
            }
        }
        await this.setStateAsync({ priceList: updatedList })
        this.currentListPrice(this.state.priceList);
    }

    handleSelectFactor = async (event, idPrecio) => {
        let updatedList = [...this.state.priceList];
        for (let item of updatedList) {
            if (item.idPrecio === idPrecio) {
                item.factor = event.target.value;
                await this.setStateAsync({
                    msgWarning: event.target.value === '' || !isNumeric(event.target.value.toString()) ? 'Hay detalle(s) en la tabla sin cantidad numérica.' : ''
                })
                break;
            }
        }
        await this.setStateAsync({ priceList: updatedList })
        this.currentListPrice(this.state.priceList);
    }

    render() {
        return (
            <>
                <div className="form-row">
                    <div className="table-responsive">
                        <div className="d-flex justify-content-between mb-2">
                            <span style={{ 'fontSize': '12' }} className="text-info">No dejar vacio los campos de la tabla.</span>
                            <button type="button" className="btn btn-outline-info btn-sm" title="Agregar precio" onClick={() => this.addObjectTable()} ref={this.props.refBtnPrices}><i className="fa fa-plus-circle"></i> Agregar</button>
                        </div>
                        {
                            this.state.msgWarning === '' ? null :
                                <div className="alert alert-warning" role="alert">
                                    <i className="bi bi-exclamation-diamond-fill"></i> {this.state.msgWarning}
                                </div>
                        }
                        <table className="table table-striped table-bordered rounded">
                            <thead>
                                <tr>
                                    <th width="50%" className="p-1">Nombre</th>
                                    <th width="25%" className="p-1">Precio del monto</th>
                                    <th width="25%" className="p-1">Cantidad</th>
                                    <th width="auto" className="p-1">Quitar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.loading ? (
                                        <tr>
                                            <td className="text-center p-1" colSpan="4">
                                                {spinnerLoading(this.state.msgList)}
                                            </td>
                                        </tr>
                                    ) : this.state.priceList.length === 0 ? (
                                        <tr className="text-center">
                                            <td className="p-1" colSpan="4">¡No hay datos registrados!</td>
                                        </tr>
                                    ) :

                                        (
                                            this.state.priceList.map((item, index) => {
                                                return (
                                                    <tr key={++index}>
                                                        <td className="p-1">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                id={++index + "imc"}
                                                                value={item.nombrePrecio}
                                                                onChange={(event) => this.handleSelectNombre(event, item.idPrecio)}
                                                            />
                                                        </td>
                                                        <td className="p-1">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                id={index + "imd"}
                                                                value={item.valor}
                                                                onChange={(event) => this.handleSelectValor(event, item.idPrecio)}
                                                                onKeyPress={keyNumberFloat}
                                                            />
                                                        </td>
                                                        <td className="p-1">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                id={index + "ime"}
                                                                value={item.factor}
                                                                onChange={(event) => this.handleSelectFactor(event, item.idPrecio)}
                                                                onKeyPress={keyNumberFloat}
                                                            />
                                                        </td>
                                                        <td className="p-1">
                                                            <button className="btn btn-outline-danger btn-sm" title="Eliminar" onClick={() => this.removeObjectTable(item.idPrecio)}><i className="fa fa-close"></i></button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )
    }
}

export default ListaPrecios