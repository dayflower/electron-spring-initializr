'use strict';

const electron = require('electron');
const path = require('path');
const fs = require('fs');
const dlutil = require('dlutil');
const request = require('request');
const unzip = require('unzip');
const co = require('co');

const {app, BrowserWindow, ipcMain, dialog} = electron;

let win;

function createWindow() {
    win = new BrowserWindow({ width: 1024, height: 600 });
    win.on('closed', () => { win = null; });
    win.loadURL(`file://${__dirname}/index.html`);
}

function checkExistence(p, attr) {
    return new Promise((fulfill, reject) => {
        fs.access(p, attr, err => fulfill(err));
    });
}

ipcMain.on('submit', (ev, url, name) => {
    const dir = dialog.showOpenDialog(
        {
            properties: [ "openDirectory", "createDirectory", "promptToCreate" ]
        }
    )[0];
    const target = path.join(dir, name);

    co(function* () {
        const dirExistence = yield checkExistence(dir, fs.constants.W_OK);
        if (dirExistence !== null) {
            yield new Promise((fulfill, reject) => {
                fs.mkdir(dir, err => {
                    err === null ? fullfill() : reject(err);
                });
            });
        }

        const targetExistence = yield checkExistence(target, fs.constants.W_OK);
        if (targetExistence === null) {
            const res = yield new Promise((fulfill, reject) => {
                dialog.showMessageBox(
                    {
                        type: 'question',
                        buttons: [ 'Yes', 'No' ],
                        title: 'Message',
                        message: `'${name}' already exists. Overwrite it?`
                    },
                    () => fulfill()
                );
            });

            if (res === 0) {
                dlutil.rmtree(target);
            } else {
                ev.sender.send('enable-button');
                return;
            }
        }

        yield new Promise((fulfill, reject) => {
            request(url)
                .pipe(unzip.Extract({ path: dir }))
                .on('close', () => fulfill());
        });

        yield new Promise((fulfill, reject) => {
            dialog.showMessageBox(
                {
                    type: 'info',
                    buttons: [ 'OK' ],
                    title: 'Message',
                    message: 'Project successfully created at ' + target
                },
                () => fulfill()
            );
        });

        app.quit();
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
