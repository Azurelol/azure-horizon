import { DataModelRegistry } from "../api/_module.mjs";
import * as ClassFeatures from "./classFeatures/_module.mjs";
import { systemID } from "../../constants.mjs";
import ClassFeatureTypeDataModel from "./class-feature-type-data-model.mjs";

/**
 * @description Registry of all {@linkcode ClassFeatureTypeDataModel}
 */
export class ClassFeatureRegistry extends DataModelRegistry {
  constructor() {
    super({
      kind: "Class Feature",
      baseClass: ClassFeatureTypeDataModel,
    });

    for (const feature of Object.values(ClassFeatures)) {
      this.register(systemID, feature.TYPE, feature);
    }
  }

  static instance = new ClassFeatureRegistry();
}
