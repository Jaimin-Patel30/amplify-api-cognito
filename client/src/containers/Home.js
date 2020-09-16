import React, { Component } from 'react';
import { PageHeader, ListGroup } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import './Home.css';

export default class Home extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			testApiCall: [],
			username: ""
		};
	}

	async isAuth() {
		const result = await Auth.currentAuthenticatedUser().then(user => {
			console.log(user);
			console.log(user.signInUserSession.idToken.jwtToken)
			console.log(user.username)
			this.state.username = user.username
			return true;
		}).catch(e => {
			console.log(e);
			return false;
		});

		return result;
	}

	async componentDidMount() {
		const auth = await this.isAuth();
		if (!auth) {
			return;
		} else {
			try {
				const testApiCall = await this.testApiCall();
				console.log("response data : ")
				console.log(testApiCall)
				const secCallWithKey = await this.testApiCallWithKey(testApiCall.LastEvaluatedKey)
				console.log("second response : ")
				console.log(secCallWithKey)
				this.setState({ testApiCall });
			} catch (e) {
				alert(e);
			}

			this.setState({ isLoading: false });
		}
	}

	testApiCallWithKey(lastKey) {
		const myInit = {
			body: {
				username: this.state.username,
				LastEvaluatedKey: lastKey
			},
			headers: {},
		};
		return API.post('testApiCall', '/hello', myInit);
	}

	testApiCall() {
		const myInit = {
			body: {username: this.state.username},
			headers: {},
		};
		return API.post('testApiCall', '/hello', myInit);
	}

	renderTestAPI(testApiCall) {
		console.log(testApiCall);
		return testApiCall.message;
	}

	renderLander() {
		return (
			<div className="lander">
				<h1>Test web app</h1>
				<p>A simple react test app</p>
			</div>
		);
	}

	renderTest() {
		return (
			<div className="test">
				<PageHeader>Test API call</PageHeader>
				<ListGroup>{!this.state.isLoading && this.renderTestAPI(this.state.testApiCall)}</ListGroup>
			</div>
		);
	}

	render() {
		return <div className="Home">{this.props.isAuthenticated ? this.renderTest() : this.renderLander()}</div>;
	}
}
