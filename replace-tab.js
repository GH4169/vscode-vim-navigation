'use strict';
async function replaceCurrentTab(api) {
  const group = api.activeGroup(),
    old = group.activeTab;
  if (old?.isDirty)
    throw new Error('当前标签有未保存修改；请先保存或用 t 打开文件。');
  const index = group.tabs.indexOf(old),
    pinned = old?.isPinned;
  await api.openSelected();
  const current = api.activeGroup().activeTab;
  if (!old || current === old) return;
  if (api.activeGroup() !== group)
    throw new Error('文件打开到了另一组；已保留原标签。');
  if (old.isDirty)
    throw new Error('原标签在打开文件期间被修改；已保留两个标签。');
  if (!(await api.close(old))) return;
  await api.move(index + 1);
  if (pinned) await api.pin();
}
module.exports = { replaceCurrentTab };
