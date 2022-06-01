import React from "react";

class Paginacion extends React.Component {
  constructor(props) {
    super(props);
    this.upperPageBound = 3;
    this.lowerPageBound = 0;
    this.isPrevBtnActive = "disabled";
    this.isNextBtnActive = "";
    this.pageBound = 3;
  }

  setPrevAndNextBtnClass = async (listid) => {
    this.isNextBtnActive = "disabled";
    this.isPrevBtnActive = "disabled";

    if (
      this.props.totalPaginacion === listid &&
      this.props.totalPaginacion > 1
    ) {
      this.isPrevBtnActive = "";
    } else if (listid === 1 && this.props.totalPaginacion > 1) {
      this.isNextBtnActive = "";
    } else if (this.props.totalPaginacion > 1) {
      this.isNextBtnActive = "";
      this.isPrevBtnActive = "";
    }

    this.props.fillTable(listid);
  };

  handleClick = async (event) => {
    if (this.props.loading) return;

    let listid = parseInt(event.target.id);
    this.setPrevAndNextBtnClass(listid);
  };

  btnPrevClick = async () => {
    if (this.props.loading) return;

    if ((this.props.paginacion - 1) % this.pageBound === 0) {
      this.upperPageBound = this.upperPageBound - this.pageBound;
      this.lowerPageBound = this.lowerPageBound - this.pageBound;
    }
    let listid = this.props.paginacion - 1;
    this.setPrevAndNextBtnClass(listid);
  };

  btnNextClick = async () => {
    if (this.props.loading) return;

    if (this.props.paginacion + 1 > this.upperPageBound) {
      this.upperPageBound = this.upperPageBound + this.pageBound;
      this.lowerPageBound = this.lowerPageBound + this.pageBound;
    }
    let listid = this.props.paginacion + 1;
    this.setPrevAndNextBtnClass(listid);
  };

  btnDecrementClick = async () => {
    if (this.props.loading) return;

    this.upperPageBound = this.upperPageBound - this.pageBound;
    this.lowerPageBound = this.lowerPageBound - this.pageBound;
    let listid = this.upperPageBound;
    this.setPrevAndNextBtnClass(listid);
  };

  btnIncrementClick = async () => {
    if (this.props.loading) return;

    this.upperPageBound = this.upperPageBound + this.pageBound;
    this.lowerPageBound = this.lowerPageBound + this.pageBound;

    let listid = this.lowerPageBound + 1;
    this.setPrevAndNextBtnClass(listid);
  };

  render() {
    const pageNumbers = [];
    for (let i = 1; i <= this.props.totalPaginacion; i++) {
      pageNumbers.push(i);
    }

    const renderPageNumbers = pageNumbers.map((number, index) => {
      if (number === 1 && this.props.paginacion === 1) {
        return (
          <li key={index} className="page-item active" aria-current="page">
            <span className="page-link">{number}</span>
          </li>
        );
      } else if (
        number < this.upperPageBound + 1 &&
        number > this.lowerPageBound
      ) {
        return (
          <li
            key={index}
            className={`page-item ${
              number === this.props.paginacion ? "active" : ""
            }`}
          >
            {number === this.props.paginacion ? (
              <span id={number} className="page-link">
                {number}
              </span>
            ) : (
              <button
                id={number}
                className="page-link"
                onClick={this.handleClick}
              >
                {number}
              </button>
            )}
          </li>
        );
      } else {
        return null;
      }
    });

    let pageDecrementBtn = null;
    if (this.lowerPageBound >= 1) {
      pageDecrementBtn = (
        <li className="page-item">
          <button className="page-link" onClick={this.btnDecrementClick}>
            {" "}
            &hellip;{" "}
          </button>
        </li>
      );
    }

    let pageIncrementBtn = null;
    if (pageNumbers.length > this.upperPageBound) {
      pageIncrementBtn = (
        <li className="page-item">
          <button className="page-link" onClick={this.btnIncrementClick}>
            {" "}
            &hellip;{" "}
          </button>
        </li>
      );
    }

    let renderPrevBtn = null;
    if (
      this.isPrevBtnActive === "disabled" ||
      this.props.totalPaginacion <= 1
    ) {
      renderPrevBtn = (
        <li className="page-item disabled">
          <span className="page-link"> Ante. </span>
        </li>
      );
    } else {
      renderPrevBtn = (
        <li className="page-item">
          <button className="page-link" onClick={this.btnPrevClick}>
            {" "}
            Ante.{" "}
          </button>
        </li>
      );
    }

    let renderNextBtn = null;
    if (
      this.isNextBtnActive === "disabled" ||
      this.props.totalPaginacion <= 1
    ) {
      renderNextBtn = (
        <li className="page-item disabled">
          <span className="page-link"> Sigui. </span>
        </li>
      );
    } else {
      renderNextBtn = (
        <li className="page-item">
          <button className="page-link" onClick={this.btnNextClick}>
            {" "}
            Sigui.{" "}
          </button>
        </li>
      );
    }

    return (
      <>
        {renderPrevBtn}
        {pageDecrementBtn}
        {renderPageNumbers}
        {pageIncrementBtn}
        {renderNextBtn}
      </>
    );
  }
}

export default Paginacion;
