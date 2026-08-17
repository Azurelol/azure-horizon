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
 * Models characters and interactive objects in the world.
 * @property {Number} level
 * @property {EntityResourcesDataModel} resources
 */
export default class EntityDataModel extends ActorDataModel {
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
}
