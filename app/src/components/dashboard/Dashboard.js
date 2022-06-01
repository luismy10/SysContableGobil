import React from 'react';
import axios from 'axios';
import {
    formatMoney,
    numberFormat,
    calculateTaxBruto,
    calculateTax,
    timeForma24,
    spinnerLoading,
} from '../tools/Tools';
import { connect } from 'react-redux';

import noImage from '../../recursos/images/noimage.jpg';

class Dashboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

            totales: {},
            proyectos: [],

            codiso: '',
            msgLoading: 'Cargando datos...',
            loading: true
        }

        this.abortControllerView = new AbortController();
    }


    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        this.loadInit();
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    async loadInit() {
        try {

            const total = await axios.get("/api/dashboard/totales", {
                signal: this.abortControllerView.signal,
                params: {
                    "idProyecto": this.props.token.project.idProyecto
                }
            });

            const proyecto = await axios.get("/api/proyecto/inicio", {
                signal: this.abortControllerView.signal
            });

            const actual = proyecto.data.filter((proy) => proy.idProyecto === this.props.token.project.idProyecto);

            await this.setStateAsync({
                totales: total.data,
                proyectos: proyecto.data,
                codiso: actual[0].codiso,
                loading: false
            });

            // console.log(this.state.codiso)


        } catch (error) {
            if (error.message !== "canceled") {
                this.setState({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                })
                console.log(error.message)
            }
        }
    }

    onClickeToogle = () => {
        // this.menuRef.handleToggleSidebar(true)
    }


    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div>
                        :
                        <div className='col-lg-12 col-md-12 mt-8 mb-12'>
                            <div className="container-fluid py-4 ">

                                <div className="row ">
                                    <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                        <div className="card" style={{ borderRadius: 10, boxShadow: '0 7px 10px -5px rgba(64,64,64,.4)', display: 'flex', position: 'relative' }}>
                                            <div className="card-header p-3 pt-2 bg-transparent">
                                                <div className="bg-dark position-absolute" style={{ color: 'white', marginTop: -35, borderRadius: 10, display: 'flex', fontSize: 20, boxShadow: '0 7px 10px -5px rgba(64,64,64,.4)', padding: '15px 20px 15px 20px' }}>
                                                    <i className="bi bi-boxes"></i>
                                                </div>
                                                <div className="text-right pt-1">
                                                    <p className="text-sm mb-0">Total de Manzanas</p>
                                                    <h4 className="mb-0">{this.state.totales.totalManzanas}</h4>
                                                </div>
                                            </div>
                                            {/* <hr className="dark horizontal my-0" />
                                            <div className="card-footer p-3 bg-transparent">
                                                <p className="mb-0"><span className="text-success text-sm font-weight-bolder">+55% </span>than lask week</p>
                                            </div> */}
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                        <div className="card" style={{ borderRadius: 10, boxShadow: '0 7px 10px -5px rgba(64,64,64,.4)' }}>
                                            <div className="card-header p-3 pt-2 bg-transparent">
                                                <div className="position-absolute" style={{ color: 'white', marginTop: -35, borderRadius: 10, display: 'flex', background: '#ec407a', fontSize: 20, boxShadow: '0 7px 10px -5px rgba(233,30,99,.4)', padding: '15px 20px 15px 20px' }}>
                                                    <i className="bi bi-bounding-box-circles"></i>
                                                </div>
                                                <div className="text-right pt-1">
                                                    <p className="text-sm mb-0">Total de Lotes</p>
                                                    <h4 className="mb-0">{this.state.totales.totalLotes}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                        <div className="card" style={{ borderRadius: 10, boxShadow: '0 7px 10px -5px rgba(64,64,64,.4)' }}>
                                            <div className="card-header p-3 pt-2 bg-transparent">
                                                <div className="position-absolute" style={{ color: 'white', marginTop: -35, borderRadius: 10, display: 'flex', background: '#66bb6a', fontSize: 20, boxShadow: '0 7px 10px -5px rgba(76,175,80,.4)', padding: '15px 20px 15px 20px' }}>
                                                    <i className="bi bi-people-fill" style={{ margin: 'auto' }}></i>
                                                </div>
                                                <div className="text-right pt-1">
                                                    <p className="text-sm mb-0">Total de clientes</p>
                                                    <h4 className="mb-0">{this.state.totales.totalClientes}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                        <div className="card" style={{ borderRadius: 10, boxShadow: '0 7px 10px -5px rgba(64,64,64,.4)' }}>
                                            <div className="card-header p-3 pt-2 bg-transparent">
                                                <div className="position-absolute" style={{ color: 'white', marginTop: -35, borderRadius: 10, display: 'flex', background: '#49a3f1', fontSize: 20, boxShadow: '0 7px 10px -5px rgba(0,188,212,.4)', padding: '15px 20px 15px 20px' }}>
                                                    <i className="bi bi-clipboard-data-fill"></i>
                                                </div>
                                                <div className="text-right pt-1">
                                                    <p className="text-sm mb-0">Ventas mensuales</p>
                                                    <h4 className="mb-0">{numberFormat(this.state.totales.totalVentas, this.state.codiso)}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-4">

                                    {
                                        this.state.proyectos.length === 0 ?
                                            (
                                                <div className="col-lg-12 col-md-12 mt-4 mb-12">
                                                    <div className="text-center">
                                                        <span>¡No hay proyectos registrados!</span>
                                                    </div>
                                                </div>
                                            )
                                            :
                                            (
                                                this.state.proyectos.map((item, index) => {

                                                    return (
                                                        <div className="col-lg-4 col-md-6 mt-4 mb-4" key={index}>
                                                            <div className={`card z-index-2 border ${item.idProyecto === this.props.token.project.idProyecto ? 'border-primary' : ''}`} style={{ borderRadius: 10, boxShadow: '0 7px 10px -5px rgba(64,64,64,.4)' }}>
                                                                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2 bg-light" style={{ borderRadius: 10 }}>
                                                                    <div className="shadow-primary py-1 px-1  pe-1" style={{ borderRadius: 10, boxShadow: '0 7px 10px -5px rgba(153,153,153,.4)', border: '1px solid #999' }}>
                                                                        <div className="chart">
                                                                            <img src={item.imagen === "" ? noImage : `data:image/${item.extensionimagen};base64,${item.imagen}`} alt="" className="img-fluid rounded" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="card-body">
                                                                    <h6 className="mb-0 ">{item.nombre}</h6>
                                                                    <p className="text-sm ">{item.ubicacion}</p>
                                                                    <hr className="dark horizontal" />
                                                                    <div className="d-flex">
                                                                        <p className="mb-0 text-sm">Area: {item.area} m²</p>
                                                                        <div className="col text-right pr-0">
                                                                            <p className="mb-0 text-sm">
                                                                                {item.estado === 1 ? <span className="badge badge-success">VENTA</span> : <span className="badge badge-danger">LITIGIO</span>}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col text-center mt-2">
                                                                        {item.idProyecto === this.props.token.project.idProyecto ? <span className="text-primary fs-1">Actual</span> : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )
                                    }

                                </div>

                            </div>
                        </div>

                }
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(Dashboard);

// export default Dashboard;