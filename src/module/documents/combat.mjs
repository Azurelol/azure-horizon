import { Player } from "../data/combatant/player.mjs";
import { notify, systemID, systemPath } from "../constants.mjs";
import AH, { getFormSelectOptions } from "../config.mjs";
import { Dialogs } from "../helpers/_module.mjs";
import { CombatEvent } from "../data/common/combat-event.mjs";

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {Combatant[]} turns
 * @property {Combatant} combatant Get the Combatant who has the current turn.
 * @property {CombatHistoryData} current  Record the current round, turn, and tokenId to understand changes in the encounter state
 * @property {CombatHistoryData} previous Track the previous round, turn, and tokenId to understand changes in the encounter state
 * @property {Boolean} started
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
   * @returns {AHActor[]}
   */
  get actors() {
    return Array.from(this.combatants.map((c) => c.actor));
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
    return super.startCombat();
  }

  /**
   * @override
   */
  async endCombat() {
    const end = await super.endCombat();
    if (end) {
      console.debug(`Combat ended for ${this.combatants.length} combatants`);
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
    // In memory adjustment that will get committed during the super call
    this.turn = null;
    await super.nextRound();

    notify("Setting up next round.");
    const combatantUpdates = this.combatants.map(c => ({ _id: c.id, initiative: c.actor?.system.profile.turns ?? 1 }));
    await this.updateEmbeddedDocuments("Combatant", combatantUpdates);
    return this;
  }

  /**
   * @param combatants
   * @returns {AHCombatant[]}
   */
  static sortFactions(combatants) {
    // Sort combatants again to guarantee alternating between PCs and NPCs, starting with the highest initiative.
    const allies = combatants.filter(turn => turn.friendly);
    const enemies = combatants.filter(turn => turn.hostile);
    let alternatingTurns = [];

    // Decide which side leads the alternation - based on top initiative only, once
    let leading = allies;
    let trailing = enemies;
    if (enemies[0] && (!allies[0] || (enemies[0].initiative ?? -Infinity) > (allies[0].initiative ?? -Infinity))) {
      leading = enemies;
      trailing = allies;
    }

    // Zip the two sides together by index - no per-step initiative comparison
    const maxLength = Math.max(leading.length, trailing.length);
    for (let i = 0; i < maxLength; i++) {
      if (leading[i]) alternatingTurns.push(leading[i]);
      if (trailing[i]) alternatingTurns.push(trailing[i]);
    }

    return alternatingTurns;
  }

  /**
   * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
   * @override
   * @returns {AHCombatant[]}
   */
  setupTurns() {
    this.turns ||= [];

    notify("Setting up turns");

    // Determine the turn order and the current turn
    /** @type AHCombatant[] **/
    let turns = this.combatants.contents.sort(this._sortCombatants);
    turns = AHCombat.sortFactions(turns);

    if (this.turn !== null) {
      if (this.turn < 0) this.turn = 0;
      else if (this.turn >= turns.length) {
        this.turn = 0;
        this.round++;
      }
      turns.forEach((c, i) => c.turnNumber = i);
    }

    // Update state tracking
    const c = turns[this.turn];
    this.current = this._getCurrentState(c);

    // One-time initialization of the previous state
    if (!this.previous) this.previous = this.current;

    // Return the array of prepared turns
    return this.turns = turns;
  }

  // /**
  //  * Advance the combat to the next round
  //  * @returns {Promise<this>}
  //  */
  // async nextRound() {
  //   await super.nextRound();
  //   await this.resetAll();
  // }

  /* -------------------------------------------------- */
  /**
   * @typedef CombatRenderData
   * @description Used by component rendering (such as the combat tracker, combat hud)
   * @property {Boolean} turnStarted
   * @property {AHCombatant} combatant
   * @property {Boolean} hasCombatStarted
   * @property turnsLeft
   * @property totalTurns
   * @property factions
   * @property currentTurn The faction whose turn it is
   * @property isGM
   * @property icons
   * @property showNpcTurns
   */

  /**
   * @param {CombatRenderData} data Used by the rendering components
   */
  populateData(data) {
    // Whether combat has started
    data.hasCombatStarted = this.started;
    // What faction's turn it is
    data.currentTurn = this.getCurrentTurn();
    // Combatant.ID : Total Turns
    data.totalTurns = this.combatants.reduce((agg, combatant) => {
      agg[combatant.id] = combatant.totalTurns;
      return agg;
    }, {});
    // Combatant ID : Turns Left
    data.turnsLeft = this.countTurnsLeft();
    // Whether an actor has started their turn
    data.turnStarted = this.isTurnStarted;
    // The current combatant, if any
    data.combatant = this.combatant;
    // Whether the user is a GM
    data.isGM = game.user?.isGM;
    // Icons
    data.icons = {
      active: game.settings.get(systemID, "play_circle"),
      outOfTurns: game.settings.get(systemID, "check_circle"),
      hiddenTurns: game.settings.get(systemID, "help"),
    };
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
