import React from "react";
import { connect } from 'react-redux';
import { closeProject } from '../../../redux/actions';

class Menu extends React.Component {

    onEventCloseProject() {
        window.localStorage.removeItem('project');
        this.props.restore();
    }

    render() {
        return (
            <header className="app-header">
                <span className="app-sidebar__toggle" type="button" onClick={this.props.openAndClose}>
                </span>

                <ul className="app-nav">
                    <span className="app-nav__item"  type="button" onClick={() => this.onEventCloseProject()}>
                        <i className="fa fa-sign-out fa-sm"></i>
                        <span className="app-nav_text">&nbsp; Cerrar Sesión<span>
                        </span></span>
                    </span>
                </ul>
            </header>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        restore: () => dispatch(closeProject())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Menu);