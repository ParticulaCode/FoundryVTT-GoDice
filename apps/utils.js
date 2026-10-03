export default class Utils{
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

  static isD100Input(input){
    return input.dataset.faces === "100";
  }

  /* -------------------------------------------- */

  // Match by number of faces rather than denomination, so system-defined dice
  // (e.g. Wrath & Glory's pool "dp" and wrath "dw" d6s) are filled by the matching GoDice shell
  static matchesShell(input, shell){
    return input.dataset.faces === shell.toLowerCase().replace(/^d/, "");
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
}