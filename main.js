const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow} = electron;

let mainWindow;

// Listen and wait for app to be ready
app.on('ready',function(){
	// create the window
	mainWindow = new BrowserWindow({});
	// load html
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'WebContent/login.jsp'),
		protocol: 'file:',
		slahes: true
	}));
});