import GodiceResolver from "../apps/godice-resolver.js";
import unsecuredGuide from "../apps/help-guide.js";
import DiceConnection from "./dice-connection.mjs";

Hooks.once('init', () => {
    game.settings.register("godice", "websocketurl", {
        default: "",
        config: true,
        title: "GoDice Websocket URL",
        name: "GoDice Websocket address",
        label: "GoDice Websocket address",
        hint: "The URL of the GoDice WebSocket server, found in the GoDice app. If SSL mode is enabled on the app insert this address: wss://godice-connector.com:8596",
        placeholder: "ws://192.168.68.XYZ:8596/FoundryVTT",
        type: String,
        scope: "client",
        onChange: () => {
            game.modules.get("godice").api.connection.connect();
        }
    });
    game.settings.registerMenu("godice", "help-guide", {
        name: "Want to enable SSL? Need help?",
        label: "GoDice Support & SSL Hosting",
        type: unsecuredGuide,
        restricted: false
    });

    // Core Dice Configuration
    CONFIG.Dice.fulfillment.methods.godice = {
        label: "GoDice Bluetooth Dice",
        interactive: true,
        resolver: GodiceResolver
    };
});

Hooks.once("ready", () => {
    const connection = new DiceConnection();
    game.modules.get("godice").api = { connection };
    connection.registerRollHandler(handleRoll);
});

/**
 * Handle a roll event.
 * @param {object} data
 * @param {string} data.event  The event type.
 * @param {object} die         The die data.
 */
function handleRoll({ event, die }) {
    // If there is already a GoDice resolver active, allow it to handle the roll.
    if ( Array.from(Roll.defaultImplementation.RESOLVERS.values()).find(r => r instanceof GodiceResolver) ) return;

    // Otherwise register the result with the default RollResolver.
    if ( event === "die_roll_ended" ) {
        Roll.defaultImplementation.registerResult("godice", die.shell.toLowerCase(), die.value);
    }
}
