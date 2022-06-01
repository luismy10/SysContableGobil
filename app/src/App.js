import React from 'react';
import axios from 'axios';
import Login from './components/login/Login';
import Inicio from './components/inicio/Inicio';
import Principal from './components/principal/Principal';
import NotFound from './components/error/NotFound';
import { connect } from 'react-redux';
import { restoreToken } from './redux/actions';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';

const Loader = () => {
    return <div>Cargando....</div>
}

class App extends React.Component {

    constructor(props) {
        super(props);
        this.menuRef = React.createRef();
    }

    async componentDidMount() {
        try {
            let userToken = window.localStorage.getItem('login');
            let user = JSON.parse(userToken);
            await axios.get("/api/login/validtoken", {
                headers: {
                    Authorization: "Bearer " + user.token
                }
            });

            let project = JSON.parse(window.localStorage.getItem('project'));

            user = {
                ...user,
                project: project
            }

            this.props.restore(user);
        } catch (error) {
            this.props.restore(null);
        }   
    }

    render() {
        return (
            <>
                {
                    this.props.token.isLoading ? (
                        <Loader />
                    ) : (
                        <BrowserRouter>
                            <Switch>
                                <Route
                                    path="/"
                                    exact={true}>
                                    <Redirect to="/login" />
                                </Route>
                                <Route
                                    path="/login"
                                    exact={true}
                                    render={(props) => <Login {...props} />}
                                />
                                <Route
                                    path="/principal"
                                    exact={true}
                                    render={(props) => <Principal {...props} />}
                                />
                                <Route
                                    path="/inicio"
                                    render={(props) => <Inicio {...props} />}
                                />
                                <Route component={NotFound} />
                            </Switch>

                        </BrowserRouter>
                    )
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

const mapDispatchToProps = (dispatch) => {
    return {
        restore: (user) => dispatch(restoreToken(user))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);