export default class helpGuide extends FormApplication {

    constructor() {
        super({});
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "help-guide",
            template: "modules/godice/templates/help-guide.hbs",
            title: "GoDice Help",
            popOut: true,
            width: 850,
            height: 500
        });
    }
}