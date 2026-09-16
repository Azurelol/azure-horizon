import { systemAssetPath } from "../constants.mjs";

function vfx(name, extension = "png") {
  return systemAssetPath(`/vfx/${name}.${extension}`);
}

function sfx(name) {
  return systemAssetPath(`/sfx/${name}.ogg`);
}

const entries = {
  vfx: {
    impact: [
      {
        file: vfx("impact_2", "json"),
      },
    ],
    piercing: [
      {
        file: vfx("piercing_1", "json"),
      },
    ],
    slashing: [
      {
        file: vfx("slash_1", "json"),
      },
    ],
    bludgeoning: [
      {
        file: vfx("bludgeoning_1", "json"),
      },
    ],
  },
  sfx: {
    attack: {
      sword: [
        sfx("sword_1"),
        sfx("sword_2"),
        sfx("sword_3"),
      ],
    },
  },
};

export const Database = Object.freeze({
  entries,
});
