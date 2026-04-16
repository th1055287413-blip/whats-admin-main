<template>
  <div class="user-messages">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <div class="user-info-header">
            <el-avatar :src="userInfo.avatar" :size="60">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <div class="user-details">
              <h2>{{ userInfo.push_name || userInfo.phone_number }}</h2>
              <p class="phone-number">{{ userInfo.phone_number }}</p>
              <el-tag :type="userInfo.is_online ? 'success' : 'info'" size="small">
                <el-icon><Connection /></el-icon>
                {{ userInfo.is_online ? '在线' : '离线' }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="header-right">
          <el-button @click="$router.back()" :icon="ArrowLeft"> 返回用户列表 </el-button>
          <el-button type="warning" @click="handleShowReferralLink" :icon="Share">
            分享鏈接
          </el-button>
          <el-button type="success" @click="handleNewConversation" :icon="ChatLineRound">
            發起新對話
          </el-button>
          <el-button type="primary" @click="handleRefresh" :icon="Refresh" :loading="loading">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- WebSocket 连接状态指示器 -->
    <!-- <div class="ws-status-indicator" :class="{ connected: wsConnected }">
      <el-icon v-if="wsConnected"><CircleCheckFilled /></el-icon>
      <el-icon v-else><CircleCloseFilled /></el-icon>
      <span>{{ wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接' }}</span>
    </div> -->

    <!-- 翻译设置面板 -->
    <el-card class="translation-settings-card" shadow="hover">
      <div class="translation-settings">
        <div class="settings-title">
          <el-icon><Setting /></el-icon>
          <span>翻译设置</span>
        </div>
        <div class="settings-controls">
          <div class="control-item">
            <span>自动翻译好友消息</span>
            <el-switch
              v-model="translationConfig.auto_translate_received"
              @change="handleSaveTranslationConfig"
            />
          </div>
          <div class="control-item">
            <span>自动翻译发送消息</span>
            <el-switch
              v-model="translationConfig.auto_translate_sent"
              @change="handleSaveTranslationConfig"
            />
          </div>
          <div class="control-item">
            <span>来源语言</span>
            <el-select
              v-model="selectedSourceLanguageId"
              placeholder="自动检测"
              size="small"
              style="width: 180px"
              clearable
            >
              <el-option
                v-for="lang in languageConfigs"
                :key="lang.id"
                :label="`${lang.language_name} (${lang.country_name})`"
                :value="lang.id"
              />
            </el-select>
          </div>
          <div class="control-item">
            <span>目标语言</span>
            <el-select
              v-model="selectedLanguageId"
              placeholder="选择目标语言"
              size="small"
              style="width: 180px"
              @change="handleLanguageChange"
            >
              <el-option
                v-for="lang in languageConfigs"
                :key="lang.id"
                :label="`${lang.language_name} (${lang.country_name})`"
                :value="lang.id"
              />
            </el-select>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 主要内容区域 -->
    <el-row :gutter="10" class="main-content">
      <!-- 对话列表 -->
      <el-col :span="8">
        <el-card class="conversations-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><ChatLineRound /></el-icon>
                <span>对话列表</span>
                <el-tag type="info" size="small">{{ chatsTotal }}</el-tag>
              </div>
              <el-input
                v-model="conversationSearchKeyword"
                placeholder="搜索联系人..."
                size="small"
                style="width: 200px"
                @input="handleConversationSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>

          <div class="conversations-content">
            <div v-if="conversations.length === 0" class="empty-conversations">
              <el-empty description="暂无对话记录" />
            </div>
            <div
              v-for="conversation in filteredConversations"
              :key="conversation.contact_phone"
              class="conversation-item"
              :class="{
                active: selectedConversation?.contact_phone === conversation.contact_phone,
                'just-updated': recentlyUpdated[conversation.contact_phone],
                'has-unread': conversation.unread_count > 0,
                archived: conversation.archived
              }"
              @click="handleSelectConversation(conversation)"
            >
              <el-avatar :src="conversation.avatar" :size="40">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="conversation-info">
                <div class="conversation-header">
                  <span class="contact-name">{{
                    conversation.contact_name || conversation.contact_phone
                  }}</span>
                  <el-tag
                    v-if="conversation.is_group"
                    type="info"
                    size="small"
                    effect="plain"
                    style="margin-left: 4px"
                  >群組</el-tag>
                  <span class="last-time">{{ formatTime(conversation.last_message_time) }}</span>
                </div>
                <div class="last-message">
                  <span class="message-preview">{{ conversation.last_message || '暂无消息' }}</span>
                  <div class="message-badges">
                    <el-badge
                      v-if="conversation.unread_count > 0"
                      :value="conversation.unread_count"
                      type="danger"
                      class="unread-badge"
                    />
                    <el-tag
                      v-if="conversation.has_sensitive"
                      type="danger"
                      size="small"
                      effect="plain"
                    >
                      敏感
                    </el-tag>
                    <el-tag
                      v-for="tag in conversation.tags"
                      :key="tag"
                      :type="tag === '醒鱼' ? 'danger' : 'warning'"
                      :effect="tag === '醒鱼' ? 'dark' : 'plain'"
                      size="small"
                      class="chat-tag"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <div class="conversation-actions">
                <el-tooltip
                  :content="conversation.archived ? '取消归档' : '归档会话'"
                  placement="left"
                >
                  <el-button
                    style="margin-top: 10px; font-size: 20px"
                    :type="conversation.archived ? 'success' : 'info'"
                    link
                    size="large"
                    :icon="conversation.archived ? FolderOpened : FolderAdd"
                    :loading="archivingChats[conversation.contact_phone]"
                    @click.stop="handleToggleArchive(conversation)"
                  />
                </el-tooltip>
              </div>
            </div>

            <!-- 加载更多 / 分页控制 -->
            <div v-if="chatsTotalPages > 1" class="chats-pagination">
              <el-button
                v-if="chatsPage < chatsTotalPages"
                type="primary"
                link
                :loading="loading"
                @click="handleChatsPageChange(chatsPage + 1)"
              >
                加载更多 ({{ chatsPage }}/{{ chatsTotalPages }})
              </el-button>
              <span v-else class="no-more-text">已加载全部</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 消息历史记录 -->
      <el-col :span="16">
        <el-card class="messages-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><ChatDotRound /></el-icon>
                <span v-if="selectedConversation">
                  与
                  {{ selectedConversation.contact_name || selectedConversation.contact_phone }}
                  的聊天记录
                </span>
                <span v-else>选择对话查看消息记录</span>
                <!-- 快速标记按钮 -->
                <el-button
                  v-if="selectedConversation && !selectedConversation.tags?.includes('醒鱼')"
                  type="danger"
                  size="small"
                  :loading="addingWakeTag"
                  @click="handleWakeUpFish"
                  style="margin-left: 10px"
                >
                  <el-icon><PriceTag /></el-icon>
                  标记醒鱼
                </el-button>
                <!-- 标签显示区域 -->
                <div class="header-tags" v-if="selectedConversation?.tags?.length">
                  <el-tag
                    v-for="tag in selectedConversation.tags"
                    :key="tag"
                    :type="tag === '醒鱼' ? 'danger' : 'info'"
                    :effect="tag === '醒鱼' ? 'dark' : 'plain'"
                    size="small"
                    :closable="tag !== '醒鱼'"
                    @close="handleRemoveTag(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              <div class="message-actions" v-if="selectedConversation">
                <el-input
                  v-model="messageSearchKeyword"
                  placeholder="搜索消息内容..."
                  size="small"
                  style="width: 200px"
                  @input="handleMessageSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button size="small" @click="handleExportMessages" :icon="Download">
                  导出
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  :loading="addingWakeTag"
                  @click="handleWakeUpFish"
                >
                  醒鱼
                </el-button>
              </div>
            </div>
          </template>

          <div class="messages-content">
            <!-- 未选择对话时的提示 -->
            <div v-if="!selectedConversation" class="no-conversation-selected">
              <el-empty description="请在左侧选择一个对话查看消息记录" />
            </div>

            <!-- AI 摘要（浮動在訊息列表上方） -->
            <div v-if="selectedConversation?.ai_summary" class="ai-summary-bar">
              <el-icon><MagicStick /></el-icon>
              <span>{{ selectedConversation.ai_summary }}</span>
            </div>

            <!-- 消息列表 -->
            <div v-if="selectedConversation" class="messages-list" ref="messagesContainer">
              <!-- 加载更多历史消息按钮（在顶部） -->
              <div v-if="hasMoreMessages" class="load-more">
                <el-button @click="handleLoadMoreMessages" :loading="loadingMore">
                  加载更多历史消息
                </el-button>
              </div>
              <div v-if="messages.length === 0" class="empty-messages">
                <el-empty description="暂无消息记录" />
              </div>
              <div
                v-for="message in filteredMessages"
                :key="message.id"
                class="message-item"
                :class="{
                  sent: isMessageSent(message),
                  received: !isMessageSent(message),
                  revoked: message.is_revoked,
                  deleted: message.deleted_at,
                  edited: message.is_edited && !message.is_revoked && !message.deleted_at
                }"
              >
                <div class="message-avatar" v-if="!message.is_from_me">
                  <el-avatar :size="32" :src="message.sender?.avatar">
                    <template v-if="!message.sender?.avatar">
                      {{ (getSenderName(message) || 'U').charAt(0).toUpperCase() }}
                    </template>
                  </el-avatar>
                </div>
                <div class="message-content">
                  <!-- 懸浮操作按鈕（絕對定位在右上角） -->
                  <div class="message-actions" v-if="!message.is_revoked && !message.deleted_at && canDeleteMessage">
                    <el-tooltip content="仅删除我方（对方仍可见）">
                      <el-button
                        type="warning"
                        link
                        size="small"
                        :icon="Hide"
                        @click.stop="handleDeleteMessageForMe(message)"
                      />
                    </el-tooltip>
                    <el-tooltip content="删除消息（双方不可见）">
                      <el-button
                        type="danger"
                        link
                        size="small"
                        :icon="Delete"
                        @click.stop="handleDeleteMessage(message)"
                      />
                    </el-tooltip>
                  </div>
                  <div class="message-header">
                    <span class="sender-name">
                      {{ getSenderName(message) }}
                    </span>
                    <span class="message-time">{{ formatDateTime(message.timestamp) }}</span>
                    <!-- 已刪除/已撤回標籤 -->
                    <span v-if="message.deleted_by" class="deleted-label">已刪除({{ message.deleted_by }})</span>
                    <span v-else-if="message.is_revoked" class="revoked-label">已撤回</span>
                    <!-- 已編輯標籤 -->
                    <span v-else-if="message.is_edited" class="edited-label">已編輯</span>
                    <!-- 發送狀態圖標（移到時間戳旁邊） -->
                    <el-icon v-if="message.is_from_me && !message.is_revoked && !message.deleted_at" class="status-icon" :class="message.send_status">
                      <component :is="getStatusIcon(message.send_status)" />
                    </el-icon>
                  </div>
                  <div class="message-body">
                    <!-- 文本消息 -->
                    <div class="message-text" v-if="message.type === 'text'">
                      {{ message.content }}
                      <!-- 好友消息：显示中文译文 -->
                      <div
                        v-if="
                          !message.is_from_me &&
                          translationConfig.auto_translate_received &&
                          message.translated_text
                        "
                        class="translated-text"
                      >
                        <el-divider style="margin: 8px 0" />
                        <div class="translation-header">
                          <el-icon size="12"><Connection /></el-icon>
                          <span>译文 (中文)</span>
                        </div>
                        <div class="translation-content">
                          {{ message.translated_text }}
                        </div>
                      </div>
                      <!-- 我方消息：显示中文原文（如果有 translated_text 就使用它，否则使用 original_text） -->
                      <div
                        v-if="
                          message.is_from_me &&
                          translationConfig.auto_translate_sent &&
                          (message.translated_text || message.original_text)
                        "
                        class="translated-text"
                      >
                        <el-divider style="margin: 8px 0" />
                        <div class="translation-header">
                          <el-icon size="12"><Connection /></el-icon>
                          <span>原文 (中文)</span>
                        </div>
                        <div class="translation-content">
                          {{ message.translated_text || message.original_text }}
                        </div>
                      </div>
                      <!-- 翻译加载中 -->
                      <div
                        v-if="
                          !message.is_from_me &&
                          translationConfig.auto_translate_received &&
                          message.translating
                        "
                        class="translating"
                      >
                        <el-icon class="is-loading"><Loading /></el-icon>
                        <span>翻译中...</span>
                      </div>
                    </div>
                    <!-- 非文本消息 -->
                    <div class="message-media" v-else>
                      <div class="media-container">
                        <div class="media-icon">
                          <el-icon
                            :size="24"
                            :color="
                              getMessageTypeColor(message.type) === 'success'
                                ? '#67c23a'
                                : getMessageTypeColor(message.type) === 'primary'
                                ? '#409eff'
                                : getMessageTypeColor(message.type) === 'warning'
                                ? '#e6a23c'
                                : getMessageTypeColor(message.type) === 'danger'
                                ? '#f56c6c'
                                : '#909399'
                            "
                          >
                            <component :is="getMessageTypeIcon(message.type)" />
                          </el-icon>
                        </div>
                        <div class="media-content">
                          <div class="media-type">
                            <el-tag
                              :type="getMessageTypeColor(message.type)"
                              size="small"
                              effect="plain"
                            >
                              {{ getMessageTypeText(message.type) }}
                            </el-tag>
                          </div>
                          <div class="media-description">
                            <span v-if="message.content && message.content !== '暂无消息'">
                              {{ message.content }}
                            </span>
                            <span v-else class="no-content">
                              {{ getMessageTypeText(message.type) }}消息
                            </span>
                          </div>
                          <!-- 语音消息特殊处理 -->
                          <div
                            v-if="message.type === 'voice' || message.type === 'audio'"
                            class="voice-controls"
                          >
                            <audio
                              v-if="message.media_url"
                              :src="getMediaUrl(message.media_url)"
                              controls
                              controlsList="nodownload"
                              style="max-width: 300px; height: 40px"
                            >
                              您的浏览器不支持音频播放
                            </audio>
                            <div v-else class="no-media">
                              <el-icon><Microphone /></el-icon>
                              <span>语音文件不可用</span>
                            </div>
                          </div>
                          <!-- 图片/视频消息特殊处理 -->
                          <div
                            v-else-if="['image', 'video'].includes(message.type)"
                            class="media-preview"
                          >
                            <!-- 图片预览 -->
                            <div v-if="message.type === 'image'" class="image-preview">
                              <!-- 有媒体URL时显示图片 -->
                              <el-image
                                v-if="message.media_url"
                                :src="getMediaUrl(message.media_url)"
                                :preview-src-list="[getMediaUrl(message.media_url)]"
                                fit="cover"
                                style="max-width: 300px; max-height: 300px; border-radius: 8px"
                                lazy
                                :z-index="3000"
                                :preview-teleported="true"
                                :hide-on-click-modal="true"
                              >
                                <template #error>
                                  <div class="image-slot">
                                    <el-icon><Picture /></el-icon>
                                    <span>图片加载失败</span>
                                  </div>
                                </template>
                              </el-image>
                              <!-- 没有媒体URL时显示占位符 -->
                              <div v-else class="preview-placeholder media-expired">
                                <el-icon :size="40"><Picture /></el-icon>
                                <span>历史图片已过期</span>
                                <span class="expired-hint">WhatsApp 历史媒体文件链接已失效</span>
                              </div>
                            </div>
                            <!-- 视频预览 -->
                            <div v-else-if="message.type === 'video'" class="video-preview">
                              <!-- 有媒体URL时显示视频 -->
                              <video
                                v-if="message.media_url"
                                :src="getMediaUrl(message.media_url)"
                                controls
                                style="max-width: 400px; max-height: 300px; border-radius: 8px"
                                controlsList="nodownload"
                              >
                                您的浏览器不支持视频播放
                              </video>
                              <!-- 没有媒体URL时显示占位符 -->
                              <div v-else class="preview-placeholder media-expired">
                                <el-icon :size="40"><VideoCamera /></el-icon>
                                <span>历史视频已过期</span>
                                <span class="expired-hint">WhatsApp 历史媒体文件链接已失效</span>
                              </div>
                            </div>
                            <!-- 没有media_url时的占位符 -->
                            <div v-else class="preview-placeholder">
                              <el-icon :size="40">
                                <component :is="getMessageTypeIcon(message.type)" />
                              </el-icon>
                              <span>媒体文件不可用</span>
                            </div>
                          </div>
                          <!-- 文件/文档消息特殊处理 -->
                          <div
                            v-else-if="['document', 'file'].includes(message.type)"
                            class="file-controls"
                          >
                            <el-button
                              v-if="message.media_url"
                              size="small"
                              type="info"
                              plain
                              :icon="Download"
                              @click="handleDownloadFile(message)"
                            >
                              下载文件
                            </el-button>
                            <div v-else class="no-media">
                              <el-icon><Document /></el-icon>
                              <span>文件不可用</span>
                            </div>
                          </div>
                          <!-- 位置消息特殊处理 -->
                          <div v-else-if="message.type === 'location'" class="location-controls">
                            <div class="location-info">
                              <div class="location-name">{{ getLocationName(message) }}</div>
                              <div class="location-coords">{{ getLocationCoords(message) }}</div>
                              <div class="location-map" v-if="getLocationMapUrl(message)">
                                <iframe
                                  :src="getLocationMapUrl(message)"
                                  width="300"
                                  height="200"
                                  frameborder="0"
                                  scrolling="no"
                                  style="border-radius: 8px"
                                ></iframe>
                              </div>
                              <el-button
                                size="small"
                                type="danger"
                                plain
                                :icon="Location"
                                @click="openLocationInMap(message)"
                              >
                                在地图中打开
                              </el-button>
                            </div>
                          </div>
                          <!-- 贴纸消息特殊处理 -->
                          <div v-else-if="message.type === 'sticker'" class="sticker-preview">
                            <el-image
                              v-if="message.media_url"
                              :src="getMediaUrl(message.media_url)"
                              fit="contain"
                              style="max-width: 200px; max-height: 200px"
                            >
                              <template #error>
                                <div class="image-slot">
                                  <el-icon><Sunny /></el-icon>
                                  <span>贴纸加载失败</span>
                                </div>
                              </template>
                            </el-image>
                            <div v-else class="preview-placeholder">
                              <el-icon :size="40"><Sunny /></el-icon>
                              <span>贴纸不可用</span>
                            </div>
                          </div>
                          <!-- 联系人消息特殊处理 -->
                          <div v-else-if="message.type === 'contact'" class="contact-card">
                            <div class="contact-header">
                              <el-avatar :size="50" :icon="User" />
                              <div class="contact-name">{{ getContactName(message) }}</div>
                            </div>
                            <div class="contact-phones" v-if="getContactPhones(message).length > 0">
                              <div
                                v-for="(phone, index) in getContactPhones(message)"
                                :key="index"
                                class="phone-item"
                              >
                                <el-icon><Phone /></el-icon>
                                <span>{{ phone }}</span>
                              </div>
                            </div>
                            <div v-else class="no-phones">
                              <span>无电话号码</span>
                            </div>
                          </div>
                          <!-- 语音笔记特殊处理 -->
                          <div
                            v-else-if="message.type === 'voice_note'"
                            class="voice-note-controls"
                          >
                            <div class="voice-note-header">
                              <el-icon :size="20"><Microphone /></el-icon>
                              <span class="voice-duration">{{ getVoiceDuration(message) }}</span>
                            </div>
                            <audio
                              v-if="message.media_url"
                              :src="getMediaUrl(message.media_url)"
                              controls
                              controlsList="nodownload"
                              style="max-width: 300px; height: 40px"
                            >
                              您的浏览器不支持音频播放
                            </audio>
                            <div v-else class="no-media">
                              <el-icon><Microphone /></el-icon>
                              <span>语音文件不可用</span>
                            </div>
                          </div>
                          <!-- 回应消息特殊处理 -->
                          <div v-else-if="message.type === 'reaction'" class="reaction-display">
                            <div class="reaction-emoji">{{ getReactionEmoji(message) }}</div>
                            <div class="reaction-text">回应了一条消息</div>
                          </div>
                          <!-- 实时位置消息特殊处理 -->
                          <div
                            v-else-if="message.type === 'live_location'"
                            class="live-location-controls"
                          >
                            <div class="live-location-info">
                              <div class="live-location-header">
                                <el-icon :size="20"><MapLocation /></el-icon>
                                <span>实时位置分享</span>
                              </div>
                              <div class="location-coords">{{ getLocationCoords(message) }}</div>
                              <div class="location-map" v-if="getLocationMapUrl(message)">
                                <iframe
                                  :src="getLocationMapUrl(message)"
                                  width="300"
                                  height="200"
                                  frameborder="0"
                                  scrolling="no"
                                  style="border-radius: 8px"
                                ></iframe>
                              </div>
                              <el-button
                                size="small"
                                type="danger"
                                plain
                                :icon="MapLocation"
                                @click="openLocationInMap(message)"
                              >
                                在地图中打开
                              </el-button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 消息输入区域 -->
            <div v-if="selectedConversation" class="message-input-area">
              <!-- 图片预览区 -->
              <div v-if="selectedImage" class="image-preview-container">
                <div class="preview-image-wrapper">
                  <img :src="imagePreviewUrl" alt="预览图片" class="preview-image" />
                  <el-button
                    circle
                    size="small"
                    type="danger"
                    class="remove-image-btn"
                    @click="removeSelectedImage"
                  >
                    ×
                  </el-button>
                </div>
              </div>

              <div class="input-container">
                <el-input
                  ref="messageInputRef"
                  v-model="newMessage"
                  type="textarea"
                  :rows="2"
                  placeholder="输入消息内容... (Ctrl+V 粘贴图片)"
                  class="message-input"
                  @keydown.enter.ctrl="handleSendMessage"
                  @keydown.enter.exact.prevent="handleSendMessage"
                  @paste="handlePaste"
                  resize="none"
                />
                <div class="input-actions">
                  <input
                    ref="fileInputRef"
                    type="file"
                    :accept="currentFileAccept"
                    style="display: none"
                    @change="handleFileSelect"
                  />
                  <el-dropdown @command="handleAttachmentCommand" trigger="click">
                    <el-button :icon="Paperclip" title="发送附件"> 附件 </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="image">
                          <el-icon><Picture /></el-icon> 图片
                        </el-dropdown-item>
                        <el-dropdown-item command="video">
                          <el-icon><VideoCamera /></el-icon> 视频
                        </el-dropdown-item>
                        <el-dropdown-item command="audio">
                          <el-icon><Microphone /></el-icon> 音频
                        </el-dropdown-item>
                        <el-dropdown-item command="document">
                          <el-icon><Document /></el-icon> 文档
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-button
                    type="primary"
                    @click="handleSendMessage"
                    :loading="sendingMessage"
                    :disabled="!canSendMessage"
                    :icon="Position"
                  >
                    发送
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新對話彈窗 -->
    <NewConversationDialog ref="newConversationDialogRef" @success="handleNewConversationSuccess" />

    <!-- Referral Link Dialog -->
    <el-dialog v-model="showReferralDialog" title="分享推薦鏈接" width="600px">
      <div v-loading="referralLoading" class="referral-dialog-content">
        <el-alert
          v-if="referralError"
          :title="referralError"
          type="error"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <template v-if="referralProfile">
          <el-form label-width="100px">
            <el-form-item label="推薦碼">
              <el-tag size="large" type="success">{{ referralProfile.referral_code }}</el-tag>
            </el-form-item>

            <el-form-item label="推廣語言">
              <el-select v-model="selectedReferralLanguage" style="width: 100%">
                <el-option
                  v-for="option in referralLanguageOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="來源標籤">
              <el-select v-model="selectedSourceTag" clearable placeholder="選擇來源標籤（可選）" style="width: 100%">
                <el-option
                  v-for="tag in availableTags"
                  :key="tag.id"
                  :label="`${tag.name} (${tag.source_key})`"
                  :value="tag.id"
                >
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div
                      style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ddd;"
                      :style="{ backgroundColor: tag.color }"
                    />
                    <span>{{ tag.name }}</span>
                    <el-tag size="small" type="info">{{ tag.source_key }}</el-tag>
                  </div>
                </el-option>
              </el-select>
              <div style="color: #909399; font-size: 12px; margin-top: 4px;">
                用戶訪問時將自動獲得該標籤
              </div>
            </el-form-item>

            <el-form-item label="推廣渠道">
              <el-select v-model="selectedChannel" clearable placeholder="選擇渠道（可選）" style="width: 100%">
                <el-option
                  v-for="channel in availableChannels"
                  :key="channel.channel_code"
                  :label="`${channel.channel_name} (${channel.channel_code})`"
                  :value="channel.channel_code"
                />
              </el-select>
              <div style="color: #909399; font-size: 12px; margin-top: 4px;">
                用於追蹤渠道來源
              </div>
            </el-form-item>

            <el-form-item label="分享鏈接">
              <el-input
                :model-value="finalReferralShareUrl"
                readonly
                :suffix-icon="CopyDocument"
              >
                <template #append>
                  <el-button @click="handleCopyLink">複製</el-button>
                </template>
              </el-input>
            </el-form-item>

          </el-form>
        </template>

        <template v-else-if="!referralLoading && !referralError">
          <el-empty description="尚未生成推薦碼">
            <el-button type="primary" @click="handleGenerateReferralCode">生成推薦碼</el-button>
          </el-empty>
        </template>
      </div>

      <template #footer>
        <el-button @click="showReferralDialog = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'
import {
  UserFilled,
  User,
  Connection,
  ArrowLeft,
  Refresh,
  ChatLineRound,
  ChatDotRound,
  Search,
  Download,
  Picture,
  VideoCamera,
  Document,
  Location,
  Folder,
  Microphone,
  Position,
  Setting,
  Loading,
  CircleCheckFilled,
  CircleCloseFilled,
  Delete,
  EditPen,
  FolderAdd,
  FolderOpened,
  Sunny,
  Star,
  MapLocation,
  Phone,
  Paperclip,
  MagicStick,
  PriceTag,
  Hide,
  Share,
  CopyDocument
} from '@element-plus/icons-vue'
import {
  getLanguageConfigs,
  getTranslationConfig,
  updateTranslationConfig,
  translateText,
  type LanguageConfig,
  type TranslationConfig
} from '@/api/translation'
import { referralApi } from '@/api/referral'
import { promotionDomainApi } from '@/api/promotion-domain'
import type { ReferralProfile } from '@/types/referral'
import { sseClient } from '@/utils/sse'
import type { NewMessageData, MessageStatusData, MessageRevokedData, MessageEditedData, ChatArchiveChangedData } from '@/types/websocket'
import { useConversationState } from '@/composables/useConversationState'
import { deleteMessage, deleteMessageForMe } from '@/api/message-search'
import { createChatTag, deleteChatTag, getChatTags } from '@/api/chat-tag'
import { useAuthStore } from '@/stores/auth'
import { archiveChat, unarchiveChat } from '@/api/chat'
import NewConversationDialog from '@/components/admin/NewConversationDialog.vue'

// 消息类型定义
interface Message {
  id: string | number
  message_id?: string // WhatsApp 消息 ID（用于匹配撤回/编辑事件）
  content: string
  type: string
  is_from_me: boolean
  timestamp: string
  send_status: string
  media_url?: string // 媒体文件URL
  message_metadata?: string // 消息元数据（JSON字符串）
  is_revoked?: boolean // 是否已撤销
  revoked_at?: string // 撤销时间
  is_edited?: boolean // 是否已编辑
  edited_at?: string // 编辑时间
  deleted_at?: string // 删除时间
  deleted_by?: string // 删除操作者
  sender?: {
    name?: string
    phone?: string
    avatar?: string
  }
  translated_text?: string // 好友消息的中文译文
  translating?: boolean
  original_text?: string // 我方消息的中文原文
}

// 会话类型定义
interface Conversation {
  id?: number // 会话ID (用于API调用)
  jid?: string // 原始 JID (用于标签和 SSE 匹配)
  contact_phone: string
  contact_name: string
  avatar: string
  last_message: string
  last_message_time: string
  message_count: number
  unread_count: number
  has_sensitive: boolean
  archived?: boolean // 归档状态
  tags?: string[] // 聊天標籤
  ai_summary?: string | null // AI 摘要
  is_group?: boolean
}

// 路由参数
const route = useRoute()
const userId = route.params.userId as string
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const userInfo = ref<any>({})

// 使用会话状态管理 Composable
const { conversations, updateConversation, incrementUnread, clearUnread, setConversations, appendConversations } =
  useConversationState()

const messages = ref<Message[]>([])
const selectedConversation = ref<Conversation | null>(null)
const conversationSearchKeyword = ref('')
const messageSearchKeyword = ref('')
const hasMoreMessages = ref(false)
const messagesContainer = ref<HTMLElement>()
const newMessage = ref('')
const sendingMessage = ref(false)

// 附件相关状态
const selectedImage = ref<File | null>(null)
const imagePreviewUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const messageInputRef = ref<any>()
const currentFileAccept = ref('image/*')
const currentFileType = ref<'image' | 'video' | 'audio' | 'document'>('image')

// UI 状态
const recentlyUpdated = ref<Record<string, boolean>>({}) // 跟踪最近更新的会话
const wsConnected = ref(false) // WebSocket 连接状态
const archivingChats = ref<Record<string, boolean>>({}) // 跟踪正在归档的会话
const addingWakeTag = ref(false) // 醒鱼标签添加中

// 新對話
const newConversationDialogRef = ref<InstanceType<typeof NewConversationDialog>>()

// 推薦相關狀態
const showReferralDialog = ref(false)
const referralProfile = ref<ReferralProfile | null>(null)
const referralLoading = ref(false)
const referralError = ref('')
const selectedReferralLanguage = ref('ms')
const selectedSourceTag = ref<number | undefined>(undefined)
const selectedChannel = ref<string | undefined>(undefined)
const availableTags = ref<any[]>([])
const availableChannels = ref<any[]>([])

const referralLanguageOptions = [
  { label: 'Bahasa Melayu (马来语)', value: 'ms' },
  { label: 'English (英语/新加坡)', value: 'en' },
  { label: '简体中文', value: 'zh' }
]

const finalReferralShareUrl = computed(() => {
  if (!referralProfile.value?.share_url) return ''

  try {
    const url = new URL(referralProfile.value.share_url)
    // whats-shop uses 'ref' parameter for referral code
    url.searchParams.set('lang', selectedReferralLanguage.value)

    // Add source tag if selected
    if (selectedSourceTag.value) {
      const tag = availableTags.value.find(t => t.id === selectedSourceTag.value)
      if (tag?.source_key) {
        url.searchParams.set('source', tag.source_key)
      }
    }

    // Add channel if selected
    if (selectedChannel.value) {
      url.searchParams.set('ad', selectedChannel.value)
    }

    return url.toString()
  } catch {
    const separator = referralProfile.value.share_url.includes('?') ? '&' : '?'
    let params = `lang=${selectedReferralLanguage.value}`

    // Add source tag if selected
    if (selectedSourceTag.value) {
      const tag = availableTags.value.find(t => t.id === selectedSourceTag.value)
      if (tag?.source_key) {
        params += `&source=${tag.source_key}`
      }
    }

    // Add channel if selected
    if (selectedChannel.value) {
      params += `&ad=${selectedChannel.value}`
    }

    return `${referralProfile.value.share_url}${separator}${params}`
  }
})

const handleNewConversation = () => {
  newConversationDialogRef.value?.open(Number(userId))
}

const handleNewConversationSuccess = async (contactPhone: string) => {
  await fetchConversations()
  // 自動選中新對話 - 支持純手機號和 JID 格式匹配
  const conv = conversations.value.find(c => {
    const phone = c.contact_phone?.replace('@s.whatsapp.net', '')
    return phone === contactPhone || c.contact_phone === contactPhone
  })
  if (conv) {
    await handleSelectConversation(conv)
  }
}

// 翻译相关数据
const translationAvailable = ref(true)
const languageConfigs = ref<LanguageConfig[]>([])
const translationConfig = ref<TranslationConfig>({
  auto_translate_received: false,
  auto_translate_sent: false,
  default_target_language_id: undefined
})
const selectedLanguageId = ref<number | undefined>(undefined)
const selectedSourceLanguageId = ref<number | undefined>(undefined)
const targetLanguage = computed(() => {
  if (!selectedLanguageId.value) return 'en'
  const lang = languageConfigs.value.find(l => l.id === selectedLanguageId.value)
  return lang?.language_code || 'en'
})
const sourceLanguage = computed(() => {
  if (!selectedSourceLanguageId.value) return ''
  const lang = languageConfigs.value.find(l => l.id === selectedSourceLanguageId.value)
  return lang?.language_code || ''
})

// 计算属性 - 直接使用服务端过滤后的结果
const filteredConversations = computed(() => conversations.value)

const filteredMessages = computed(() => {
  if (!messageSearchKeyword.value) return messages.value
  const keyword = messageSearchKeyword.value.toLowerCase()
  return messages.value.filter(msg => msg.content.toLowerCase().includes(keyword))
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    // 使用统一的request对象，路径格式和其他API保持一致
    const data = await api.get(`/accounts/${userId}`)
    userInfo.value = data
  } catch (error) {
    console.error('Error fetching user info:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 对话列表分页状态
const chatsPage = ref(1)
const chatsPageSize = ref(20)
const chatsTotal = ref(0)
const chatsTotalPages = ref(0)
const chatsSearch = ref('')

// 获取对话列表（从API获取会话数据，支持分页）
const fetchConversations = async (page = 1, search = '') => {
  try {
    loading.value = true
    chatsPage.value = page
    chatsSearch.value = search

    // 使用新的分页 API 获取聊天列表
    const data = await api.get(`/accounts/${userId}/chats`, {
      params: {
        page,
        page_size: chatsPageSize.value,
        search: search || undefined
      }
    })

    // 更新分页信息
    chatsTotal.value = data.total || 0
    chatsTotalPages.value = data.total_pages || 0

    // 转换会话数据格式以匹配现有界面
    const chats = data.chats || []
    const formattedConversations = chats.map((chat: any) => ({
      id: chat.id, // 新增: 保留会话ID用于归档操作
      jid: chat.jid, // 保留原始 JID 用于标签API
      archived: chat.archived || false, // 新增: 归档状态
      contact_phone: chat.phone_jid || chat.jid, // 优先使用 phone_jid
      contact_name: getChatDisplayName(chat),
      avatar: chat.avatar || '', // 使用API返回的头像URL
      last_message: chat.last_message || '暂无消息',
      last_message_time: chat.last_time,
      message_count: 0, // 暂时设为0
      unread_count: chat.unread_count || 0,
      has_sensitive: false, // 暂时设为false
      tags: chat.tags || [], // 聊天標籤
      ai_summary: chat.ai_summary || null, // AI 摘要
      is_group: chat.is_group || false
    }))

    // 根据页码决定是替换还是追加
    if (page === 1) {
      setConversations(formattedConversations)
    } else {
      appendConversations(formattedConversations)
    }
  } catch (error) {
    console.error('Error fetching conversations:', error)
    ElMessage.error('获取对话列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索聊天
const handleChatsSearch = (keyword: string) => {
  fetchConversations(1, keyword)
}

// 切换聊天分页
const handleChatsPageChange = (page: number) => {
  fetchConversations(page, chatsSearch.value)
}

// 获取会话显示名称 (从ChatList组件复制)
const getChatDisplayName = (chat: any) => {
  // 如果有名称就用名称，否则使用JID
  if (chat.name && chat.name !== chat.jid) {
    return chat.name
  }

  // 从JID中提取可读的部分
  if (chat.jid.includes('@')) {
    const parts = chat.jid.split('@')
    return parts[0] // 返回@前面的部分
  }

  return chat.jid
}

// 获取特定对话的消息记录
const fetchMessages = async (contactPhone: string, page = 1) => {
  try {
    if (page === 1) {
      messages.value = []
    }

    loadingMore.value = page > 1

    // 使用新的对话历史API接口
    const data = await api.get(
      `/accounts/${userId}/conversation?` +
        `contact_phone=${contactPhone}&` +
        `page=${page}&limit=50&` +
        `target_language=${targetLanguage.value}`
    )

    // 处理正确的数据结构
    // 后端返回 DESC 排序（最新在前），前端需要 reverse 让最新消息显示在底部
    const responseMessages = (data.messages || []).reverse()

    // 加载更多时，记录当前滚动高度以便保持位置
    const container = messagesContainer.value
    const prevScrollHeight = container?.scrollHeight || 0

    if (page === 1) {
      messages.value = responseMessages
    } else {
      // 加载更多历史消息，插入到列表前面
      messages.value.unshift(...responseMessages)
    }

    // 判断是否还有更多消息
    hasMoreMessages.value = responseMessages.length === 50

    // 自动翻译好友消息
    if (translationConfig.value.auto_translate_received && page === 1) {
      await translateReceivedMessages()
    }

    // 为发送方消息设置中文原文显示
    if (translationConfig.value.auto_translate_sent && page === 1) {
      await processSentMessagesTranslation()
    }

    if (page === 1) {
      // 新会话滚动到底部
      nextTick(() => {
        scrollToBottom()
      })
    } else {
      // 加载更多后保持滚动位置
      nextTick(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })
    }
  } catch (error) {
    console.error('Error fetching conversation history:', error)
    ElMessage.error('获取对话历史失败')
  } finally {
    loadingMore.value = false
  }
}

// 事件处理函数
const handleRefresh = async () => {
  await Promise.all([fetchUserInfo(), fetchConversations()])
  if (selectedConversation.value) {
    await fetchMessages(selectedConversation.value.contact_phone)
  }
}

const handleSelectConversation = async (conversation: any) => {
  selectedConversation.value = conversation
  // 清除该对话的未读计数
  clearUnread(conversation.contact_phone)
  await fetchMessages(conversation.contact_phone)
}

// 搜索防抖定时器
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const handleConversationSearch = () => {
  // 使用 debounce 进行服务端搜索
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    fetchConversations(1, conversationSearchKeyword.value)
  }, 300)
}

const handleMessageSearch = () => {
  // 搜索逻辑在计算属性中处理
}

const handleLoadMoreMessages = async () => {
  if (!selectedConversation.value) return
  const currentPage = Math.floor(messages.value.length / 50) + 1
  await fetchMessages(selectedConversation.value.contact_phone, currentPage)
}

const handleExportMessages = async () => {
  if (!selectedConversation.value) return

  try {
    await ElMessageBox.confirm(
      `确定要导出与 ${
        selectedConversation.value.contact_name || selectedConversation.value.contact_phone
      } 的聊天记录吗？`,
      '导出确认'
    )

    // 这里可以调用导出API或者前端导出
    ElMessage.success('导出功能开发中...')
  } catch {
    // 用户取消
  }
}

// 删除消息
const handleDeleteMessage = async (message: Message) => {
  try {
    await ElMessageBox.confirm('确定要删除这条消息吗?删除后消息将对所有人不可见。', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteMessage(Number(message.id))
    ElMessage.success('消息已删除')

    // 标记消息为已删除（保留原始内容供查看）
    const msg = messages.value.find(m => m.id === message.id)
    if (msg) {
      msg.deleted_at = new Date().toISOString()
      msg.deleted_by = '管理员'
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除消息失败:', error)
      ElMessage.error(error.response?.data?.message || '删除消息失败')
    }
  }
}

// 仅删除我方装置上的消息
const handleDeleteMessageForMe = async (message: Message) => {
  try {
    await ElMessageBox.confirm('仅删除我方所有装置上的消息，对方仍可看到。确定要继续吗？', '仅删除我方', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteMessageForMe(Number(message.id))
    ElMessage.success('已从我方装置删除')

    const msg = messages.value.find(m => m.id === message.id)
    if (msg) {
      msg.deleted_at = new Date().toISOString()
      msg.deleted_by = '管理员(仅我方)'
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('DeleteForMe 失败:', error)
      ElMessage.error(error.response?.data?.message || 'DeleteForMe 失败')
    }
  }
}

// 检查是否可以删除消息(管理员权限)
const canDeleteMessage = computed(() => {
  return authStore.hasPermission('message.delete')
})

// 归档/取消归档会话
const handleToggleArchive = async (conversation: Conversation) => {
  if (!conversation.id) {
    ElMessage.error('无法操作:会话ID缺失')
    return
  }

  const action = conversation.archived ? '取消归档' : '归档'

  try {
    archivingChats.value[conversation.contact_phone] = true

    if (conversation.archived) {
      await unarchiveChat(conversation.id)
    } else {
      await archiveChat(conversation.id)
    }

    ElMessage.success(`${action}成功`)

    // 更新本地状态
    const conv = conversations.value.find(c => c.contact_phone === conversation.contact_phone)
    if (conv) {
      conv.archived = !conversation.archived
    }
  } catch (error: any) {
    console.error(`${action}失败:`, error)
    ElMessage.error(error.response?.data?.message || `${action}失败`)
  } finally {
    archivingChats.value[conversation.contact_phone] = false
  }
}

// 醒鱼标签处理
const handleWakeUpFish = async () => {
  if (!selectedConversation.value) {
    ElMessage.warning('请先选择一个对话')
    return
  }

  const conv = selectedConversation.value
  const wakeTag = '醒鱼'

  // 检查是否已有醒鱼标签
  if (conv.tags?.includes(wakeTag)) {
    ElMessage.info('该对话已有醒鱼标签')
    return
  }

  if (!conv.jid) {
    ElMessage.error('无法操作：对话JID缺失')
    return
  }

  try {
    addingWakeTag.value = true

    await createChatTag({
      chat_id: conv.jid,
      account_id: parseInt(userId),
      tag: wakeTag,
      source: 'manual'
    })

    // 更新本地状态
    if (!conv.tags) {
      conv.tags = []
    }
    conv.tags.push(wakeTag)

    // 同步到 conversations 列表
    updateConversation(conv.contact_phone, { tags: conv.tags })

    ElMessage.success('醒鱼标签添加成功')
  } catch (error: any) {
    console.error('添加醒鱼标签失败:', error)
    ElMessage.error(error.response?.data?.message || '添加醒鱼标签失败')
  } finally {
    addingWakeTag.value = false
  }
}

// 移除标签
const handleRemoveTag = async (tag: string) => {
  if (!selectedConversation.value) return
  const conv = selectedConversation.value

  if (!conv.jid) {
    ElMessage.error('无法操作：对话JID缺失')
    return
  }

  try {
    // 查找该标签的ID
    const tagsResult = await getChatTags({
      chat_id: conv.jid,
      account_id: parseInt(userId),
      tag: tag
    })

    if (tagsResult.list && tagsResult.list.length > 0) {
      await deleteChatTag(tagsResult.list[0].id)
    }

    // 更新本地状态
    conv.tags = conv.tags?.filter(t => t !== tag) || []
    updateConversation(conv.contact_phone, { tags: conv.tags })

    ElMessage.success('标签移除成功')
  } catch (error: any) {
    console.error('移除标签失败:', error)
    ElMessage.error(error.response?.data?.message || '移除标签失败')
  }
}

// 附件处理函数
const canSendMessage = computed(() => {
  return selectedImage.value !== null || newMessage.value.trim() !== ''
})

// 附件类型选择处理
const handleAttachmentCommand = (command: string) => {
  const fileTypeMap = {
    image: { accept: 'image/*', type: 'image' as const, maxSize: 16 },
    video: { accept: 'video/*', type: 'video' as const, maxSize: 64 },
    audio: { accept: 'audio/*', type: 'audio' as const, maxSize: 16 },
    document: { accept: '*', type: 'document' as const, maxSize: 100 }
  }

  const config = fileTypeMap[command as keyof typeof fileTypeMap]
  if (config) {
    currentFileAccept.value = config.accept
    currentFileType.value = config.type
    fileInputRef.value?.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const typeConfig = {
    image: { name: '图片', types: ['image/'], maxSize: 16 },
    video: { name: '视频', types: ['video/'], maxSize: 64 },
    audio: { name: '音频', types: ['audio/'], maxSize: 16 },
    document: { name: '文档', types: [], maxSize: 100 }
  }

  const config = typeConfig[currentFileType.value]

  // 验证文件类型（文档类型跳过类型检查）
  if (currentFileType.value !== 'document' && !config.types.some(t => file.type.startsWith(t))) {
    ElMessage.error(`请选择${config.name}文件`)
    return
  }

  // 验证文件大小
  if (file.size > config.maxSize * 1024 * 1024) {
    ElMessage.error(`${config.name}大小不能超过${config.maxSize}MB`)
    return
  }

  selectedImage.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)

  // 重置 file input
  target.value = ''
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()

      const file = item.getAsFile()
      if (!file) continue

      // 验证文件大小
      if (file.size > 16 * 1024 * 1024) {
        ElMessage.error('图片大小不能超过16MB')
        return
      }

      selectedImage.value = file
      imagePreviewUrl.value = URL.createObjectURL(file)
      break
    }
  }
}

const removeSelectedImage = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  selectedImage.value = null
  imagePreviewUrl.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleSendMessage = async () => {
  // 发送媒体文件或文本消息
  if (selectedImage.value) {
    await sendMediaMessage()
  } else if (newMessage.value.trim()) {
    await sendTextMessage()
  }
}

const sendMediaMessage = async () => {
  if (!selectedConversation.value || !selectedImage.value) return

  const caption = newMessage.value.trim()
  const fileType = currentFileType.value

  try {
    sendingMessage.value = true

    // 1. 上传媒体文件 - 根据类型调用不同的接口
    const formData = new FormData()
    formData.append('file', selectedImage.value)

    const uploadEndpoint = `/media/upload/${fileType}`
    const uploadRes = await api.post(uploadEndpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    console.log('Upload response:', uploadRes)

    // 2. 根据类型确定内容和文件名
    const typeLabels = {
      image: '[图片]',
      video: '[视频]',
      audio: '[音频]',
      document: '[文档]'
    }

    const content = caption || typeLabels[fileType]

    // 3. 发送消息
    const payload: any = {
      contact_phone: selectedConversation.value.contact_phone,
      content: content,
      type: fileType,
      media_path: uploadRes.file_path
    }

    // 文档类型需要文件名
    if (fileType === 'document' && selectedImage.value.name) {
      payload.file_name = selectedImage.value.name
    }

    await api.post(`/accounts/${userId}/send`, payload)

    // 4. 清理状态
    removeSelectedImage()
    newMessage.value = ''

    ElMessage.success(`${typeLabels[fileType]}发送成功`)
  } catch (error) {
    console.error('Error sending media:', error)
    ElMessage.error('发送失败: ' + (error?.response?.data?.message || error?.message || '未知错误'))
  } finally {
    sendingMessage.value = false
  }
}

/**
 * 检测文本是否为中文
 * 规则：中文字符占比 >= 30% 视为中文
 * @param text 待检测的文本
 * @returns true: 中文, false: 非中文
 */
const detectChineseLanguage = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false

  // 匹配中文字符（包括中文标点）
  const chineseChars = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g)
  if (!chineseChars) return false

  const chineseCount = chineseChars.length
  const totalLength = text.replace(/\s/g, '').length // 去除空格

  return totalLength > 0 && chineseCount / totalLength >= 0.3
}

const sendTextMessage = async () => {
  if (!selectedConversation.value || !newMessage.value.trim()) return

  const userInput = newMessage.value.trim()

  try {
    sendingMessage.value = true
    console.log('[翻译发送] 用户输入：', userInput)
    console.log('[翻译发送] 翻译配置：', {
      auto_translate_sent: translationConfig.value.auto_translate_sent,
      targetLanguage: targetLanguage.value
    })

    // 立即清空输入框，提升用户体验
    newMessage.value = ''

    let contentToSend = userInput
    let chineseText = userInput

    // 如果启用了自动翻译发送，进行语言检测和翻译
    if (translationConfig.value.auto_translate_sent && targetLanguage.value && translationAvailable.value) {
      const isChinese = detectChineseLanguage(userInput)
      console.log('[翻译发送] 语言检测结果：', isChinese ? '中文' : '非中文')

      try {
        if (isChinese) {
          // 用户输入中文 → 翻译成目标语言发送
          console.log('[翻译发送] 开始翻译中文到：', targetLanguage.value)
          const result = await translateText({
            text: userInput,
            target_language: targetLanguage.value,
            source_language: sourceLanguage.value
          })
          console.log('[翻译发送] 翻译API完整返回：', JSON.stringify(result, null, 2))
          console.log('[翻译发送] result.data：', result?.data)
          console.log('[翻译发送] result.data类型：', typeof result?.data)

          // 验证翻译结果 - 兼容多种响应格式
          // 可能的格式: result.data.translated_text 或 result.translated_text 或 result.data (直接是字符串)
          let translatedText = ''
          if (result?.data?.translated_text) {
            translatedText = result.data.translated_text
          } else if (result?.translated_text) {
            translatedText = result.translated_text
          } else if (typeof result?.data === 'string') {
            translatedText = result.data
          }
          console.log('[翻译发送] 提取的翻译文本：', translatedText)

          if (translatedText && translatedText.trim()) {
            contentToSend = translatedText
            chineseText = userInput // 中文原文就是用户输入
            console.log('[翻译发送] 翻译成功，将发送：', contentToSend)
            ElMessage.success(`已翻译为${targetLanguage.value}`)
          } else {
            // 翻译结果为空，使用原文
            console.warn('[翻译发送] 翻译结果为空，使用原文。完整响应：', result)
            ElMessage.warning('翻译结果为空，将发送原文')
            contentToSend = userInput
            chineseText = userInput
          }
        } else {
          // 用户输入外语 → 翻译成中文保存为原文
          console.log('[翻译发送] 开始翻译外语到中文')
          const result = await translateText({
            text: userInput,
            target_language: targetLanguage.value,
            source_language: sourceLanguage.value
          })
          console.log('[翻译发送] 翻译API完整返回：', JSON.stringify(result, null, 2))
          console.log('[翻译发送] result.data：', result?.data)

          // 验证翻译结果 - 兼容多种响应格式
          let translatedText = ''
          if (result?.data?.translated_text) {
            translatedText = result.data.translated_text
          } else if (result?.translated_text) {
            translatedText = result.translated_text
          } else if (typeof result?.data === 'string') {
            translatedText = result.data
          }

          contentToSend = userInput // 直接发送外语
          if (translatedText && translatedText.trim()) {
            chineseText = translatedText // 保存中文译文
            console.log('[翻译发送] 翻译成功，中文译文：', chineseText)
            ElMessage.success('已检测为外语，已翻译为中文原文')
          } else {
            // 翻译结果为空，使用原文
            console.warn('[翻译发送] 中文翻译结果为空，原文将作为中文保存。完整响应：', result)
            chineseText = userInput
          }
        }
      } catch (error) {
        console.error('[翻译发送] 翻译错误：', error)
        disableTranslation(error)
        if (!translationAvailable.value) {
          ElMessage.warning('翻譯功能未就緒，將發送原文')
        } else {
          ElMessage.warning('翻译失败，将发送原文')
        }
        contentToSend = userInput
        chineseText = userInput
      }
    } else {
      console.log('[翻译发送] 自动翻译未启用或目标语言未设置，发送原文')
    }

    console.log('[翻译发送] 最终发送内容：', contentToSend)
    console.log('[翻译发送] 保存的中文原文：', chineseText)

    // 调用后端发送消息API
    await api.post(`/accounts/${userId}/send`, {
      contact_phone: selectedConversation.value.contact_phone,
      content: contentToSend,
      original_text: chineseText, // 总是保存中文版本
      type: 'text'
    })

    ElMessage.success('消息发送成功')
  } catch (error) {
    console.error('Error sending message:', error)
    ElMessage.error(
      '发送消息失败: ' + (error?.response?.data?.message || error?.message || '未知错误')
    )
    // 发送失败，恢复输入框内容
    newMessage.value = userInput
  } finally {
    sendingMessage.value = false
  }
}

// 工具函数
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

const formatTime = (dateTime: string) => {
  const date = new Date(dateTime)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const getMessageTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    text: '文本',
    image: '图片',
    video: '视频',
    audio: '音频文件',
    voice: '语音',
    voice_note: '语音消息',
    document: '文档',
    location: '位置',
    sticker: '贴纸',
    contact: '联系人',
    reaction: '回应',
    live_location: '实时位置',
    file: '文件',
    other: '其他'
  }
  return typeMap[type] || type
}

const getMessageTypeIcon = (type: string) => {
  const iconMap: { [key: string]: any } = {
    image: Picture,
    video: VideoCamera,
    audio: Microphone,
    voice: Microphone,
    voice_note: Microphone,
    document: Document,
    location: Location,
    sticker: Sunny,
    contact: User,
    reaction: Star,
    live_location: MapLocation,
    file: Folder
  }
  return iconMap[type] || Document
}

const getMessageTypeColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    text: 'info',
    image: 'success',
    video: 'primary',
    audio: 'warning',
    voice: 'warning',
    voice_note: 'warning',
    document: 'info',
    location: 'danger',
    sticker: 'success',
    contact: 'primary',
    reaction: 'warning',
    live_location: 'danger',
    file: 'info'
  }
  return colorMap[type] || 'info'
}

