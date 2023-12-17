export default class GodiceResolver extends FormApplication {
  handlerId;

  constructor(terms, roll, callback) {
    super({});
    this.terms = terms;
    this.roll = roll;
    this.callback = callback;
  }

  /* -------------------------------------------- */

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "godice-resolver",
      template: "modules/godice/templates/godice-resolver.hbs",
      title: "GoDice Companion",
      popOut: true,
      width: 720,
      submitOnChange: false,
      submitOnClose: true,
      closeOnSubmit: true,
    });
  }

  /* -------------------------------------------- */

  static createdChatMessages = [];

  /* -------------------------------------------- */

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);

    const facesToImages = {
      4: "modules/godice/artwork/d4_white.png",
      6: "modules/godice/artwork/d6_white.png",
      8: "modules/godice/artwork/d8_white.png",
      10: "modules/godice/artwork/d10_white.png",
      12: "modules/godice/artwork/d12_white.png",
      20: "modules/godice/artwork/d20_white.png",
      100: "modules/godice/artwork/d10_white.png",
    };

    context.terms = this.terms;
    for (const term of context.terms) {
      term.image = facesToImages[term.faces];
    }
    context.roll = this.roll;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData = {}) {
    const data = super._getSubmitData(updateData);

    // Find all input fields and add placeholder values to inputs with no value
    const inputs = this.form.querySelectorAll("input");
    for (const input of inputs) {
      if (!input.value) {
        data[input.name] = input.placeholder;
      }
    }

    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    // Turn the entries into a map
    const fulfilled = new Map();
    for (const [id, result] of Object.entries(formData)) {
      // Parse the result as a number
      fulfilled.set(id, Number(result));
    }
    this.callback(fulfilled);
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

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

    // Setting input behavior
    const api = game.modules.get("godice").api;
    this.handlerId = api.connection.registerRollHandler(
      this.handleRoll.bind(this)
    );

    if (!api.connection.isConnected) {
      ui.notifications.error(
        "GoDice is not connected, make sure you have the App open."
      );
      return;
    }

    const toBlink = new Set();
    const connected = Array.from(
      game.modules.get("godice").api.connection.connectedDice.values()
    );
    for (const term of this.terms) {
      // Find the first connected die not already in set that has a matching shell
      let shell = `D${term.faces}`;
      if (shell == "D100") {
        const d10 = connected.find(
          (die) => !toBlink.has(die.id) && die.shell === "D10"
        );
        const d10x = connected.find(
          (die) => !toBlink.has(die.id) && die.shell === "D10X"
        );
        if (d10) {
          toBlink.add(d10.id);
        }
        if (d10x) {
          toBlink.add(d10x.id);
        }
      } else {
        const die = connected.find(
          (die) => !toBlink.has(die.id) && die.shell === shell
        );
        if (die) {
          toBlink.add(die.id);
        }
      }
    }
    for (const id of toBlink) {
      game.modules.get("godice").api.connection.blink(id);
    }
  }

  /* -------------------------------------------- */

  handleRoll(data) {
    const inputs = Array.from(this.element.find("input"));
    function matchingInput(event, rolling) {
      let dieSize = event.die.shell.toLowerCase(); // "D20", "D8", etc

      // Checking d100s
      if (
        inputs.find((input) => input.name.toLowerCase().startsWith("d100")) &&
        (dieSize === "d10" || dieSize === "d10x")
      ) {
        // Getting all d100s
        const d100s = inputs.filter((input) =>
          input.name.toLowerCase().startsWith("d100")
        );

        // Checking if there is an unresolved, non rolling d100 term
        let validTerm = d100s.find(
          (input) =>
            input.dataset[dieSize + "rolling"] === String(rolling) &&
            input.dataset[dieSize + "resolved"] === "false"
        );
        if (validTerm) {
          return validTerm;
        }
      }

      // Else find the first input field matching this die size that does not have a value
      return inputs.find(
        (input) =>
          input.name.toLowerCase().startsWith(dieSize) &&
          !input.value &&
          input.dataset.rolling === String(rolling)
      );
    }

    if (data.event === "die_roll_started") {
      const input = matchingInput(data, false);
      if (input) {
        if (input.name.startsWith("d100")) {
          input.dataset[data.die.shell.toLowerCase() + "rolling"] = true;
        } else {
          input.dataset.rolling = true;
        }

        // Find the span sibling before the input field and add a " - Rolling..." message
        const span = input.previousElementSibling;
        /*span.innerText += " - Rolling...";*/

        // Find the font awesome icon and apply the animation
        const icon = span.previousElementSibling;
        if (!icon.classList.contains("fa-spin")) {
          icon.classList.add("fa-spin");
        }

        // Create a chat message to indicate that the die is rolling
        const message = {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `<i class="fas ${input.dataset.icon} fa-spin"></i> Rolling ${data.die.shell}...`,
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        };
        ChatMessage.create(message).then((createdChatMessage) => {
          GodiceResolver.createdChatMessages.push(createdChatMessage);
        });
      }
    } else if (data.event === "die_roll_ended") {
      const input = matchingInput(data, true);
      if (input) {
        // Find the span sibling before the input field
        const span = input.previousElementSibling;
        // Find the font awesome icon
        const icon = span.previousElementSibling;

        let fullyResolved = true; // Was the roll fully resolved, used for d100s
        if (input.name.startsWith("d100")) {
          input.dataset[data.die.shell.toLowerCase() + "rolling"] = false;
          input.dataset[data.die.shell.toLowerCase() + "resolved"] = true;

          // First resolved roll (logical xor!)
          if (input.dataset["d10resolved"] != input.dataset["d10xresolved"]) {
            input.value = data.die.value;
            fullyResolved = false;

            // Removing spin animation if the other die isn't still rolling (we know at least one is false)
            if (input.dataset["d10rolling"] == input.dataset["d10xrolling"]) {
              icon.classList.remove("fa-spin");
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
            icon.classList.remove("fa-spin");
          }
        } else {
          input.dataset.rolling = false;
          input.value = data.die.value;

          // Temporary D10 Fix
          if (input.value == 0) {
            input.value = 10;
          }
          // Removing spin animation
          icon.classList.remove("fa-spin");
        }

        if (fullyResolved) {
          icon.classList.add("fulfilled");

          // Add a fulfilled class to the parent .dice-term
          const term = span.closest(".dice-term");
          term.classList.add("fulfilled");
          const faces = span.closest(".dice-term");
          faces.classList.add("fulfilled");
        }

        // Delete the chat message that indicated that the die was rolling
        const createdChatMessage = GodiceResolver.createdChatMessages.pop();
        if (createdChatMessage) {
          createdChatMessage.delete();
        }
      }

      // If all input fields have values, submit the form
      if (
        inputs.every((input) => input.value) &&
        inputs
          .filter((input) => input.name.toLowerCase().startsWith("d100"))
          .every(
            (input) =>
              input.dataset["d10resolved"] == String(true) &&
              input.dataset["d10xresolved"] == String(true)
          )
      ) {
        this.submit();
      }
    }
  }

  /* -------------------------------------------- */

  async close(options = {}) {
    game.modules
      .get("godice")
      .api.connection.unregisterRollHandler(this.handlerId);
    return super.close(options);
  }
}
