import ActorDataModel from "./actor-data-model.mjs";
import AH from "../../config.mjs";
import { VersionedDataModel } from "../api/_module.mjs";
import { ActorResourceDataModel } from "./system/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";

/**
 * @property {ActorResourceDataModel} hp
 */
export class EntityResourcesDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      hp: new EmbeddedDataField(ActorResourceDataModel, {
        trackedAttribute: true,
      }),
    });
  }
}

/**
 * @typedef TrackedResource
 * @property {Number} value
 * @property {Number} max
 */

/**
 * @property {Record<String, TrackedResource>} trackers
 */
export class BaseEntityDataModel extends ActorDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      level: new NumberField({
        initial: AH.progression.level.minimum,
        min: AH.progression.level.minimum,
        max: AH.progression.level.maximum,
        integer: true,
        nullable: false,
      }),
      resources: new EmbeddedDataField(EntityResourcesDataModel, {}),
    });
  }

  /**
   * @override
   */
  prepareDerivedData() {
    this._prepareResources();
  }

  _prepareResources() {
    this.resources.hp.defineMaximumProperty(() => Formulas.calculateHitPoints(this));
  }

  /**
   * Adds a trackable resource.
   * @param {String} key
   * @param {String} slug
   */
  addTracker(key, slug) {
    this.trackers ??= {};
    this.trackers[key] ??= {};

    /** @type AHActor **/
    const actor = this.parent;

    Object.defineProperty(this.trackers[key], "value", {
      configurable: true,
      enumerable: true,
      get() {
        const lookup = actor?.resolveTracker(slug);
        if (!lookup) return 0;
        return lookup.tracker.current;
      },
    });

    Object.defineProperty(this.trackers[key], "max", {
      configurable: true,
      enumerable: true,
      get() {
        const lookup = actor?.resolveTracker(slug);
        if (!lookup) return 0;
        return lookup.tracker.max;
      },
    });
  }
}

/**
 * Models characters and interactive objects in the world.
 * @property {Number} level
 * @property {String} description
 * @property {EntityResourcesDataModel} resources
 */
export class EntityDataModel extends BaseEntityDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField, HTMLField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      description: new HTMLField({
        label: "AH.FIELD.Description",
      }),
    });
  }
}