const getStatusType = (status: string) => {
  const statusMap: { [key: string]: string } = {
    sent: 'success',
    delivered: 'success',
    read: 'success',
    failed: 'danger',
    pending: 'warning'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    sent: '已发送',
    delivered: '已送达',
    read: '已读',
    failed: '发送失败',
    pending: '发送中'
  }
  return statusMap[status] || status
}

// 获取发送状态图标
const getStatusIcon = (status: string) => {
  const iconMap: { [key: string]: any } = {
    sent: CircleCheckFilled,
    delivered: CircleCheckFilled,
    read: CircleCheckFilled,
    failed: CircleCloseFilled,
    pending: Loading
  }
  return iconMap[status] || CircleCheckFilled
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 判断消息是否是发送的（与当前用户相关）
const isMessageSent = (message: any) => {
  // 根据后端API返回的 is_from_me 字段判断
  // is_from_me 为 true 表示是当前用户发送的消息
  return message.is_from_me === true
}

// 获取发送者名称
const getSenderName = (message: any) => {
  // 根据消息的 is_from_me 字段判断发送者
  if (message.is_from_me) {
    return userInfo.value.push_name || '我'
  } else {
    // 对方发送的消息，使用sender信息
    if (message.sender) {
      return message.sender.name || message.sender.phone || '对方'
    }
    return selectedConversation.value?.contact_name || '对方'
  }
}

// 获取完整的媒体文件URL
const getMediaUrl = (mediaUrl: string) => {
  if (!mediaUrl) return ''
  // 如果已经是完整URL，直接返回
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }
  // 否则拼接服务器地址 (注意: /media 路由在根路径,不在 /api 下)
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const serverURL = apiBaseURL.replace(/\/api$/, '')
  return `${serverURL}${mediaUrl}`
}

