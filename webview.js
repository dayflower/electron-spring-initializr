"use strict";

const {ipcRenderer} = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    const form = $("#form");

    $(".full").removeClass("hidden");
    $(".tofullversion").addClass("hidden");
    $(".tosimpleversion").removeClass("hidden");

    $("#type").val("gradle-project");

    form.on("submit", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        $("button[name=generate-project]").prop("disabled", true);

        let a = document.createElement("a");
        a.href = form.attr("action") + "?" + form.serialize();
        ipcRenderer.send("submit", a.href, $("#name").val());
    });
});

ipcRenderer.on("enable-button", (ev) => {
    $("button[name=generate-project]").prop("disabled", false);
});
