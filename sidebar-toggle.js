'use strict';
async function toggleSidebar(visible, commands) {
  if (visible) {
    await commands('workbench.action.closeSidebar');
    await commands('workbench.action.focusActiveEditorGroup');
  } else {
    await commands('workbench.view.explorer');
    await commands('workbench.files.action.focusFilesExplorer');
  }
}
module.exports = { toggleSidebar };