// 处理文件下载
const handleDownloadFile = (message: Message) => {
  if (!message.media_url) {
    ElMessage.error('文件不可用')
    return
  }

  const fileUrl = getMediaUrl(message.media_url)
  const fileName = message.content || '下载的文件'

  // 创建一个隐藏的a标签来触发下载
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = fileName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('开始下载文件')
}

// 翻译功能相关函数
const loadLanguageConfigs = async () => {
  try {
    const res = await getLanguageConfigs()
    languageConfigs.value = res.data || []

    // 如果有默认语言，选中它
    const defaultLang = languageConfigs.value.find(l => l.is_default)
    if (defaultLang) {
      selectedLanguageId.value = defaultLang.id
    } else if (languageConfigs.value.length > 0) {
      selectedLanguageId.value = languageConfigs.value[0].id
    }
  } catch (error) {
    console.error('Error loading language configs:', error)
  }
}

const loadTranslationConfig = async () => {
  try {
    const res = await getTranslationConfig()
    console.log('[翻译配置] API返回：', res)
    console.log('[翻译配置] res.data：', res?.data)
    if (res.data) {
      translationConfig.value = res.data
      console.log('[翻译配置] 已加载配置：', {
        auto_translate_received: translationConfig.value.auto_translate_received,
        auto_translate_sent: translationConfig.value.auto_translate_sent,
        default_target_language_id: res.data.default_target_language_id
      })
      if (res.data.default_target_language_id) {
        selectedLanguageId.value = res.data.default_target_language_id
      }
    } else {
      console.warn('[翻译配置] res.data 为空')
    }
  } catch (error) {
    console.error('[翻译配置] 加载失败：', error)
  }
}

