import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { Tree } from '../../recursos/js/treeone.js';
import {
  ModalAlertInfo,
  ModalAlertSuccess,
  ModalAlertWarning,
  spinnerLoading,
  statePrivilegio
} from '../tools/Tools';

class Accesos extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      idSede: "",
      idPerfil: "",
      perfiles: [],
      menu: [],
      catalogo: [],
      loading: true,
      msgLoading: 'Cargando datos...',

      save: statePrivilegio(this.props.token.userToken.menus[1].submenu[2].privilegio[0].estado),
      update: statePrivilegio(this.props.token.userToken.menus[1].submenu[2].privilegio[1].estado),

      messageWarning: ""
    }

    this.abortControllerView = new AbortController();
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve)
    });
  }

  async componentDidMount() {
    this.loadData();
  }

  componentWillUnmount() {
    this.abortControllerView.abort();
  }

  loadData = async () => {
    try {
      const perfil = await axios.get("/api/perfil/listcombo", {
        signal: this.abortControllerView.signal,
      });

      await this.setStateAsync({
        perfiles: perfil.data,
        loading: false,
      });

    } catch (error) {
      await this.setStateAsync({
        msgLoading: "Se produjo un error interno, intente nuevamente."
      });
    }
  }

  loadDataAcceso = async (id) => {
    try {
      await this.setStateAsync({
        menu: [],
        loading: true,
        msgLoading: 'Cargando accesos...'
      });

      const accesos = await axios.get("/api/acceso/accesos", {
        signal: this.abortControllerView.signal,
        params: {
          idPerfil: id
        }
      });

      let menus = accesos.data.menu.map((item, index) => {
        let submenu = [];
        for (let value of accesos.data.submenu) {
          let privilegio = [];

          if (item.idMenu === value.idMenu) {

            for (let content of accesos.data.privilegio) {
              if (content.idSubMenu === value.idSubMenu && item.idMenu === content.idMenu) {
                privilegio.push({
                  "estado": content.estado,
                  "idMenu": content.idMenu,
                  "idPrivilegio": content.idPrivilegio,
                  "idSubMenu": content.idSubMenu,
                  "nombre": content.nombre,
                  "children": []
                });
              }
            }

            submenu.push({
              "estado": value.estado,
              "idMenu": value.idMenu,
              "idSubMenu": value.idSubMenu,
              "nombre": value.nombre,
              "children": privilegio
            });
          }
        }

        return {
          ...item,
          "children": submenu
        }
      });

      await this.setStateAsync({
        menu: menus,
        loading: false,
      });

      new Tree("#tree1");

    } catch (error) {
      console.log(error)
    }
  }

  async onChangePerfil(event) {
    if (event.target.value.length > 0) {
      await this.setStateAsync({
        idPerfil: event.target.value,
        messageWarning: ""
      })
      this.loadDataAcceso(event.target.value);
    } else {
      await this.setStateAsync({
        idPerfil: event.target.value,
        menu: [],
        messageWarning: "Seleccione el perfil."
      });
    }
  }

  handleCheck = async (event) => {
    let updatedList = [...this.state.menu];
    for (let menu of updatedList) {
      if (menu.idMenu === event.target.value) {
        menu.estado = event.target.checked ? 1 : 0;
        break;
      } else {
        if (menu.children.length !== 0) {
          for (let submenu of menu.children) {
            if ((menu.idMenu + submenu.idSubMenu) === event.target.value) {
              submenu.estado = event.target.checked ? 1 : 0;
              break;
            } else {
              for (let privilegio of submenu.children) {
                if ((menu.idMenu + submenu.idSubMenu + privilegio.idPrivilegio) === event.target.value) {
                  privilegio.estado = event.target.checked ? 1 : 0;
                  break;
                }
              }
            }
          }
        }
      }
    }
    await this.setStateAsync({ menu: updatedList })
  }

  async onEventGuardar() {
    if (this.state.idPerfil === "") {
      await this.setStateAsync({ messageWarning: "Seleccione el perfil." })
      return;
    }
    try {

      ModalAlertInfo("Acceso", "Procesando información...");

      let result = await axios.post('/api/acceso/save', {
        "idPerfil": this.state.idPerfil,
        "menu": this.state.menu
      });

      ModalAlertSuccess("Acceso", result.data, async () => {
        await this.setStateAsync({
          idPerfil: "",
          menu: [],
        });
      });

    } catch (error) {
      ModalAlertWarning("Acceso",
        "Se produjo un error un interno, intente nuevamente.");
    }
  }

  async onEventUpdateData() {
    if (this.state.idPerfil === "") {
      await this.setStateAsync({ messageWarning: "Seleccione el perfil." })
      return;
    }
    try {

      ModalAlertInfo("Acceso", "Procesando información...");

      let result = await axios.post('/api/acceso/updatedata', {
        "idPerfil": this.state.idPerfil,
        "menu": this.state.menu
      });

      ModalAlertSuccess("Acceso", result.data, async () => {
        await this.setStateAsync({
          idPerfil: "",
          menu: [],
        });
      });

    } catch (error) {
      ModalAlertWarning("Acceso",
        "Se produjo un error un interno, intente nuevamente.");
    }
  }

  render() {
    return (
      <>
        {
          this.state.loading ?
            <div className="clearfix absolute-all bg-white">
              {spinnerLoading(this.state.msgLoading)}
            </div> : null
        }

        <div className='row'>
          <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
            <div className="form-group">
              <h5>Accesos <small className="text-secondary">LISTA</small></h5>
            </div>
          </div>
        </div>

        {
          this.state.messageWarning !== "" ?
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
            </div> :
            null
        }

        <div className='row'>
          <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
            <label>Empresa: </label>
            <div className='form-group'>
              <input
                type="text"
                className="form-control"
                placeholder='Ingrese la empresa' />
            </div>
          </div>
        </div>

        <div className='row'>
          <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
            <label>Perfil: </label>
            <div className='form-group'>
              <select
                className="form-control"
                value={this.state.idPerfil}
                onChange={(event) => this.onChangePerfil(event)}
              >
                <option value="">- Seleccione -</option>
                {
                  this.state.perfiles.map((item, index) => (
                    <option key={index} value={item.idPerfil}>{item.descripcion}</option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            {<OptionsList options={this.state.menu} handleCheck={this.handleCheck} />}
          </div>
        </div>

        <div className="row">
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-4 col-12">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => this.onEventGuardar()}
              disabled={!this.state.save}>
              <i className="fa fa-save"></i> Guardar
            </button>
            {" "}
            <button
              type="button"
              className="btn btn-info"
              onClick={() => this.onEventUpdateData()}
              disabled={!this.state.update}>
              <i className="fa fa-refresh"></i> Actualizar
            </button>
            {" "}
            <button type="button" className="btn btn-outline-danger">
              <i className="fa fa-close"></i> Cancelar
            </button>
          </div>
        </div>
      </>
    )
  }
}

const OptionsList = ({ options, handleCheck }) => {
  return (
    <ul id="tree1">
      {
        options.map((option, index) => {
          if (option.children.length === 0) {
            let value = option.idMenu + (option.idSubMenu === undefined ? "" : option.idSubMenu) + (option.idPrivilegio === undefined ? "" : option.idPrivilegio)
            return <li key={index}>
              <div className="form-check-inline m-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`id${option.nombre}`}
                  value={value}
                  checked={option.estado === 1 ? true : false}
                  onChange={handleCheck} />
                <label className="form-check-label" htmlFor={`id${option.nombre}`}>
                  {option.nombre}
                </label>
              </div>
            </li>
          } else {
            let value = option.idMenu + (option.idSubMenu === undefined ? "" : option.idSubMenu) + (option.idPrivilegio === undefined ? "" : option.idPrivilegio)
            return <li key={index}>
              <i className='cursor-pointer mr-1 mt-1 mb-1 fa fa-plus-square'></i>
              <div className="form-check-inline m-1 pl-1">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`id${option.nombre}`}
                  value={value}
                  checked={option.estado === 1 ? true : false}
                  onChange={handleCheck} />
                <label className="form-check-label" htmlFor={`id${option.nombre}`}>
                  {option.nombre}
                </label>
              </div>
              {
                (option.children.length) &&
                <OptionsList
                  options={option.children}
                  handleCheck={handleCheck}
                />
              }
            </li>
          }
        })
      }
    </ul>
  )
}

const mapStateToProps = (state) => {
  return {
    token: state.reducer
  }
}

export default connect(mapStateToProps, null)(Accesos);
