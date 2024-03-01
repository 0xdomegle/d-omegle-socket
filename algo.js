class User {
    constructor(_socketId, _address, _sdp) {
        this.socketId = _socketId;
        this.address = _address;
        this.sdp = _sdp;
        this.iceCandidates = [];
    }
}

class IceCandidates {
    constructor(_socketId, _address) {
        this.socketId = _socketId;
        this.address = _address;
        this.candidates = [];
    }
}

class Session {
    constructor(_offerer, _answerer) {
        this.sessionId = Date.now();
        this.offerer = _offerer;
        this.answerer = _answerer;
    }
}

// consider as an wating pool
const users = [];
const iceCandidates = [];
const sessions = [];

module.exports = { User, Session, users, sessions, IceCandidates, iceCandidates };
