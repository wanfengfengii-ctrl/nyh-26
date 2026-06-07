<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
    <div class="app">
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">🖨️ 活字字盘布局模拟器</h1>
          <p class="app-subtitle">Movable Type Compositor - 多副本库存拣字路径规划系统</p>
        </div>
        <div class="header-actions">
          <n-button size="small" :disabled="!canUndo" @click="handleUndo">
            ↶ 撤销
          </n-button>
          <n-button size="small" :disabled="!canRedo" @click="handleRedo">
            ↷ 重做
          </n-button>
        </div>
      </header>

      <main class="app-main">
        <aside class="sidebar left-sidebar">
          <ControlPanel />
        </aside>

        <section class="main-content">
          <div class="tray-wrapper">
            <TypeTray :editable="true" />
          </div>
          <div class="legend">
            <n-space :size="16" wrap>
              <div class="legend-item">
                <span class="legend-dot path-dot"></span>
                <span>拣字路径</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot heat-dot"></span>
                <span>热力分布</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot multi-dot"></span>
                <span>多副本库存</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot completed-dot"></span>
                <span>已拣字</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot current-dot"></span>
                <span>当前拣字点</span>
              </div>
            </n-space>
          </div>
        </section>

        <aside class="sidebar right-sidebar">
          <n-tabs type="line" animated>
            <n-tab-pane name="chars" tab="字库管理">
              <CharManager />
            </n-tab-pane>
            <n-tab-pane name="tasks" tab="拣字任务">
              <PickTaskPanel />
            </n-tab-pane>
            <n-tab-pane name="schemes" tab="方案版本">
              <SchemeManager />
            </n-tab-pane>
          </n-tabs>
        </aside>
      </main>

      <footer class="app-footer">
        <span>拖拽活字可调整位置 | 同一字符支持多副本库存 | 支持路径优化与任务单生成</span>
      </footer>
    </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme, lightTheme, NConfigProvider, NSpace, NTabs, NTabPane, NButton, NMessageProvider } from 'naive-ui'
import { useCompositorStore } from '@/stores/compositor'
import { storeToRefs } from 'pinia'
import TypeTray from '@/components/TypeTray.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import CharManager from '@/components/CharManager.vue'
import SchemeManager from '@/components/SchemeManager.vue'
import PickTaskPanel from '@/components/PickTaskPanel.vue'

const store = useCompositorStore()
const { canUndo, canRedo } = storeToRefs(store)
const { undo, redo } = store

const theme = computed(() => lightTheme)

function handleUndo() {
  undo()
}

function handleRedo() {
  redo()
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.app-header {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: #fff;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  max-width: 1600px;
}

.app-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

.app-subtitle {
  font-size: 13px;
  opacity: 0.7;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.app-main {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  min-height: 0;
}

.sidebar {
  flex-shrink: 0;
  overflow-y: auto;
}

.left-sidebar {
  width: 340px;
}

.right-sidebar {
  width: 340px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tray-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
  min-height: 0;
}

.legend {
  flex-shrink: 0;
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.path-dot {
  background: #18a058;
}

.heat-dot {
  background: linear-gradient(135deg, #fff 0%, #18a058 100%);
}

.multi-dot {
  background: #18a058;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #18a058;
}

.completed-dot {
  background: #52c41a;
}

.current-dot {
  background: #1890ff;
}

.app-footer {
  flex-shrink: 0;
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 12px;
  background: #fff;
  border-top: 1px solid #eee;
}
</style>
