"use strict";

const $ = require("jquery");
const escape = require("css.escape");
const socket = require("../socket");
const render = require("../render");
const webpush = require("../webpush");
const slideoutMenu = require("../slideout");
const sidebar = $("#sidebar");
const storage = require("../localStorage");
const utils = require("../utils");

socket.on("init", function(data) {
	$("#loading-page-message, #connection-error").text("Rendering…");

	const lastMessageId = utils.lastMessageId;
	let previousActive = 0;

	if (lastMessageId > -1) {
		previousActive = sidebar.find(".active").data("id");
		sidebar.find(".networks").empty();
	}

	if (data.networks.length === 0) {
		sidebar.find(".empty").show();

		$("#footer").find(".connect").trigger("click", {
			pushState: false,
		});
	} else {
		render.renderNetworks(data);
	}

	$("#connection-error").removeClass("shown");
	$(".show-more button, #input").prop("disabled", false);
	$("#submit").show();

	if (lastMessageId < 0) {
		if (data.token) {
			storage.set("token", data.token);
		}

		webpush.configurePushNotifications(data.pushSubscription, data.applicationServerKey);

		slideoutMenu.enable();

		const viewport = $("#viewport");

		if ($(window).outerWidth() >= utils.mobileViewportPixels) {
			slideoutMenu.toggle(storage.get("thelounge.state.sidebar") === "true");
			viewport.toggleClass("rt", storage.get("thelounge.state.userlist") === "true");
		}

		$(document.body).removeClass("signed-out");
		$("#loading").remove();
		$("#sign-in").remove();

		if (window.g_LoungeErrorHandler) {
			window.removeEventListener("error", window.g_LoungeErrorHandler);
			window.g_LoungeErrorHandler = null;
		}
	}

	openCorrectChannel(previousActive, data.active);
});

function openCorrectChannel(clientActive, serverActive) {
	let target = $();

	// Open last active channel
	if (clientActive > 0) {
		target = sidebar.find(`.chan[data-id="${clientActive}"]`);
	}

	// Open window provided in location.hash
	if (target.length === 0 && window.location.hash) {
		target = $(`[data-target="${escape(window.location.hash)}"]`).first();
	}

	// Open last active channel according to the server
	if (serverActive > 0 && target.length === 0) {
		target = sidebar.find(`.chan[data-id="${serverActive}"]`);
	}

	// Open first available channel
	if (target.length === 0) {
		target = sidebar.find(".chan").first();
	}

	// If target channel is found, open it
	if (target.length > 0) {
		target.trigger("click", {
			replaceHistory: true,
		});

		return;
	}

	// Open the connect window
	$("#footer .connect").trigger("click", {
		pushState: false,
	});
}
