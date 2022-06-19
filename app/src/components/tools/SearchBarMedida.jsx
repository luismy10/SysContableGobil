import React from "react";
import "./SearchBar.css";

class SearchBarMedida extends React.Component {
  constructor(props) {
    super(props);
    this.index = -1;
  }

  componentDidMount() {
    window.addEventListener("click", this.onEventWindowClick, false);
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.onEventWindowClick, false);
  }

  onEventWindowClick = (event) => {
    let parent = document.getElementById("idDataResult");
    let click = event.target.parentElement.parentElement;

    if (parent == null) return;
    if (click == null) return;

    if (parent.isEqualNode(click)) {
    } else {
      if (parent != null) {
        this.props.onEventClearInput();
        this.index = -1;
      }
    }
  };

  onEventKeyUp(event) {
    if (event.keyCode === 40 || event.which === 40) {
      if (this.props.filteredData.length === 0) return;

      const dataResult = document.getElementById("idDataResult");
      dataResult.focus();
      let children = dataResult.children;
      if (children.length > 0) {
        this.index = 0;
        children[this.index].focus();
      }
    } else if (event.keyCode === 13) {
      if (this.props.filteredData.length === 0) return;

      const dataResult = document.getElementById("idDataResult");
      dataResult.focus();
      let children = dataResult.children;
      if (children.length > 0) {
        this.index = 0;
        children[this.index].focus();
      }
    }
  }

  onEventKeyDown(event) {
    if (event.keyCode === 38) {
      let children = document.getElementById("idDataResult").children;

      if (this.index !== 0) {
        if (this.index > 0) {
          this.index--;
          children[this.index].focus();
        }
      }
    } else if (event.keyCode === 40) {
      let children = document.getElementById("idDataResult").children;

      if (this.index < children.length - 1) {
        this.index++;
        children[this.index].focus();
      }
    }
  }

  render() {
    return (
      <div className="search">
        <div className="form-group position-relative mb-0">
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              placeholder={this.props.placeholder}
              ref={this.props.refMedida}
              value={this.props.nombreMedida}
              onChange={this.props.handleFilter}
              onKeyUp={(event) => this.onEventKeyUp(event)}
            />
            <div className="input-group-append">
              <button
                className="input-group-text btn-sm"
                type="button"
                onClick={() => {
                  this.props.onEventClearInput();
                  this.props.refMedida.current.focus();
                  this.index = -1;
                }}
              >
                <i className="fa fa-close"></i>
              </button>
            </div>
            <div className="input-group-append">
              <button
                className="input-group-text btn-outline-info btn-sm"
                title="Agregar"
                type="button"
                onClick={() => {
                  this.props.onEventAddItem();
                }}
              >
                <i className="bi bi-plus"></i>
              </button>
            </div>
          </div>

          {this.props.filteredData.length !== 0 && (
            <div
              className="dataResult"
              id="idDataResult"
              tabIndex="-1"
              onKeyDown={(event) => this.onEventKeyDown(event)}
            >
              {this.props.filteredData.map((value, index) => (
                <button
                  key={index}
                  className="list-group-item list-group-item-action p-1"
                  onClick={() => {
                    this.props.onEventSelectItem(value);
                    this.props.refMedida.current.focus();
                    this.index = -1;
                  }}
                >
                  {value.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default SearchBarMedida;
