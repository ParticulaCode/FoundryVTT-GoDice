import GodiceResolver from "../apps/godice-resolver.js";
import DiceConnection from "./dice-connection.mjs";

Hooks.once('init', () => {
    game.settings.register("godice", "websocketurl", {
        default: "",
        config: true,
        title: "GoDice Websocket URL",
        hint: "The URL of the GoDice websocket server, found in the GoDice app.",
        placeholder: "ws://192.168.68.XYZ:8596/FoundryVTT",
        type: String,
        scope: "client",
        onChange: () => {
            game.modules.get("godice").api.connection.connect();
        }
    });
});

Hooks.once('unfulfilled-rolls-bluetooth', function(providers) {

    return foundry.utils.mergeObject(providers, {
        "godice": {
            label: "GoDice",
            icon: "modules/godice/assets/godice.png",
            url: "https://particula-tech.com/godice/",
            app: GodiceResolver
        }
    })
});

Hooks.once("ready", () => {
    game.modules.get("godice").api = {
        connection: new DiceConnection()
    }
});
