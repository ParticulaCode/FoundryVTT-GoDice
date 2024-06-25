import Utils from "./utils.js";
import Chat from "./chat.js";

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

    const shell = data.die.shell;
    if (Utils.isD100Input(input)) {
      input.dataset[Utils.asRolling(shell)] = true;
    } else {
      input.dataset.rolling = true;
    }

    Chat.createRollingChatMessage(input, shell);
  }

  /* -------------------------------------------- */

  _getMatchingInput(event, isRolling) {
    const inputs = Array.from(this.element.querySelectorAll("input"));

    const d100s = inputs.filter((input) => Utils.isD100Input(input));

    let shell = event.die.shell.toLowerCase();
    if (d100s.length > 0 && (shell === "d10" || shell === "d10x")) {
      let validTerm = d100s.find(
        (input) =>
          input.dataset[Utils.asRolling(shell)] === String(isRolling) &&
          input.dataset[Utils.asResolved(shell)] === "false"
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

  _handleRollEnd(data){
    const input = this._getMatchingInput(data, true);
    if (!input)
      return;

    if (input.dataset.denomination === "d100") {
      this._handleD100RollEnd(input, data);
    } else {
      this._handleNonD100RollEnd(input, data);
    }

    // TODO: This is inconsistent in case of multiple dice rolled with different shells. Dice will end up rolling in random order.
    Chat.deleteLastRollingChatMessage();
  }

  /* -------------------------------------------- */

  _handleD100RollEnd(input, data){
    this._setDieRollResolved(data.die, input)

    const d100isPending = input.dataset[Utils.asResolved("d10")] != input.dataset[Utils.asResolved("d10x")];

    if (d100isPending) {
      input.value = data.die.value;

      if (input.dataset[Utils.asRolling("d10")] == input.dataset[Utils.asRolling("d10x")])
        Utils.removeSpinAnimation(input);

      return;
    } 

    input.value = String(parseInt(input.value) + parseInt(data.die.value));

    // If both dice rolled 0 the result should be 100
    if (input.value == 0)
      input.value = 100;

    Utils.removeSpinAnimation(input);
    Utils.addFulfilledClassToTerms(input)
  }
  
  _setDieRollResolved(die, input){
    const shell = die.shell;
    input.dataset[Utils.asRolling(shell)] = false;
    input.dataset[Utils.asResolved(shell)] = true;
  }

  /* -------------------------------------------- */

  _handleNonD100RollEnd(input, data){
    input.dataset.rolling = false;
    input.value = data.die.value;

    // For d10: 0 => 10
    if (input.value == 0)
      input.value = 10;
    
    Utils.removeSpinAnimation(input);
    Utils.addFulfilledClassToTerms(input)
  }

  /* -------------------------------------------- */

  /** @override */
  _checkDone() {
    const inputs = Array.from(this.element.querySelectorAll("input"));
    if (inputs.every((input) => input.value) &&
        inputs
          .filter((input) => Utils.isD100Input(input))
          .every(
            (input) =>
              input.dataset[Utils.asResolved("d10")] === "true" &&
              input.dataset[Utils.asResolved("d10x")] === "true"
          )
      ) {
        const submitter = this.element.querySelector('button[type="submit"]');
        this.element.requestSubmit(submitter);
      }
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
