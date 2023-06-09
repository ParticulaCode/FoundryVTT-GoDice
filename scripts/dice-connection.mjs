export default class DiceConnection {

    _webSocket = null;
    connectedDice = new Map();
    _reconnectInterval = null;
    _rollHandlers = new Map();
    isConnected = false;

    constructor() {
        this.connect();
    }

    /* -------------------------------------------- */

    connect() {
        if ( this._webSocket ) {
            this._webSocket.close();
        }
        this.connectedDice.clear();
        const url = game.settings.get("godice", "websocketurl");
        if (url) {
            this._webSocket = new WebSocket(url);
            this._webSocket.onopen = this._onOpen.bind(this);
            this._webSocket.onmessage = this._onMessage.bind(this);
            this._webSocket.onclose = this._onClose.bind(this);
            this._webSocket.onerror = this._onError.bind(this);
        }
    }

    /* -------------------------------------------- */

    // Attempt to reconnect every 5 seconds
    _attemptReconnect() {
        if ( this._reconnectInterval ) {
            return;
        }
        this._reconnectInterval = setInterval(() => {
            this.connect();
        }, 5000);
    }

    /* -------------------------------------------- */

    _onOpen(event) {
        console.log("GoDice websocket connection opened");
        clearInterval(this._reconnectInterval);
        this._reconnectInterval = null;
        this.isConnected = true;
    }

    /* -------------------------------------------- */

    _onMessage(event) {
        console.log("GoDice websocket message received");
        const data = JSON.parse(event.data);
        console.dir(data);

        const dieEvents = ["die_connected", "die_shell_changed", "die_battery_updated"];

        function dieConnection(die) {
            const state = this.connectedDice.get(die.id) ?? {};
            this.connectedDice.set(die.id, foundry.utils.mergeObject(state, die));
            Hooks.callAll("godice-die-connected", data);
        }

        if ( data.event === "die_roll_started" ) {
            Hooks.callAll("godice-roll-started", data);
            for ( const handler of this._rollHandlers.values()  ) {
                handler(data);
            }
        }
        else if ( data.event === "die_roll_ended" ) {
            Hooks.callAll("godice-roll-ended", data);
            for ( const handler of this._rollHandlers.values() ) {
                handler(data);
            }
        }
        else if ( data.event === "registered_dice" ) {
            data.dice.forEach(d => dieConnection.call(this, d));
        }
        else if ( dieEvents.includes(data.event) ) {
            dieConnection.call(this, data.die);
        }
        else if ( data.event === "die_disconnected" ) {
            this.connectedDice.delete(data.die.id);
            Hooks.callAll("godice-die-disconnected", data);
        }
    }

    /* -------------------------------------------- */

    _onClose(event) {
        console.log("GoDice websocket connection closed");
        this._webSocket = null;
        this.isConnected = false;
        this._attemptReconnect();
    }

    /* -------------------------------------------- */

    _onError(event) {
        console.log("GoDice websocket error", event);
    }

    /* -------------------------------------------- */

    registerRollHandler(handler) {
        const id = foundry.utils.randomID();
        this._rollHandlers.set(id, handler);
        return id;
    }

    /* -------------------------------------------- */

    unregisterRollHandler(id) {
        this._rollHandlers.delete(id);
    }

    /* -------------------------------------------- */

    blink(id, color) {
        if ( !this._webSocket ) {
            console.error("GoDice websocket not connected");
            return;
        }

        if ( !color ) color = [1, 0.180, 0.100];

        // Send a message to the GoDice socket to flash the die
        const payload = JSON.stringify({
            "event": "blink_die",
            "die": {
                "id": id
            },
            "settings": {
                "blinks_amount": 4,
                "color": color,
                "duration_on": 0.3,
                "duration_off": 0.3,
                "is_mixed": true,
            }
        });
        this._webSocket.send(payload);
    }
}
