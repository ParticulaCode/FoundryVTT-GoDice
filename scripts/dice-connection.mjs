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
    if (this._webSocket) {
      this._webSocket.close();
    }
    this.connectedDice.clear();
    const url = game.settings.get("godice", "websocketurl");
    if (url) {
      this._webSocket = new WebSocket(url + "/FoundryGDVTT");
      this._webSocket.onopen = this._onOpen.bind(this);
      this._webSocket.onmessage = this._onMessage.bind(this);
      this._webSocket.onclose = this._onClose.bind(this);
      this._webSocket.onerror = this._onError.bind(this);
    }
  }

  /* -------------------------------------------- */

  // Attempt to reconnect every 5 seconds
  _attemptReconnect() {
    if (this._reconnectInterval) {
      return;
    }
    this._reconnectInterval = setInterval(() => {
      this.connect();
    }, 5000);
  }

  /* -------------------------------------------- */

  _onOpen(event) {
    console.debug("GoDice websocket connection opened");
    clearInterval(this._reconnectInterval);
    this._reconnectInterval = null;
    this.isConnected = true;
  }

  /* -------------------------------------------- */

  _onMessage(event) {
    console.debug(`GoDice websocket message received: ${event.data}`);

    const data = JSON.parse(event.data);

    switch(data.event){
      case "die_registered":
      case "die_connected":
      case "die_shell_changed":
      case "die_battery_updated":
        this._updateDie(data.die);
        Hooks.callAll("godice-die-updated", data);
        break;
      case "die_disconnected":
        this.connectedDice.delete(data.die.id);
        Hooks.callAll("godice-die-disconnected", data);
        break;
      case "die_roll_started":
        Hooks.callAll("godice-roll-started", data);
        this._notifyRollHandlers(data)
        break;
      case "die_roll_ended":
        Hooks.callAll("godice-roll-ended", data);
        this._notifyRollHandlers(data)
        break;
      case "registered_dice":
        data.dice.forEach((d) => this._updateDie(d));
        break;  
    }
  }

  /* -------------------------------------------- */
  
  _notifyRollHandlers(data) {
    for (const handler of this._rollHandlers.values()) {
      handler(data);
    }
  }

  /* -------------------------------------------- */
  
  _updateDie(die) {
      const state = this.connectedDice.get(die.id) ?? {};
      this.connectedDice.set(die.id, foundry.utils.mergeObject(state, die));
  }

  /* -------------------------------------------- */

  _onClose(event) {
    console.debug("GoDice websocket connection closed");
    this._webSocket.close();
    this._webSocket = null;
    this.isConnected = false;
    this._attemptReconnect();
  }

  /* -------------------------------------------- */

  _onError(event) {
    console.debug("GoDice websocket error", event);
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

  getConnectedDice() {
    return this.connectedDice.values();
  }

  /* -------------------------------------------- */

  blink(id) {
    this._blink(id, [1, 0.18, 0.1]);
  }

  /* -------------------------------------------- */

  _blink(id, color) {
    if (!this._webSocket) {
      console.error("GoDice websocket not connected");
      return;
    }

    // Send a message to the GoDice socket to flash the die
    const payload = JSON.stringify({
      event: "blink_die",
      die: {
        id: id,
      },
      settings: {
        blinks_amount: 4,
        color: color,
        duration_on: 0.3,
        duration_off: 0.3,
        is_mixed: true,
      },
    });

    console.debug(`GoDice websocket message sent: ${payload}`);

    this._webSocket.send(payload);
  }
}
