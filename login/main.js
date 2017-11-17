const {app, BrowserWindow} = require('electron')
// ipc is to communicate between html and server
var ipcMain = require('electron').ipcMain;

const path = require('path')
const url = require('url')

// required auth
const electronOauth2 = require('electron-oauth2');
var axios = require('axios');

// this is from the example, you can ignore most of it since you've probably already written it
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

/*
 * ipc is the event listener for 'sigin' which is emitted by the index.html file
 */
ipcMain.on('signin', googleSignIn)

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// auth (you need everything here)
var OAuthConfig = {
    clientId: '989100001352-4btfq6vummlpqrllo7gfdlgm1d2mu4el.apps.googleusercontent.com',
    clientSecret: 'EVD5v5UZb_gl_6Hhgyq3YNAR',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://www.googleapis.com/oauth2/v4/token',
    useBasicAuthorizationHeader: false,
    redirectUri: 'http://localhost'
};

const OAuthWindowParams = {
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
      nodeIntegration: false
  }
}

const OAuthOptions = {
  scope: 'profile email',
  accessType: 'offline'
};

const myApiOauth = electronOauth2(OAuthConfig, OAuthWindowParams);

// opens up a new popup window to signin
function googleSignIn() {
  myApiOauth.getAccessToken(OAuthOptions)
    .then((token) => {
      // use your token.id_token
      // axios http request
      axios.get("http://roadtrip-env.us-west-1.elasticbeanstalk.com/Authenticate/" + token.id_token)
      .then(response => {
        // AUTOMATICALLY PARSES JSON FOR YOU
        console.log(response.data);
        if(response.data.success){
          // successful user creation ... move on
          authSuccess(response.data);
        }else{
          // user is not created ... create a new user
          axios.post("http://roadtrip-env.us-west-1.elasticbeanstalk.com/Authenticate", token.id_token)
          .then(response => {
            console.log(response.data);
            if(response.data.success){
              // successful user creation ... move on
              authSuccess(response.data);
            }else{
              // user is not created ... google error
              authenticationError(response.data.message);
            }
          })
          .catch(error => {
            console.log(error);
          })
        }
      })
      .catch(error => {
        console.log(error);
      })
    });
}

//These functions will get called after auth is cleared/not

// user is the object defined in the document, and user will always be filled
function authSuccess(user){
  console.log('success!')
  win.webContents.send('message', user.message)
}

// will get called if google throws an error - nothing we can do
function authError(message){
  console.log('error: ' + message)
  win.webContents.send('message', user.message)
}