const handleSaveTranslationConfig = async () => {
  try {
    await updateTranslationConfig({
      auto_translate_received: translationConfig.value.auto_translate_received,
      auto_translate_sent: translationConfig.value.auto_translate_sent,
      default_target_language_id: selectedLanguageId.value
    })
    ElMessage.success('翻译设置已保存')

    // 如果打开了自动翻译接收，立即翻译当前消息
    if (translationConfig.value.auto_translate_received && messages.value.length > 0) {
      await translateReceivedMessages()
    }

    // 如果打开了自动翻译发送，立即处理发送方消息的中文原文显示
    if (translationConfig.value.auto_translate_sent && messages.value.length > 0) {
      await processSentMessagesTranslation()
    }
  } catch (error) {
    console.error('Error saving translation config:', error)
    ElMessage.error('保存翻译设置失败')
  }
}

const handleLanguageChange = async () => {
  await handleSaveTranslationConfig()

  // 切换语言后，清除现有翻译并重新翻译
  if (messages.value.length > 0) {
    // 清除所有消息的翻译缓存（包括好友消息和发送方消息）
    messages.value.forEach(msg => {
      if (msg.type === 'text') {
        msg.translated_text = undefined
        msg.translating = false
      }
    })

    // 如果启用了自动翻译接收，重新翻译好友消息
    if (translationConfig.value.auto_translate_received) {
      await translateReceivedMessages()
    }

    // 如果启用了自动翻译发送，重新翻译发送方消息
    if (translationConfig.value.auto_translate_sent) {
      await processSentMessagesTranslation()
    }
  }
}

