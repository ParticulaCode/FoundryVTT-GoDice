export default class Utils{
	/* -------------------------------------------- */

	static _rollingChatMessages = [];

  /* -------------------------------------------- */

  static asRolling(shell){
    return shell.toLowerCase() + "rolling";
  }
  
  /* -------------------------------------------- */

  static asResolved(shell){
    return shell.toLowerCase() + "resolved";
  }

  /* -------------------------------------------- */
  
  static removeSpinAnimation(input) {
    const span = input.previousElementSibling;
    const icon = span.previousElementSibling;

    icon.classList.remove("fa-spin"); 
  }

  /* -------------------------------------------- */

  static addFulfilledClassToTerms(input){
    const span = input.previousElementSibling;
    const icon = span.previousElementSibling;

    icon.classList.add("fulfilled");

    const term = span.closest(".dice-term");
    term.classList.add("fulfilled");
    const faces = span.closest(".dice-term");
    faces.classList.add("fulfilled");
  }

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
      Utils._rollingChatMessages.push(createdChatMessage);
    });
  }

  /* -------------------------------------------- */

  static deleteLastRollingChatMessage(){
    const message = Utils._rollingChatMessages.pop();
    if (!message)
      return;
    
    message.delete();
  }
}