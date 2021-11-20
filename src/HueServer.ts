import * as express from "express";
import { v3 } from 'node-hue-api';
import { Api } from "node-hue-api/dist/esm/api/Api";
import { Groups } from "node-hue-api/dist/esm/api/Groups";
import { LocalBootstrap } from "node-hue-api/dist/esm/api/http/LocalBootstrap";

const GroupLightState = require('node-hue-api').v3.model.lightStates.GroupLightState;

export class HueServer {
	public static instance: HueServer;

	private port: number;
	private app;
	private http;
	private api: Api;
	/*
	hue.discovery.nupnpSearch().then(async (bridges) => {
		if (!bridges || !bridges[0]) {
			throw "No bridge found";
		}
		let ip = bridges[0].ipaddress;
	
		console.log("Found bridge: " + ip);
	
		let test = hue.v3.api.createLocal(ip);
	
		let api = await test.connect("bv0Wd8lfozah8S6UyfzSeNMbJbDmcFrf0f5VUVSO");
	
		console.log("Connected");
	
		console.log(await api.lights.getAll());
	});
	*/
	constructor(config: any) {
		HueServer.instance = this;
		HueServer.instance.port = config.port;
		this.app = express();
		this.app.set("port", HueServer.instance.port);
		this.http = require("http").Server(this.app);

		let localBootstrap: LocalBootstrap = v3.api.createLocal(config.bridge_ip);

		localBootstrap.connect(config.bridge_username).then((api) => {
			HueServer.instance.api = api;

			console.log("Hue API connected");

			this.http.listen(HueServer.instance.port, function () {
				console.log("Listening on port " + HueServer.instance.port);
			});
		});

		this.app.get("/get_lights", async (req, res) => {
			let lights = await HueServer.instance.api.lights.getAll();

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify({
				"success": true,
				"data": lights
			}, null, 4));
		});

		this.app.get("/get_groups", async (req, res) => {
			let groups = await HueServer.instance.api.groups.getAll();

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify({
				"success": true,
				"data": groups
			}, null, 4));
		});

		this.app.get("/get_scenes", async (req, res) => {
			let scenes = await HueServer.instance.api.scenes.getAll();

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify({
				"success": true,
				"data": scenes
			}, null, 4));
		});

		this.app.get("/all_off", async (req, res) => {
			let group = await HueServer.instance.api.groups.getGroup(0);
			await HueServer.instance.api.groups.setGroupState(group.id, new GroupLightState().off());

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify({
				"success": true
			}, null, 4));
		});

		
		this.app.get("/all_on", async (req, res) => {
			let group = await HueServer.instance.api.groups.getGroup(0);
			await HueServer.instance.api.groups.setGroupState(group.id, new GroupLightState().on());

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify({
				"success": true
			}, null, 4));
		});

		this.app.get("/activate_scene", async (req, res) => {
			if (req.query.id == undefined) {
				res.header("Content-Type", 'application/json');
				res.send(JSON.stringify({
					"success": false,
					"error": "BAD_REQUEST",
					"message": "Missing parameter: id"
				}, null, 4));
				return;
			}

			let response: any = {};

			try {
				let success = await HueServer.instance.api.scenes.activateScene(req.query.id + "");

				response.success = success;
				if (!success) {
					response.error = "FAILED";
					response.message = "Failed";
				}
			} catch(err) {
				response.success = false;
				response.error = "INVALID_ID";
				response.message = "Could not find scene with id: " + req.query.id;
			}

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify(response, null, 4));
		});

		this.app.get("/group_on", async (req, res) => {
			if (req.query.id == undefined) {
				res.header("Content-Type", 'application/json');
				res.send(JSON.stringify({
					"success": false,
					"error": "BAD_REQUEST",
					"message": "Missing parameter: id"
				}, null, 4));
				return;
			}

			let response: any = {};

			try {
				let group = await HueServer.instance.api.groups.getGroup(parseInt(req.query.id + ""));

				await HueServer.instance.api.groups.setGroupState(group.id, new GroupLightState().on());

				response.success = true;
			} catch(err) {
				response.success = false;
				response.error = "INVALID_ID";
				response.message = "Could not find scene with id: " + req.query.id;
			}

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify(response, null, 4));
		});

		this.app.get("/group_off", async (req, res) => {
			if (req.query.id == undefined) {
				res.header("Content-Type", 'application/json');
				res.send(JSON.stringify({
					"success": false,
					"error": "BAD_REQUEST",
					"message": "Missing parameter: id"
				}, null, 4));
				return;
			}

			let response: any = {};

			try {
				let group = await HueServer.instance.api.groups.getGroup(parseInt(req.query.id + ""));

				await HueServer.instance.api.groups.setGroupState(group.id, new GroupLightState().off());

				response.success = true;
			} catch(err) {
				response.success = false;
				response.error = "INVALID_ID";
				response.message = "Could not find scene with id: " + req.query.id;
			}

			res.header("Content-Type", 'application/json');
			res.send(JSON.stringify(response, null, 4));
		});
	}
}