function isTranslationConfigError(error: any): boolean {
  const msg = error?.message || String(error)
  return msg.includes('api_key') || msg.includes('未配置')
}

function disableTranslation(error: any) {
  if (isTranslationConfigError(error)) {
    translationAvailable.value = false
    ElMessage.warning('翻譯功能未就緒：LLM API Key 未配置，請至系統設定中設置')
  }
}

// 防抖翻译函数
let translateDebounceTimer: ReturnType<typeof setTimeout> | null = null
const translateReceivedMessages = async () => {
  if (!translationAvailable.value) return

  // 清除之前的定时器
  if (translateDebounceTimer) {
    clearTimeout(translateDebounceTimer)
  }

  // 使用防抖，避免频繁调用
  return new Promise<void>(resolve => {
    translateDebounceTimer = setTimeout(async () => {
      // 只翻译好友发送的未翻译的文本消息（后端已返回缓存的消息会有translated_text字段）
      const messagesToTranslate = messages.value.filter(
        msg => !msg.is_from_me && msg.type === 'text' && msg.content && !msg.translated_text
      )

      if (messagesToTranslate.length === 0) {
        console.log('[翻译优化] 所有消息已有翻译缓存，无需调用API')
        resolve()
        return
      }

      console.log(`[翻译优化] 需要翻译的消息数: ${messagesToTranslate.length}`)
      console.log(`[翻译优化] 已缓存的消息数: ${messages.value.filter(m => !m.is_from_me && m.type === 'text' && m.translated_text).length}`)

      // 逐个翻译未缓存的消息
      for (const message of messagesToTranslate) {
        if (!translationAvailable.value) break
        message.translating = true
        try {
          const result = await translateText({
            text: message.content,
            target_language: targetLanguage.value,
            source_language: sourceLanguage.value
          })
          message.translated_text = result.data.translated_text
          console.log(`[翻译优化] 翻译完成: ${message.content.substring(0, 20)}...`)
        } catch (error) {
          console.error('[翻译优化] 翻译失败:', error)
          disableTranslation(error)
          message.translated_text = '[翻译失败]'
          if (!translationAvailable.value) break
        } finally {
          message.translating = false
        }
      }

      resolve()
    }, 300) // 300ms 防抖延迟
  })
}

