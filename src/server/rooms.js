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
exports.makeOrLoadRoom = makeOrLoadRoom;
var sync_core_1 = require("@tldraw/sync-core");
var promises_1 = require("fs/promises");
var path_1 = require("path");
// For this example we're just saving data to the local filesystem
var DIR = "./.rooms";
function readSnapshotIfExists(roomId) {
    return __awaiter(this, void 0, void 0, function () {
        var data, e_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, promises_1.readFile)((0, path_1.join)(DIR, roomId))];
                case 1:
                    data = _b.sent();
                    return [2 /*return*/, (_a = JSON.parse(data.toString())) !== null && _a !== void 0 ? _a : undefined];
                case 2:
                    e_1 = _b.sent();
                    return [2 /*return*/, undefined];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function saveSnapshot(roomId, snapshot) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, promises_1.mkdir)(DIR, { recursive: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, promises_1.writeFile)((0, path_1.join)(DIR, roomId), JSON.stringify(snapshot))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var rooms = new Map();
// Very simple mutex using promise chaining, to avoid race conditions
// when loading rooms. In production you probably want one mutex per room
// to avoid unnecessary blocking!
var mutex = Promise.resolve(null);
function makeOrLoadRoom(roomId) {
    return __awaiter(this, void 0, void 0, function () {
        var err;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mutex = mutex
                        .then(function () { return __awaiter(_this, void 0, void 0, function () {
                        var roomState_1, initialSnapshot, roomState;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!rooms.has(roomId)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, rooms.get(roomId)];
                                case 1:
                                    roomState_1 = _a.sent();
                                    if (!roomState_1.room.isClosed()) {
                                        return [2 /*return*/, null]; // all good
                                    }
                                    _a.label = 2;
                                case 2:
                                    console.log("loading room", roomId);
                                    return [4 /*yield*/, readSnapshotIfExists(roomId)];
                                case 3:
                                    initialSnapshot = _a.sent();
                                    roomState = {
                                        needsPersist: false,
                                        id: roomId,
                                        room: new sync_core_1.TLSocketRoom({
                                            initialSnapshot: initialSnapshot,
                                            onSessionRemoved: function (room, args) {
                                                console.log("client disconnected", args.sessionId, roomId);
                                                if (args.numSessionsRemaining === 0) {
                                                    console.log("closing room", roomId);
                                                    room.close();
                                                }
                                            },
                                            onDataChange: function () {
                                                roomState.needsPersist = true;
                                            },
                                        }),
                                    };
                                    rooms.set(roomId, roomState);
                                    return [2 /*return*/, null]; // all good
                            }
                        });
                    }); })
                        .catch(function (error) {
                        // return errors as normal values to avoid stopping the mutex chain
                        return error;
                    });
                    return [4 /*yield*/, mutex];
                case 1:
                    err = _a.sent();
                    if (err)
                        throw err;
                    return [2 /*return*/, rooms.get(roomId).room];
            }
        });
    });
}
// Do persistence on a regular interval.
// In production you probably want a smarter system with throttling.
setInterval(function () {
    for (var _i = 0, _a = Array.from(rooms.values()); _i < _a.length; _i++) {
        var roomState = _a[_i];
        if (roomState.needsPersist) {
            // persist room
            roomState.needsPersist = false;
            console.log("saving snapshot", roomState.id);
            saveSnapshot(roomState.id, roomState.room.getCurrentSnapshot());
        }
        if (roomState.room.isClosed()) {
            console.log("deleting room", roomState.id);
            rooms.delete(roomState.id);
        }
    }
}, 2000);
