export default class GodiceResolver extends foundry.applications.dice.RollResolver {
  handlerId;

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "godice-resolver",
    template: "modules/godice/templates/godice-resolver.hbs",
    window: { title: "GoDice Companion" },
    position: { width: 720 },
    form: {
      handler: this._fulfillRoll
    }
  }

  /** @override */
  static PARTS = {
    form: {
      id: "form",
      template: "modules/godice/templates/godice-resolver.hbs"
    }
  };

  /* -------------------------------------------- */

  static _rollingChatMessages = [];

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    context.roll = this.roll;

    const facesToImages = {
      4: "modules/godice/artwork/d4_white.png",
      6: "modules/godice/artwork/d6_white.png",
      8: "modules/godice/artwork/d8_white.png",
      10: "modules/godice/artwork/d10_white.png",
      12: "modules/godice/artwork/d12_white.png",
      20: "modules/godice/artwork/d20_white.png",
      100: "modules/godice/artwork/d10_white.png",
    };

    context.terms = [];
    for ( const [id, { results }] of Object.entries(context.groups) ) {
      const { term } = this.fulfillable.get(id);
      const { denomination, faces } = term;
      results.forEach(r => {
        r.faces = faces;
        r.image = facesToImages[faces];
        r.icon = `dice-${denomination}`;
        context.terms.push(r);
      });
    }

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  static async _fulfillRoll(event, form, formData) {
    for ( let [id, results] of Object.entries(formData.object) ) {
      const { term } = this.fulfillable.get(id);
      if ( !Array.isArray(results) ) results = [results];
      for ( let i = 0; i < results.length; i++ ) {
        const result = results[i];
        const roll = term.results[i] ??= { result: undefined, active: true };
        if ( roll.result === undefined ) {
          if ( result === null ) roll.result = term.randomFace();
          else roll.result = result;
        }
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _onRender() {
    // Adding event handler to each input
    let diceInputs = $(".dice-term-input");
    diceInputs.each((index) => {
      let input = diceInputs[index];

      $(input).on("blur", () => {
        let value = input.valueAsNumber;
        // Getting the inputs's according icon
        const span = input.previousElementSibling;
        const icon = span.previousElementSibling;
        const term = span.closest(".dice-term");
        const faces = span.closest(".dice-term");
        if (value) {
          // Value is fulfilled
          icon.classList.add("fulfilled");
          term.classList.add("fulfilled");
          faces.classList.add("fulfilled");
        } else {
          // Value is unfulfilled
          icon.classList.remove("fulfilled");
          term.classList.remove("fulfilled");
          faces.classList.remove("fulfilled");
        }
      });
    });

    const api = game.modules.get("godice").api;

    this.handlerId = api.connection.registerRollHandler(
      this._handleRoll.bind(this)
    );

    if (!api.connection.isConnected) {
      ui.notifications.error("GoDice is not connected, make sure you have the App open.");
      return;
    }

    this._blinkForFulfillableRolls()
  }

  /* -------------------------------------------- */

  _blinkForFulfillableRolls(){
    const diceIds = this._getDiceIdsForBlink(this.fulfillable.values());
    
    for (const id of diceIds) {
      game.modules.get("godice").api.connection.blink(id);
    }
  }
  
  /* -------------------------------------------- */

  _getDiceIdsForBlink(entries){
    const selectedDice = new Set();
    const connected = Array.from(
      game.modules.get("godice").api.connection.getConnectedDice()
    );

    function findUnselectedDieByShell(shell){
      return connected.find(
          (die) => !selectedDice.has(die.id) && die.shell === shell
        );
    }

    function selectDieByShell(shell){
      const die = findUnselectedDieByShell(shell);
      if (!die)
        return;
    
      selectedDice.add(die.id);
    }

    for (const entry of entries) {
      let shell = `D${entry.term._faces}`;
      if (shell == "D100") {
        selectDieByShell("D10");
        selectDieByShell("D10X");
        continue;
      }
      
      selectDieByShell(shell);
    }

    return selectedDice;
  }

  /* -------------------------------------------- */

  _handleRoll(data) {
    switch(data.event){
      case "die_roll_started":
        this._handleRollStart(data);
        break;
      case "die_roll_ended":
        this._handleRollEnd(data);
        this._checkDone();
        break;
    }
  }

/* -------------------------------------------- */

  _handleRollStart(data){
    const input = this._getMatchingInput(data, false);
    if (!input) 
      return;

    if (input.dataset.denomination === "d100") {
      input.dataset[_asRolling(data.die.shell)] = true;
    } else {
      input.dataset.rolling = true;
    }

    this._createRollingChatMessage(input, data.die.shell);
  }

  /* -------------------------------------------- */

  _getMatchingInput(event, isRolling) {
    const inputs = Array.from(this.element.querySelectorAll("input"));

    const d100s = inputs.filter((input) => input.dataset.denomination === "d100");

    let shell = event.die.shell.toLowerCase();
    if (d100s.length > 0 && (shell === "d10" || shell === "d10x")) {
      let validTerm = d100s.find(
        (input) =>
          input.dataset[_asRolling(shell)] === String(isRolling) &&
          input.dataset[_asResolved(shell)] === "false"
      );

      if (validTerm)
        return validTerm;
    }

    // Else find the first input field matching this die size that does not have a value
    return inputs.find(
      (input) =>
        input.dataset.denomination === shell &&
        !input.value &&
        input.dataset.rolling === String(isRolling)
    );
  }

  /* -------------------------------------------- */

  _createRollingChatMessage(input, shell){
    const span = input.previousElementSibling;

    // Spin animation for icon
    const icon = span.previousElementSibling;
    if (!icon.classList.contains("fa-spin")) {
      icon.classList.add("fa-spin");
    }

    const message = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<i class="fas ${input.dataset.icon} fa-spin"></i> Rolling ${shell}...`,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    };

    ChatMessage.create(message).then((createdChatMessage) => {
      GodiceResolver._rollingChatMessages.push(createdChatMessage);
    });
  }

  /* -------------------------------------------- */

  _handleRollEnd(data){
    const input = this._getMatchingInput(data, true);
    if (!input)
      return;

    // Find the span sibling before the input field
    const span = input.previousElementSibling;
    const icon = span.previousElementSibling;

    function removeSpinAnimation() {
      icon.classList.remove("fa-spin");
    }

    let fullyResolved = true; // Was the roll fully resolved, used for d100s
    if (input.dataset.denomination === "d100") {
      input.dataset[_asRolling(data.die.shell)] = false;
      input.dataset[_asResolved(data.die.shell)] = true;

      // First resolved roll (logical xor!)
      const d100isPending = input.dataset[_asResolved("d10")] != input.dataset[_asResolved("d10x")];

      if (d100isPending) {
        input.value = data.die.value;
        fullyResolved = false;

        // Removing spin animation if the other die isn't still rolling (we know at least one is false)
        if (input.dataset[_asRolling("d10")] == input.dataset[_asRolling("d10x")]) {
          removeSpinAnimation();
        }
      } else {
        // Fully resolved

        // Removing spin animation
        input.value = String(
          parseInt(input.value) + parseInt(data.die.value)
        );
        if (input.value == 0) {
          // If both dice rolled 0 the result should be 100
          input.value = 100;
        }

        removeSpinAnimation();
      }
    } else {
      input.dataset.rolling = false;
      input.value = data.die.value;

      // Temporary D10 Fix
      if (input.value == 0) {
        input.value = 10;
      }
      
      removeSpinAnimation();
    }

    if (fullyResolved) {
      icon.classList.add("fulfilled");

      // Add a fulfilled class to the parent .dice-term
      const term = span.closest(".dice-term");
      term.classList.add("fulfilled");
      const faces = span.closest(".dice-term");
      faces.classList.add("fulfilled");
    }

    this._deleteLastRollingChatMessage();
  }

  /* -------------------------------------------- */

  _deleteLastRollingChatMessage(){
    const message = GodiceResolver._rollingChatMessages.pop();
    if (!message)
      return;
    
    message.delete();
  }

  /* -------------------------------------------- */

  static _asRolling(shell){
    return shell.toLowerCase() + "rolling";
  }
  
  /* -------------------------------------------- */

  static _asResolved(shell){
    return shell.toLowerCase() + "resolved";
  }

  /* -------------------------------------------- */

  /** @override */
  _checkDone() {
    const submitter = this.element.querySelector('button[type="submit"]');
    if ( submitter.disabled ) return;
    for ( const input of this.element.querySelectorAll("input") ) {
      if ( input.value === "" ) return;
    }
    this.element.requestSubmit(submitter);
  }

  /* -------------------------------------------- */

  async close(options = {}) {
    game.modules
      .get("godice")
      .api.connection.unregisterRollHandler(this.handlerId);
    return super.close(options);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async resolveResult(term, method, { reroll=false, explode=false }={}) {
    if ( (method !== "godice") && (method !== "manual") ) return;
    const { denomination } = term;
    const icon = term.faces === 100 ? "d10" : denomination;
    const field = document.createElement("div");
    field.classList.add("dice-term", "flexcol");
    field.innerHTML = `
      <img src="modules/godice/artwork/${icon}_white.png" alt="${denomination}" class="dice-term-image"
           width="240" height="240">
      <p class="dice-term-faces"><strong>${denomination}</strong></p>
      <input type="number" class="dice-term-input" name="${term._id}" min="1" max="${term.faces}" step="1"
             data-icon="dice-${icon}" data-rolling="false" data-denomination="${denomination}" data-d10rolling="false"
             data-d10resolved="false" data-d10xrolling="false" data-d10xresolved="false">
    `;
    this.element.querySelector(".terms").append(field);
    this.setPosition({ height: "auto" });
    this._toggleSubmission(true);
    return new Promise(resolve => {
      const input = field.querySelector("input");
      this.element.addEventListener("submit", () => {
        let value = input.valueAsNumber;
        if ( !value ) value = term.randomFace();
        input.value = `${value}`;
        resolve(value);
      }, { once: true });
    });
  }
}
