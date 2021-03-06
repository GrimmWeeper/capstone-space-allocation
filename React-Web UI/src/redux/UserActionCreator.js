import { userConstants } from './UserActionType';
import { alertActions } from './AlertActionCreator';
import { history } from '../helper/history';


export const userActions = {
    login,
    logout,
    register

};

function login(user) {


    return dispatch => {
        dispatch(request(user));

        console.log(JSON.stringify(user));
        fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        }).then(response => {
            if (response.ok) {
                //success alert message
                localStorage.setItem('user', JSON.stringify(user));
                alert('Login Successful');
                dispatch(success(user));
                history.push('/floorplan');
                dispatch(alertActions.success('Login Successful'));
            }
            else {
                //error alert message
                //alert('Registration failed. Please try again.');
                alert('Invalid username or password.');
                dispatch(failure(response.json().toString()));
                dispatch(alertActions.error("failed"));
            }

        })
    };

    function request(user) { return { type: userConstants.LOGIN_REQUEST, user } }
    function success(user) { return { type: userConstants.LOGIN_SUCCESS, user } }
    function failure(error) { return { type: userConstants.LOGIN_FAILURE, error } }
}

function logout() {
    localStorage.removeItem('user');
    return { type: userConstants.LOGOUT };
}

function register(user) {
    return dispatch => {
        dispatch(request(user));

        console.log(JSON.stringify(user));
        fetch('http://localhost:3001/register', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        }).then(response => {
            if (response.ok) {
                //success alert message
                alert('Registration successful');
                dispatch(success());
                history.push('/login');
                dispatch(alertActions.success('Registration successful'));
            }
            else {
                //error alert message
                alert('Registration failed. Please try again.');
                dispatch(failure(response.json().toString()));
                dispatch(alertActions.error("failed"));
            }

        })
    };

    function request(user) { return { type: userConstants.REGISTER_REQUEST, user } }
    function success(user) { return { type: userConstants.REGISTER_SUCCESS, user } }
    function failure(error) { return { type: userConstants.REGISTER_FAILURE, error } }
}