// 处理发送方消息的翻译显示
const processSentMessagesTranslation = async () => {
  if (!translationAvailable.value) return

  console.log('[发送方翻译] 开始处理发送方消息翻译')
  console.log('[发送方翻译] 消息总数:', messages.value.length)

  const sentMessages = messages.value.filter(msg => msg.is_from_me && msg.type === 'text')
  console.log('[发送方翻译] 发送方文本消息数:', sentMessages.length)

  for (const msg of messages.value) {
    if (!translationAvailable.value) break
    if (msg.is_from_me && msg.type === 'text') {
      // 如果有 original_text，说明已经翻译过，直接使用
      if (msg.original_text && !msg.translated_text) {
        msg.translated_text = msg.original_text
        console.log('[发送方翻译] 使用 original_text:', msg.translated_text)
      }
      // 如果没有 original_text 且没有 translated_text，需要调用 API 翻译
      else if (!msg.original_text && !msg.translated_text && msg.content) {
        msg.translating = true
        try {
          const result = await translateText({
            text: msg.content,
            target_language: targetLanguage.value,
            source_language: sourceLanguage.value
          })
          msg.translated_text = result.data.translated_text
          console.log('[发送方翻译] API 翻译结果:', msg.translated_text)
        } catch (error) {
          console.error('[发送方翻译] 翻译失败:', error)
          disableTranslation(error)
          msg.translated_text = '[翻译失败]'
          if (!translationAvailable.value) break
        } finally {
          msg.translating = false
        }
      }
    }
  }
}

// 监听翻译配置变化
watch(
  () => translationConfig.value.auto_translate_received,
  async newVal => {
    if (newVal && messages.value.length > 0) {
      await translateReceivedMessages()
    }
  }
)

// 监听发送方翻译配置变化
watch(
  () => translationConfig.value.auto_translate_sent,
  async newVal => {
    if (newVal && messages.value.length > 0) {
      await processSentMessagesTranslation()
    }
  }
)

// 规范化 JID（移除设备 ID）
const normalizeJID = (jid: string): string => {
  // 移除 WhatsApp 设备 ID（例如 :1, :2 等）
  // 85587899137:1@s.whatsapp.net -> 85587899137@s.whatsapp.net
  return jid.replace(/:\d+@/, '@')
}

