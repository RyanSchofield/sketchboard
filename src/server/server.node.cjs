"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cors_1 = require("@fastify/cors");
var websocket_1 = require("@fastify/websocket");
var fastify_1 = require("fastify");
var assets_1 = require("./assets");
var rooms_1 = require("./rooms");
// import { unfurl } from "./unfurl";
var PORT = 5858;
// For this example we use a simple fastify server with the official websocket plugin
// To keep things simple we're skipping normal production concerns like rate limiting and input validation.
var app = (0, fastify_1.default)();
app.register(websocket_1.default);
app.register(cors_1.default, { origin: "*" });
app.register(function (app) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // This is the main entrypoint for the multiplayer sync
        app.get("/connect/:roomId", { websocket: true }, function (socket, req) { return __awaiter(void 0, void 0, void 0, function () {
            var roomId, sessionId, room;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        roomId = req.params.roomId;
                        sessionId = (_a = req.query) === null || _a === void 0 ? void 0 : _a["sessionId"];
                        return [4 /*yield*/, (0, rooms_1.makeOrLoadRoom)(roomId)];
                    case 1:
                        room = _b.sent();
                        // and finally connect the socket to the room
                        room.handleSocketConnect({ sessionId: sessionId, socket: socket });
                        return [2 /*return*/];
                }
            });
        }); });
        // To enable blob storage for assets, we add a simple endpoint supporting PUT and GET requests
        // But first we need to allow all content types with no parsing, so we can handle raw data
        app.addContentTypeParser("*", function (_, __, done) { return done(null); });
        app.put("/uploads/:id", {}, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        return [4 /*yield*/, (0, assets_1.storeAsset)(id, req.raw)];
                    case 1:
                        _a.sent();
                        res.send({ ok: true });
                        return [2 /*return*/];
                }
            });
        }); });
        app.get("/uploads/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var id, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        return [4 /*yield*/, (0, assets_1.loadAsset)(id)];
                    case 1:
                        data = _a.sent();
                        res.send(data);
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
app.listen({ port: PORT }, function (err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("Server started on port ".concat(PORT));
});
