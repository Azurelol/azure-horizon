import BaseItemDataModel from "./base-item-data-model.mjs";
import { CheckFieldsetMixin } from "./check-behaviour-mixin.mjs";

export default class WeaponDataModel extends CheckFieldsetMixin(BaseItemDataModel) {}
