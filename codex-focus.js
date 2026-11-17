'use strict';

async function navigateRightToCodex(api, viewId) {
  const group = api.activeGroup();
  // Group navigation must not wrap or open any hidden workbench part.
  await api.run('workbench.action.focusRightGroupWithoutWrap');
  if (api.activeGroup() !== group) return;
  await api.run(viewId + '.focus');
}

module.exports = { navigateRightToCodex };