// WebSocket 消息处理
const handleNewMessage = async (messageData: NewMessageData) => {
  console.log('收到新消息:', messageData)

  // 使用 phone_jid 作为优先选择（处理 LID -> PhoneJID 映射）
  // 如果 phone_jid 不存在，回退到原来的 jid
  let messageContactPhone = messageData.is_from_me
    ? messageData.to_phone_jid || messageData.to_jid
    : messageData.from_phone_jid || messageData.from_jid

  // 规范化 JID 格式
  messageContactPhone = normalizeJID(messageContactPhone)

  console.log('[Debug] 规范化后的 messageContactPhone:', messageContactPhone)
  console.log(
    '[Debug] 现有会话列表:',
    conversations.value.map(c => c.contact_phone)
  )

  // ✅ 本地更新会话列表（零网络请求，<10ms）
  updateConversation(messageContactPhone, {
    last_message: messageData.content,
    last_message_time: messageData.timestamp
  })

  // 标记为最近更新，触发动画
  recentlyUpdated.value[messageContactPhone] = true
  setTimeout(() => {
    recentlyUpdated.value[messageContactPhone] = false
  }, 2000) // 2秒后移除高亮

  // 如果不是当前对话，增加未读计数
  if (
    !selectedConversation.value ||
    messageContactPhone !== selectedConversation.value.contact_phone
  ) {
    if (!messageData.is_from_me) {
      incrementUnread(messageContactPhone)
    }
    return // 不属于当前对话，只更新会话列表
  }

  // ===== 当前对话的消息处理 =====

  // 构造消息对象
  const newMsg: Message = {
    id: messageData.id,
    message_id: messageData.message_id,
    content: messageData.content,
    type: messageData.type || 'text',
    is_from_me: messageData.is_from_me,
    timestamp: messageData.timestamp,
    send_status: 'sent',
    media_url: messageData.media_url || '',
    original_text: messageData.original_text || '',
    translated_text: undefined,
    translating: false
  }

  // 添加到消息列表
  messages.value.push(newMsg)

  // 如果是好友消息且启用了自动翻译，进行翻译
  if (
    !newMsg.is_from_me &&
    translationConfig.value.auto_translate_received &&
    translationAvailable.value &&
    newMsg.type === 'text'
  ) {
    newMsg.translating = true
    try {
      const result = await translateText({
        text: newMsg.content,
        target_language: targetLanguage.value,
        source_language: sourceLanguage.value
      })
      newMsg.translated_text = result.data.translated_text
    } catch (error) {
      console.error('翻译失败:', error)
      disableTranslation(error)
      newMsg.translated_text = '[翻译失败]'
    } finally {
      newMsg.translating = false
    }
  }

  // 如果是发送方消息且启用了自动翻译发送
  if (
    newMsg.is_from_me &&
    translationConfig.value.auto_translate_sent &&
    translationAvailable.value &&
    newMsg.type === 'text'
  ) {
    // 如果有 original_text，直接使用
    if (newMsg.original_text) {
      newMsg.translated_text = newMsg.original_text
    }
    // 如果没有 original_text，调用 API 翻译
    else if (newMsg.content) {
      newMsg.translating = true
      try {
        const result = await translateText({
          text: newMsg.content,
          target_language: targetLanguage.value,
          source_language: sourceLanguage.value
        })
        newMsg.translated_text = result.data.translated_text
      } catch (error) {
        console.error('翻译失败:', error)
        disableTranslation(error)
        newMsg.translated_text = '[翻译失败]'
      } finally {
        newMsg.translating = false
      }
    }
  }

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// SSE 消息状态更新处理
const handleMessageStatus = (statusData: MessageStatusData) => {
  console.log('收到消息状态更新:', statusData)

  // 在当前消息列表中查找并更新状态
  const message = messages.value.find(m => {
    // 尝试匹配 message_id（可能是字符串或数字）
    return String(m.id) === String(statusData.message_id)
  })

  if (message) {
    message.send_status = statusData.status
    console.log(`消息 ${statusData.message_id} 状态更新为: ${statusData.status}`)
  }
}

// SSE 消息撤回处理
const handleMessageRevoked = (revokedData: MessageRevokedData) => {
  console.log('收到消息撤回事件:', revokedData)

  // 使用 message_id（WhatsApp ID）匹配，而不是数据库 id
  const message = messages.value.find(m => m.message_id === revokedData.message_id)

  if (message) {
    message.is_revoked = true
    message.revoked_at = revokedData.revoked_at
    console.log(`消息 ${revokedData.message_id} 已被撤回`)
  } else {
    console.log(`消息 ${revokedData.message_id} 未在当前列表中找到`)
  }
}

// SSE 消息编辑处理
const handleMessageEdited = (editedData: MessageEditedData) => {
  console.log('收到消息编辑事件:', editedData)

  // 使用 message_id（WhatsApp ID）匹配，而不是数据库 id
  const message = messages.value.find(m => m.message_id === editedData.message_id)

  if (message) {
    message.content = editedData.new_content
    message.is_edited = true
    message.edited_at = editedData.edited_at
    console.log(`消息 ${editedData.message_id} 已被编辑`)
  } else {
    console.log(`消息 ${editedData.message_id} 未在当前列表中找到`)
  }
}

// SSE 会话归档状态变更处理
const handleChatArchiveChanged = (archiveData: ChatArchiveChangedData) => {
  console.log('收到会话归档状态更新事件:', archiveData)

  const normalizedEventJid = archiveData.jid ? normalizeJID(archiveData.jid) : undefined
  const conversation =
    conversations.value.find(conv => {
      if (archiveData.chat_id && conv.id === archiveData.chat_id) {
        return true
      }
      if (normalizedEventJid) {
        const convJidSource = conv.jid || conv.contact_phone
        return normalizeJID(convJidSource) === normalizedEventJid
      }
      return false
    }) || null

  if (!conversation) {
    console.warn('[SSE] chat_archive_changed 未匹配到本地会话，尝试刷新会话列表', archiveData)
    fetchConversations(1, chatsSearch.value)
    return
  }

  const nextArchived = Boolean(archiveData.archived)
  const updates: Partial<Conversation> = { archived: nextArchived }

  if (archiveData.timestamp) {
    const currentTs = new Date(conversation.last_message_time).getTime()
    const incomingTs = new Date(archiveData.timestamp).getTime()
    if (!Number.isNaN(incomingTs) && (Number.isNaN(currentTs) || incomingTs > currentTs)) {
      updates.last_message_time = archiveData.timestamp
    }
  }

  if (conversation.archived === nextArchived && !updates.last_message_time) {
    return
  }

  updateConversation(conversation.contact_phone, updates)

  if (selectedConversation.value?.contact_phone === conversation.contact_phone) {
    selectedConversation.value = {
      ...selectedConversation.value,
      ...updates
    }
  }
}

// 后台同步机制（防止状态漂移）
const SYNC_INTERVAL = 5 * 60 * 1000 // 5分钟
let syncTimer: ReturnType<typeof setInterval> | null = null

const startBackgroundSync = () => {
  syncTimer = setInterval(async () => {
    try {
      // 静默刷新会话列表
      await fetchConversations()
      console.log('后台同步会话列表完成')
    } catch (error) {
      console.error('后台同步失败:', error)
    }
  }, SYNC_INTERVAL)
}

const stopBackgroundSync = () => {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}

// 推薦相關方法
const handleShowReferralLink = async () => {
  showReferralDialog.value = true
  referralProfile.value = null
  referralError.value = ''

  // 加载推荐信息
  await loadReferralProfile(Number(userId))

  // 加载标签列表（只加载有 source_key 的标签）
  try {
    const response = await api.get('/tags/accounts', {
      params: {
        page: 1,
        page_size: 100
      }
    })
    if (response?.list) {
      // 只显示有 source_key 的标签
      availableTags.value = response.list.filter((tag: any) => tag.source_key)
    }
  } catch (error) {
    console.error('加载标签列表失败:', error)
  }

  // 加载渠道列表
  try {
    const response = await api.get('/channels', {
      params: {
        page: 1,
        page_size: 100,
        status: 'enabled'
      }
    })
    if (response?.list) {
      availableChannels.value = response.list
    }
  } catch (error) {
    console.error('加载渠道列表失败:', error)
  }
}

const loadReferralProfile = async (accountId: number) => {
  referralLoading.value = true
  referralError.value = ''

  try {
    referralProfile.value = await referralApi.getReferralProfile(accountId)
  } catch (error: any) {
    // 如果是 404，说明还没有生成推荐码
    if (error.response?.status === 404 || error.code === 404) {
      referralProfile.value = null
    } else {
      referralError.value = error.message || '加載推薦信息失敗'
    }
  } finally {
    referralLoading.value = false
  }
}

const handleGenerateReferralCode = async () => {
  referralLoading.value = true
  referralError.value = ''

  try {
    // 获取第一个可用的推广域名
    const domainsResponse = await promotionDomainApi.getOptions()
    if (!domainsResponse.data || domainsResponse.data.length === 0) {
      ElMessage.error('沒有可用的推廣域名，請先配置推廣域名')
      return
    }

    const firstDomain = domainsResponse.data[0]

    // 生成推荐码
    await referralApi.generateCode(Number(userId), {
      promotion_domain_id: firstDomain.id,
      landing_path: '/'
    })

    ElMessage.success('推薦碼生成成功')

    // 重新加载推荐信息
    await loadReferralProfile(Number(userId))

    // 刷新用户信息
    await fetchUserInfo()
  } catch (error: any) {
    referralError.value = error.message || '生成推薦碼失敗'
    ElMessage.error(referralError.value)
  } finally {
    referralLoading.value = false
  }
}

const handleCopyLink = async () => {
  if (!finalReferralShareUrl.value) return

  try {
    await navigator.clipboard.writeText(finalReferralShareUrl.value)
    ElMessage.success('鏈接已複製到剪貼板')
  } catch (error) {
    ElMessage.error('複製失敗，請手動複製')
  }
}

// 生命周期
onMounted(async () => {
  await fetchUserInfo()
  await fetchConversations()
  await loadLanguageConfigs()
  await loadTranslationConfig()

  // 连接 SSE
  if (userId) {
    sseClient.connect(Number(userId))
    // 注册消息处理器
    sseClient.on('new_message', handleNewMessage)
    sseClient.on('message_status', handleMessageStatus)
    sseClient.on('message_revoked', handleMessageRevoked)
    sseClient.on('message_edited', handleMessageEdited)
    sseClient.on('chat_archive_changed', handleChatArchiveChanged)
  }

  // 启动后台同步
  startBackgroundSync()
})

// 监听 SSE 连接状态
watch(
  () => sseClient.connected.value,
  newVal => {
    wsConnected.value = newVal
  },
  { immediate: true }
)

onUnmounted(() => {
  // 移除消息处理器
  sseClient.off('new_message', handleNewMessage)
  sseClient.off('message_status', handleMessageStatus)
  sseClient.off('message_revoked', handleMessageRevoked)
  sseClient.off('message_edited', handleMessageEdited)
  sseClient.off('chat_archive_changed', handleChatArchiveChanged)
  // 断开 SSE 连接
  sseClient.disconnect()
  // 停止后台同步
  stopBackgroundSync()
})

// Helper functions for parsing message metadata
const parseMetadata = (message: Message) => {
  if (!message.message_metadata) return null
  try {
    return JSON.parse(message.message_metadata)
  } catch (error) {
    console.error('解析消息元数据失败:', error)
    return null
  }
}

const getLocationName = (message: Message) => {
  const metadata = parseMetadata(message)
  return metadata?.name || '位置'
}

const getLocationCoords = (message: Message) => {
  const metadata = parseMetadata(message)
  if (!metadata?.latitude || !metadata?.longitude) return ''
  return `${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`
}

const getLocationMapUrl = (message: Message) => {
  const metadata = parseMetadata(message)
  if (!metadata?.latitude || !metadata?.longitude) return null
  const lat = metadata.latitude
  const lon = metadata.longitude
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${
    lon + 0.01
  },${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`
}

const openLocationInMap = (message: Message) => {
  const metadata = parseMetadata(message)
  if (!metadata?.latitude || !metadata?.longitude) {
    ElMessage.error('位置信息不可用')
    return
  }
  const lat = metadata.latitude
  const lon = metadata.longitude
  window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`, '_blank')
}

const getContactName = (message: Message) => {
  const metadata = parseMetadata(message)
  return metadata?.display_name || '未知联系人'
}

const getContactPhones = (message: Message): string[] => {
  const metadata = parseMetadata(message)
  if (!metadata?.vcard) return []
  try {
    const vcard = metadata.vcard
    const phoneMatches = vcard.match(/TEL[^:]*:([^\r\n]+)/g)
    return phoneMatches?.map((p: string) => p.split(':')[1].trim()) || []
  } catch {
    return []
  }
}

const getVoiceDuration = (message: Message) => {
  const metadata = parseMetadata(message)
  const duration = metadata?.duration || 0
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const getReactionEmoji = (message: Message) => {
  const metadata = parseMetadata(message)
  return metadata?.emoji || '👍'
}
</script>

<style scoped>
.user-messages {
  height: calc(100vh - 60px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
}

.header-card {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left p {
  margin: 0;
  color: #7f8c8d;
}

.header-right {
  display: flex;
  gap: 10px;
}

/* WebSocket 连接状态指示器 */
.ws-status-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  background-color: #f56c6c;
  color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
}

.ws-status-indicator.connected {
  background-color: #67c23a;
}

.ws-status-indicator .el-icon {
  font-size: 16px;
}

/* 用户信息头部样式 */
.user-info-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-details h2 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.phone-number {
  margin: 0 0 8px 0;
  color: #606266;
  font-family: monospace;
  font-size: 14px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 90%;
}

/* 对话列表样式 */
.conversations-card {
  height: 90%;
  display: flex;
  flex-direction: column;
}

.conversations-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.conversations-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.chats-pagination {
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.chats-pagination .no-more-text {
  color: #999;
  font-size: 13px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.conversation-item:hover {
  background-color: #f8f9fa;
}

.conversation-item.active {
  background-color: #e7f3ff;
  border-left: 4px solid #409eff;
}

/* 会话更新动画 */
.conversation-item.just-updated {
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background-color: #fff3cd;
  }
  100% {
    background-color: transparent;
  }
}

/* 未读消息标记 */
.conversation-item.has-unread .contact-name {
  color: #409eff;
  font-weight: 600;
}

.conversation-item.has-unread .last-message-time {
  color: #409eff;
}

/* 会话操作按钮样式 */
.conversation-actions {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

/* 已归档会话视觉区分 */
.conversation-item.archived {
  opacity: 0.8;
  background-color: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.conversation-item.archived .contact-name {
  color: #b88230;
}

.conversation-item.archived .contact-name::after {
  content: '已归档';
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  background-color: #e6a23c;
  color: #fff;
  border-radius: 3px;
  font-weight: normal;
}

.conversation-item:last-child {
  border-bottom: none;
}

.conversation-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
  padding-right: 30px;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.contact-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-time {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
  margin-left: 8px;
}

.last-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-preview {
  font-size: 13px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.message-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.chat-tag {
  margin-left: 4px;
}

.empty-conversations {
  padding: 40px 20px;
  text-align: center;
}

/* 消息历史记录样式 */
.ai-summary-bar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 15px;
  background: #f0f9ff;
  border-bottom: 1px solid #e0f0ff;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  flex-shrink: 0;
}

.ai-summary-bar .el-icon {
  color: #409eff;
  margin-top: 2px;
  flex-shrink: 0;
}

.messages-card {
  height: 90%;
  display: flex;
  flex-direction: column;
}

.messages-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.messages-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.no-conversation-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f8f9fa;
}

.message-item {
  display: flex;
  margin-bottom: 8px;
  animation: fadeIn 0.3s ease;
}

.message-item.sent {
  flex-direction: row-reverse;
}

.message-item.received {
  flex-direction: row;
}

.message-avatar {
  flex-shrink: 0;
  margin: 0 10px;
}

.message-content {
  position: relative;
  max-width: 70%;
  min-width: 200px;
}

.message-item.sent .message-content {
  background-color: #409eff;
  color: white;
  border-radius: 12px 12px 4px 12px;
  padding: 8px 12px;
  margin-left: auto;
}

.message-item.received .message-content {
  background-color: white;
  color: #2c3e50;
  border-radius: 12px 12px 12px 4px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  margin-right: auto;
}

.message-item.sensitive .message-content {
  border: 2px solid #f56c6c;
  background-color: #fef0f0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
  font-size: 12px;
}

.message-item.sent .message-header {
  color: rgba(255, 255, 255, 0.8);
}

.message-item.received .message-header {
  color: #909399;
}

.sender-name {
  font-weight: 500;
}

.message-time {
  font-size: 11px;
}

.message-body {
  /* 移除 margin 讓 padding 上下一致 */
}

.message-text {
  word-wrap: break-word;
  line-height: 1.4;

  &.deleted-content {
    text-decoration: line-through;
    opacity: 0.7;
  }
}

/* 消息媒体样式 */
.message-media {
  width: 100%;
}

.media-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.05);
}

.message-item.sent .media-container {
  background-color: rgba(255, 255, 255, 0.1);
}

.media-icon {
  flex-shrink: 0;
  padding: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-content {
  flex: 1;
  min-width: 0;
}

.media-type {
  margin-bottom: 6px;
}

.media-description {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.message-item.sent .media-description {
  color: rgba(255, 255, 255, 0.9);
}

.message-item.received .media-description {
  color: #606266;
}

.no-content {
  font-style: italic;
  opacity: 0.7;
}

/* 语音控制样式 */
.voice-controls {
  margin-top: 8px;
}

.voice-controls audio {
  width: 100%;
  max-width: 300px;
}

.no-media {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  opacity: 0.7;
}

.message-item.received .no-media {
  border-color: #dcdfe6;
  color: #909399;
}

/* 媒体预览样式 */
.media-preview {
  margin-top: 8px;
}

.video-preview {
  display: flex;
  justify-content: center;
}

.video-preview video {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-preview {
  display: flex;
  justify-content: center;
}

.image-preview :deep(.el-image) {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-preview :deep(.el-image:hover) {
  transform: scale(1.02);
}

.image-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-height: 100px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.image-slot .el-icon {
  font-size: 32px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-align: center;
}

.message-item.received .preview-placeholder {
  border-color: #dcdfe6;
}

.preview-placeholder span {
  font-size: 12px;
  opacity: 0.7;
}

/* 媒体文件过期提示样式 */
.media-expired {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #909399;
  max-width: 300px;
  min-height: 180px;
  justify-content: center;
}

.message-item.sent .media-expired {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.media-expired .el-icon {
  color: #c0c4cc;
  margin-bottom: 8px;
}

.message-item.sent .media-expired .el-icon {
  color: rgba(255, 255, 255, 0.5);
}

.expired-hint {
  font-size: 11px !important;
  opacity: 0.5 !important;
  margin-top: 4px;
}

/* 文件控制样式 */
.file-controls {
  margin-top: 8px;
}

/* 位置控制样式 */
.location-controls {
  margin-top: 8px;
}

.location-info {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.location-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  margin-bottom: 6px;
}

.location-coords {
  font-size: 13px;
  color: #909399;
  font-family: monospace;
  margin-bottom: 10px;
}

.location-map {
  margin: 10px 0;
  border-radius: 8px;
  overflow: hidden;
}

/* 贴纸样式 */
.sticker-preview {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sticker-preview .preview-placeholder {
  padding: 20px;
  text-align: center;
}

/* 联系人卡片样式 */
.contact-card {
  margin-top: 8px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  max-width: 300px;
}

.contact-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.contact-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.contact-phones {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.phone-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.phone-item .el-icon {
  color: #409eff;
}

.no-phones {
  font-size: 13px;
  color: #909399;
  font-style: italic;
}

/* 语音笔记样式 */
.voice-note-controls {
  margin-top: 8px;
}

.voice-note-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #e6a23c;
  font-weight: 600;
}

.voice-duration {
  font-size: 14px;
  font-family: monospace;
}

/* 回应消息样式 */
.reaction-display {
  margin-top: 8px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  max-width: 200px;
}

.reaction-emoji {
  font-size: 48px;
  margin-bottom: 8px;
}

.reaction-text {
  font-size: 13px;
  color: #909399;
}

/* 实时位置样式 */
.live-location-controls {
  margin-top: 8px;
}

.live-location-info {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid #f56c6c;
}

.live-location-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #f56c6c;
  font-weight: 600;
}

/* 發送狀態圖標（在 header 時間戳旁） */
.status-icon {
  font-size: 12px;
  margin-left: 2px;

  &.sent { color: #67c23a; }
  &.delivered { color: #409eff; }
  &.read { color: #409eff; }
  &.failed { color: #f56c6c; }
  &.pending { color: #e6a23c; animation: spin 1s linear infinite; }
}

.message-item.sent .status-icon {
  &.sent { color: rgba(255, 255, 255, 0.8); }
  &.delivered { color: rgba(255, 255, 255, 0.9); }
  &.read { color: #fff; }
  &.failed { color: #ffaaaa; }
  &.pending { color: rgba(255, 255, 255, 0.7); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 撤回/刪除/編輯的消息 - 用背景色區分 */
.message-item.revoked .message-content {
  background-color: #e0e0e0 !important;
  color: #909399 !important;
}

.message-item.revoked .message-text.revoked-text {
  font-style: italic;
  opacity: 0.8;
}

.message-item.deleted .message-content {
  background-color: #fde2e2 !important;
  color: #f56c6c !important;
}

.message-item.deleted .message-text {
  text-decoration: line-through;
}

.message-item.edited .message-content {
  border-left: 3px solid #e6a23c;
}

.edited-label {
  font-size: 10px;
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.15);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.message-item.sent .edited-label {
  color: #f0c78a;
  background: rgba(255, 255, 255, 0.2);
}

.revoked-label {
  font-size: 10px;
  color: #fff;
  background: rgba(144, 147, 153, 0.7);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.message-item.sent .revoked-label {
  color: #fff;
  background: rgba(144, 147, 153, 0.7);
}

.deleted-label {
  font-size: 10px;
  color: #fff;
  background: rgba(245, 108, 108, 0.75);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.message-item.sent .deleted-label {
  color: #fff;
  background: rgba(245, 108, 108, 0.75);
}

/* 發送方的撤回/刪除樣式 */
.message-item.sent.revoked .message-content {
  background-color: #b0b0b0 !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

.message-item.sent.deleted .message-content {
  background-color: #d98f8f !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

.message-item.sent.edited .message-content {
  border-left: none;
  border-right: 3px solid #f0c78a;
}

/* 消息操作按鈕（絕對定位懸浮在右上角） */
.message-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  padding: 4px 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

  .el-button {
    font-size: 18px;
    padding: 4px;
    color: #fff !important;

    &:hover {
      color: #f56c6c !important;
    }
  }
}

.message-item.sent .message-actions {
  background: rgba(0, 0, 0, 0.6);
}

.message-content:hover .message-actions {
  opacity: 1;
}

/* 已删除/撤销消息标识（内嵌样式） */
.message-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  margin-top: 8px;
  border-radius: 4px;
  font-size: 12px;

  .el-icon {
    font-size: 12px;
  }

  .operator {
    opacity: 0.8;
  }

  &.deleted {
    background-color: rgba(245, 108, 108, 0.15);
    color: #f56c6c;
  }

  &.revoked {
    background-color: rgba(144, 147, 153, 0.15);
    color: #909399;
  }
}

.message-item.sent .message-status-badge {
  &.deleted {
    background-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 200, 200, 1);
  }

  &.revoked {
    background-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
  }
}

.empty-messages {
  text-align: center;
  padding: 40px;
}

.load-more {
  text-align: center;
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #2c3e50;
  flex-wrap: wrap;
}

.header-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.header-tags .el-tag {
  cursor: pointer;
}

.tag-input-popover {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.conversations-content::-webkit-scrollbar,
.messages-list::-webkit-scrollbar {
  width: 8px;
}

.conversations-content::-webkit-scrollbar-track,
.messages-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.conversations-content::-webkit-scrollbar-thumb,
.messages-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  border: 1px solid transparent;
  background-clip: content-box;
}

.conversations-content::-webkit-scrollbar-thumb:hover,
.messages-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
  background-clip: content-box;
}

/* 火狐浏览器滚动条样式 */
.conversations-content,
.messages-list {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* 消息输入区域样式 */
.message-input-area {
  border-top: 1px solid #e4e7ed;
  background-color: #fff;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 6px 15px;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 18px;
  border: 1px solid #dcdfe6;
  resize: none !important;
  padding: 6px 12px;
  line-height: 1.4;
  font-size: 14px;
  min-height: 32px !important;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.message-input :deep(.el-textarea__inner):focus {
  border-color: #409eff;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-actions .el-button {
  border-radius: 16px;
  padding: 4px 12px;
  height: 32px;
  font-weight: 500;
  font-size: 13px;
}

:deep(.el-card__body) {
  padding: 10px;
}

:deep(.header-card .el-card__body) {
  padding: 10px;
}

:deep(.stats-card .el-card__body) {
  padding: 15px;
}

/* 优化Element Plus的行间距 */
:deep(.el-row) {
  height: 100%;
  margin: 0 !important;
}

:deep(.el-col) {
  height: 100%;
  padding: 0 5px !important;
}

/* 确保没有额外的margins造成溢出 */
:deep(.el-card) {
  margin: 0 !important;
}

:deep(.el-card__header) {
  padding: 10px 0 !important;
  margin: 0 !important;
}

/* 翻译设置面板样式 */
.translation-settings-card {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.translation-settings {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  flex-shrink: 0;
}

.settings-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}

.control-item span {
  white-space: nowrap;
}

/* 翻译文本样式 */
.translated-text {
  margin-top: 8px;
  padding-top: 8px;
}

.translation-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  margin-bottom: 4px;
  opacity: 0.7;
}

.translation-content {
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.9;
}

.message-item.sent .translation-content {
  color: rgba(255, 255, 255, 0.95);
}

.message-item.received .translation-content {
  color: #606266;
}

.translating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
}

.translating .is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 图片预览样式 */
.image-preview-container {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background-color: #f5f7fa;
}

.preview-image-wrapper {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #ddd;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}

/* 修复图片查看器闪烁问题 */
:deep(.el-image-viewer__wrapper) {
  z-index: 3000 !important;
}

:deep(.el-image-viewer__mask) {
  opacity: 1 !important;
  animation: none !important;
  transition: none !important;
}

:deep(.el-image-viewer__canvas) {
  animation: none !important;
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
}

:deep(.el-image-viewer__img) {
  animation: none !important;
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
}

/* 禁用图片查看器的淡入淡出动画 */
:deep(.el-overlay) {
  animation: none !important;
  transition: none !important;
}

/* 推薦對話框樣式 */
.referral-dialog-content {
  min-height: 200px;
}
</style>
