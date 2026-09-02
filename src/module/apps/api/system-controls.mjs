import AH from "../../config.mjs";
import { StringUtils } from "../../utils/_module.mjs";

/**
 * @typedef SystemControlTool
 * @property {string} name
 * @property {string} icon
 * @property {boolean} [visible]
 * @property {boolean} [toggle]
 * @property {boolean} [active]
 * @property {(event: Event, active: boolean) => void} [onClick]
 */

let initialized;

function initialize() {
  if (!initialized) {
    Hooks.on("renderPlayers", (app, html) => {
      const containerElement = document.createElement("div");
      containerElement.classList.add("ah-system-controls");

      /** @type {SystemControlTool[]} */
      const systemTools = [];
      Hooks.callAll(AH.hooks.REGISTER_SYSTEM_TOOLS, systemTools);

      const menuItems = systemTools
        .filter((tool) => tool.visible !== false)
        .map((tool) => {
          const toolButton = document.createElement("button");
          toolButton.type = "button";
          toolButton.classList.add("control", "ui-control");
          toolButton.innerHTML = `<i class="${tool.icon}"></i>`;
          toolButton.dataset.tooltip = game.i18n.localize(tool.name);
          toolButton.dataset.tooltipDirection = game.tooltip.constructor.TOOLTIP_DIRECTIONS.UP;

          if (tool.toggle) {
            let active = tool.active;
            toolButton.classList.add("toggle");
            toolButton.ariaPressed = active;
            toolButton.addEventListener("click", (e) => {
              active = !active;
              toolButton.ariaPressed = active;
              if (tool.onClick) {
                tool.onClick(e, active);
              }
            });
          } else {
            if (tool.onClick) {
              toolButton.addEventListener("click", (e) => {
                tool.onClick(e, false);
              });
            }
          }
          return toolButton;
        });

      containerElement.append(...menuItems);
      html.prepend(containerElement);
    });

    Hooks.on("renderSettings", (app, html, context) => {

      const settings = html.querySelector("section .settings");
      if (settings) {
        let buttons = [];
        Hooks.callAll(AH.hooks.REGISTER_SYSTEM_SETTINGS_BUTTON, buttons);
        for (const button of buttons) {
          settings.appendChild(button);
        }
      }
    });

    Hooks.on("renderActors", (app, html, context) => {

      ui.notifications.info("boop");
      const searchBar = html.querySelector("section header search");
      if (searchBar) {
        let buttons = [];
        Hooks.callAll(AH.hooks.REGISTER_SYSTEM_SETTINGS_BUTTON, buttons);
        const span = document.createElement("span");
        span.textContent = "BOF";
        searchBar.appendChild(span);
        for (const button of buttons) {
          searchBar.appendChild(button);
        }
      }
    });

  }
}

const SystemControls = Object.freeze({
  initialize,
});

export default SystemControls;
