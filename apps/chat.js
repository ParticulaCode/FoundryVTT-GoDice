export default class Chat{
	/* -------------------------------------------- */

	static _rollingChatMessages = [];

  /* -------------------------------------------- */

  static createRollingChatMessage(input, shell){
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
      Chat._rollingChatMessages.push(createdChatMessage);
    });
  }

  /* -------------------------------------------- */

  static deleteLastRollingChatMessage(){
    const message = Chat._rollingChatMessages.pop();
    if (!message)
      return;
    
    message.delete();
  }

	/* -------------------------------------------- */
}