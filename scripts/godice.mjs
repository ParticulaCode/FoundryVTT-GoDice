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

});

Hooks.once('unfulfilled-rolls-bluetooth', function(providers) {

    return foundry.utils.mergeObject(providers, {
        "godice": {
            label: "GoDice",
            icon: "modules/godice/assets/GoDiceLogo.png",
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
