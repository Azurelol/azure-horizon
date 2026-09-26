import { Player } from "../data/combatant/player.mjs";
import { notifyInfo, systemID, systemPath } from "../constants.mjs";
import AH, { getFormSelectOptions } from "../config.mjs";
import { AsyncHooks, Dialogs } from "../helpers/_module.mjs";
import { CombatEvent } from "../data/common/combat-event.mjs";

/**
 * @typedef CombatUpdateData
 * @property {Number} round
 * @property {Number} turn
 * @property
 */

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {CombatDataModel} system
 * @property {Combatant[]} turns
 * @property {Combatant} combatant Get the Combatant who has the current turn.
 * @property {CombatHistoryData} current  Record the current round, turn, and tokenId to understand changes in the encounter state
 * @property {CombatHistoryData} previous Track the previous round, turn, and tokenId to understand changes in the encounter state
 * @property {Boolean} started
 * @property {Number} round
 * @property {Boolean} isActive Is this combat active in the current scene?
 * @property {Function<Promise>} startCombat Begin the combat encounter, advancing to round 1 and turn 1
 * @property {Function<Promise>} endCombat Display a dialog querying the GM whether they wish to end the combat encounter and empty the tracker
 * @property {Collection<AHCombatant>} combatants
 */
export class AHCombat extends foundry.documents.Combat {

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHCombat} combat      The combat preparing derived data.
     */
    Hooks.callAll("AH.prepareCombatData", this);
  }

  /**
   * @param {AHActor} actor
   * @returns True if the actor is present in the combat
   */
  hasActor(actor) {
    return this.actors.includes(actor);
  }

  /**
   * @param {String} uuid
   * @returns True if the actor is present in the combat
   */
  hasInstancedActor(uuid) {
    return this.actors.find((a) => a.resolveUuid() === uuid);
  }

  /**
   * @returns {AHActor[]}
   */
  get actors() {
    return Array.from(new Set(this.combatants.map((c) => c.actor)));
  }

  /**
   * @returns {AHCombatant[]}
   */
  getHeroes() {
    return this.combatants.filter(turn => turn.friendly);
  }

  /**
   * @returns {AHCombatant[]}
   */
  getAdversaries() {
    return this.combatants
      .filter(turn => turn.hostile)
      .sort((a, b) => b.initiative - a.initiative);
  }

  /**
   * @param {AHCombatant} combatant
   * @param turn
   * @return {Boolean}
   */
  isFirstTurn(combatant, turn) {
    // Get the other turns for the same actor
    let turns = this.turns.filter(t => (t.actorId === combatant.actorId) && (t._id !== turn.id));
    if (turns.length === 0) {
      return true;
    }

    // Lowest initiative among this actor's turns goes first
    return turns.every(t => turn.initiative >= t.initiative);
  }

  /**
   * @returns {Boolean}
   */
  static get hasActiveEncounter() {
    return !!game.combat;
  }

  /**
   * @returns {AHCombat}
   */
  static get activeEncounter() {
    return game.combat;
  }

  /* -------------------------------------------------- */
  /** @inheritdoc */
  async startCombat() {
    const factions = getFormSelectOptions(AH.combat.factions);
    const selectedFaction = await Dialogs.select("AH.COMBAT.FirstTurn", factions);
    if (!selectedFaction) {
      return this;
    }
    this.setFlag(systemID, AH.flags.Combat.FirstTurn, selectedFaction);
    await this.setCurrentTurn(selectedFaction);
    console.debug(`Combat started for ${this.combatants.length} combatants`);
    await this.#sortFactions();
    await super.startCombat();
    await AsyncHooks.callSequential(AH.hooks.COMBAT_EVENT, new CombatEvent("startOfCombat", this.round, this.combatants.contents));
    Hooks.call(AH.hooks.INITIATIVE, {
      round: this.round,
    });
  }

  async #sortFactions() {
    this.turns = [];
    const sorted = this.#zipCombatants(this.combatants.contents);
    const updates = sorted.map(c => ({ _id: c.id, initiative: c.initiative }));
    await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /**
   * @override
   */
  async endCombat() {
    // TODO: Set outcome
    // Default end combat is just a prompt
    const end = await foundry.applications.api.DialogV2.confirm({
      window: { icon: "fa-solid fa-xmark", title: "COMBAT.EndTitle" },
      content: `<p>${_loc("COMBAT.EndConfirmation")}</p>`,
      yes: { callback: () => this.delete() },
      modal: true,
    });
    if (end) {
      console.debug(`Combat ended for ${this.combatants.length} combatants`);
      await AsyncHooks.callSequential(AH.hooks.COMBAT_EVENT, new CombatEvent("endOfCombat", this.round, this.combatants.contents));
    }
    return end;
  }

  /* -------------------------------------------------- */
  /**
   * @returns {Boolean}
   */
  get isTurnStarted() {
    return this.combatant != null;
  }

  /**
   * @description Sets the faction that has the current turn
   * @param {"hostile" | "friendly"} flag
   */
  setCurrentTurn(flag) {
    if (game.user === game.users.activeGM) {
      if (flag) {
        return this.setFlag(systemID, AH.flags.Combat.CurrentTurn, flag);
      } else {
        return this.unsetFlag(systemID, AH.flags.Combat.CurrentTurn);
      }
    }
  }

  /**
   * @return {"hostile" | "friendly" | undefined} The faction whose turn it is
   */
  getCurrentTurn() {
    return this.getFlag(systemID, AH.flags.Combat.CurrentTurn);
  }

  /**
   * A workflow that occurs at the start of each Combat Turn.
   * This workflow occurs after the Combat document update.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * The default implementation of this function does nothing.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @param {AHCombatant} combatant               The Combatant whose turn just started
   * @param {CombatTurnEventContext} context    The context of the turn that just started
   * @returns {Promise<void>}
   * @protected
   */
  async _onStartTurn(combatant, context) {
    await AsyncHooks.callSequential(AH.hooks.COMBAT_EVENT, new CombatEvent("startOfTurn", this.round, this.combatants.contents).forCombatant(combatant));
    await combatant.onCombatChange("startOfTurn");
  }

  /**
   * A workflow that occurs at the end of each Combat Turn.
   * This workflow occurs after the Combat document update.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * The default implementation of this function does nothing.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @param {Combatant} combatant               The Combatant whose turn just ended
   * @param {CombatTurnEventContext} context    The context of the turn that just ended
   * @returns {Promise<void>}
   * @protected
   */
  async _onEndTurn(combatant, context) {
    await AsyncHooks.callSequential(AH.hooks.COMBAT_EVENT, new CombatEvent("endOfTurn", this.round, this.combatants.contents).forCombatant(combatant));
    await combatant.onCombatChange("endOfTurn");
  }

  /* -------------------------------------------------- */

  /**
   * This workflow occurs after a Combatant is added to the Combat.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * The default implementation of this function does nothing.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @param {AHCombatant} combatant    The Combatant that entered the Combat
   * @returns {Promise<void>}
   * @protected
   */
  async _onEnter(combatant) {
    console.info(`Combatant ${combatant.name} was added`);
    //await this.#rollFactionInitiative([combatant]);
    this.turns = [];
  }

  /**
   * This workflow occurs after a Combatant is removed from the Combat.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * The default implementation of this function does nothing.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @param {AHCombatant} combatant    The Combatant that exited the Combat
   * @returns {Promise<void>}
   * @protected
   */
  async _onExit(combatant) {
    console.info(`Combatant ${combatant.name} was removed`);
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc In Draw Steel's default initiative, non-GM users cannot change the round
   * @param {User} user The user attempting to change the round.
   * @returns {boolean} Is the user allowed to change the round?
   */
  _canChangeRound(user) {
    return user.isGM;
  }

  /** @inheritdoc */
  async nextRound() {
    await this.#rollFactionInitiative(this.combatants.contents, true);
    await super.nextRound();
    await AsyncHooks.callSequential(AH.hooks.COMBAT_EVENT, new CombatEvent("endOfRound", this.round, this.combatants.contents));
    Hooks.call(AH.hooks.INITIATIVE, {
      round: this.round,
    });
    return this;
  }

  /**
   * @param {AHCombatant[]} combatants
   * @param force
   * @returns {Promise} Updates
   */
  async #rollFactionInitiative(combatants = [], force = false) {

    let changed = false;
    for (const combatant of combatants) {
      if (!combatant?.isOwner) continue;
      const roll = combatant.getInitiativeRoll();
      await roll.evaluate();
      combatant.initiative = roll._total;
      changed = true;
    }

    if (!changed && !force) return this;

    // Update combatants and combat turn
    const updateOptions = { turnEvents: false };
    updateOptions.combatTurn = this.turn;

    // Now do a re-sort for all combatants
    const sorted = this.#zipCombatants(combatants);
    const updates = sorted.map(c => ({ _id: c.id, initiative: c.initiative }));
    await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /**
   * @param {AHCombatant[]} combatants
   * @returns {AHCombatant[]}
   */
  #zipCombatants(combatants) {

    combatants = combatants.sort(this._sortCombatants);

    // Sort combatants again to guarantee alternating between PCs and NPCs, starting with the highest initiative.
    const allies = combatants.filter(turn => turn.friendly);
    const enemies = combatants.filter(turn => turn.hostile);
    let alternatingTurns = [];

    // Decide which side leads the alternation - based on top initiative only, once
    let leading = allies;
    let trailing = enemies;
    const lead = this.getFlag(systemID, AH.flags.Combat.FirstTurn);
    if (lead !== "heroes") {
      leading = enemies;
      trailing = allies;
    }

    // Zip the two sides together by index - no per-step initiative comparison
    const maxLength = Math.max(leading.length, trailing.length);
    let initiative = maxLength;
    for (let i = 0; i < maxLength; i++) {
      if (leading[i]) {
        let lead = leading[i];
        lead.initiative = initiative--;
        alternatingTurns.push(lead);
      }
      if (trailing[i]) {
        let trail = trailing[i];
        trail.initiative = initiative--;
        alternatingTurns.push(trail);
      }
    }

    return alternatingTurns;
  }

  /* -------------------------------------------------- */

  /**
   * Adds a player combatant to the current combat.
   * @returns {Promise<import("./combatant.mjs").default>} The created Combatant.
   */
  async addPlayer() {
    const data = {
      type: "player",
      system: {},
    };
    const fdObject = await foundry.applications.api.DialogV2.input({
      window: { title: "AH.Combat.AddPlayerCombatTracker" },
      content: Player.schema.getField("user").toFormGroup().outerHTML,
    });
    foundry.utils.mergeObject(data, fdObject);
    const user = game.users.get(data.system.user);
    if (!user) return;
    data.name = user.name;
    data.img = user.avatar;
    const created = await this.createEmbeddedDocuments("Combatant", [data]);
    return created.shift();
  }

  /**
   * @remarks Variant createDialog that includes the Base type
   * @inheritdoc
   * @param {import("@common/types.mjs").CombatData} data
   * @param {import("@common/abstract/_types.mjs").DatabaseCreateOperation} createOptions
   * @param {context} context Options forwarded to DialogV2.prompt.
   * @param {string[]} [context.types]   A restriction of the selectable sub-types of the Dialog.
   * @param {string} [context.template]  A template to use for the dialog contents instead of the default.
   * @returns {Promise<AHCombat|null>}   A Promise which resolves to the created Document, or null if the dialog was
    *                                     closed.
   */
  static async createDialog(data = {}, createOptions = {}, { types, template, ...dialogOptions } = {}) {
    const applicationOptions = {
      top: "position", left: "position", width: "position", height: "position", scale: "position", zIndex: "position",
      title: "window", id: "", classes: "", jQuery: "",
    };

    for (const [k, v] of Object.entries(createOptions)) {
      if (k in applicationOptions) {
        foundry.utils.logCompatibilityWarning("The ClientDocument.createDialog signature has changed. "
          + "It now accepts database operation options in its second parameter, "
          + "and options for DialogV2.prompt in its third parameter.", { since: 13, until: 15, once: true });
        const dialogOption = applicationOptions[k];
        if (dialogOption) foundry.utils.setProperty(dialogOptions, `${dialogOption}.${k}`, v);
        else dialogOptions[k] = v;
        delete createOptions[k];
      }
    }

    const { parent, pack } = createOptions;
    const cls = this.implementation;

    // Identify allowed types
    const documentTypes = [];
    let defaultType = CONFIG[this.documentName]?.defaultType;
    let defaultTypeAllowed = false;
    let hasTypes = false;
    if (types?.length === 0) throw new Error("The array of sub-types to restrict to must not be empty");

    // Register supported types
    for (const type of this.TYPES) {
      if (types && !types.includes(type)) continue;
      let label = CONFIG[this.documentName]?.typeLabels?.[type];
      label = label && game.i18n.has(label) ? game.i18n.localize(label) : type;
      documentTypes.push({ value: type, label });
      if (type === defaultType) defaultTypeAllowed = true;
    }
    if (!documentTypes.length) throw new Error("No document types were permitted to be created");

    if (!defaultTypeAllowed) defaultType = documentTypes[0].value;
    // Sort alphabetically
    documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

    // Collect data
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", { type: label });
    const type = data.type || defaultType;

    // Render the document creation form
    template ??= systemPath("templates/combat/create-dialog.hbs");
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      hasTypes, type,
      name: data.name || "",
      defaultName: cls.defaultName({ type, parent, pack }),
      hasFolders: false,
      types: documentTypes,
    });

    // Render the confirmation dialog window
    return foundry.applications.api.DialogV2.prompt(foundry.utils.mergeObject({
      content: html,
      window: { title },
      position: { width: 360 },
      ok: {
        label: title,
        callback: (event, button) => {
          const fd = new foundry.applications.ux.FormDataExtended(button.form);
          foundry.utils.mergeObject(data, fd.object);
          if (!data.name?.trim()) data.name = cls.defaultName({ type: data.type, parent, pack });
          return cls.create(data, { renderSheet: false, ...createOptions });
        },
      },
    }, dialogOptions));
  }
}
