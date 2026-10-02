import { DataModelRegistry } from "../api/_module.mjs";
import * as Tactica from "./tactica/_module.mjs";
import { systemID } from "../../constants.mjs";
import TacticaTypeDataModel from "./tactica-type-data-model.mjs";

/**
 * @description Registry of all {@linkcode TacticaTypeDataModel}
 */
export class TacticaDataRegistry extends DataModelRegistry {
  constructor() {
    super({
      kind: "Tactica Data",
      baseClass: TacticaTypeDataModel,
    });

    for (const model of Object.values(Tactica)) {
      this.register(systemID, model.TYPE, model);
    }
  }

  static instance = new TacticaDataRegistry();
}
