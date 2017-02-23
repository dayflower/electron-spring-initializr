'use strict';

const electron = require('electron');
const path = require('path');
const fs = require('fs');
const dlutil = require('dlutil');
const request = require('request');
const unzip = require('unzip');

const {app, BrowserWindow, ipcMain, dialog} = electron;

let win;

function createWindow() {
    win = new BrowserWindow({ width: 1024, height: 600 });
    win.on('closed', () => { win = null; });
    win.loadURL(`file://${__dirname}/index.html`);
}

ipcMain.on('submit', (ev, url, name) => {
    const dir = dialog.showOpenDialog(
        {
            properties: [ "openDirectory", "createDirectory", "promptToCreate" ]
        }
    )[0];

    fs.access(dir, fs.constants.W_OK, (err) => {
        if (err !== null) {
            fs.mkdirSync(dir);
        }

        const target = path.join(dir, name);
        fs.access(target, fs.constants.W_OK, (err) => {
            if (err === null) {
                dlutil.rmtree(target);
            }

            request(url)
                .pipe(unzip.Extract({ path: dir }))
                .on('close', () => {
                    dialog.showMessageBox(
                        {
                            type: 'info',
                            buttons: [ 'OK' ],
                            title: 'Message',
                            message: 'Project successfully created at ' + target
                        },
                        () => {
                            app.quit();
                        }
                    )
                });
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', createWindow);

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
