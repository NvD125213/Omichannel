/** Trạng thái của một tin nhắn đang gửi (optimistic UI) */
export type PendingMessageStatus = "sending" | "failed";

export interface PendingMessage {
  /** ID tạm (opt-xxx), chỉ tồn tại ở phía client */
  id: string;
  content: string;
  /** Số file đính kèm */
  filesCount: number;
  created_at: string;
  status: PendingMessageStatus;
  conversationId: string;
  /** Hàm thử gửi lại khi thất bại */
  retry?: () => Promise<void>;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: "online" | "away" | "offline";
  lastSeen: string;
  role: string;
  department: string;
}

/** Trích dẫn tin đang phản hồi trong composer */
export interface ReplyDraft {
  messageId: string;
  preview: string;
  senderLabel: string;
}

export interface MessageAttachment {
  id?: string;
  message_id?: string;
  file_type?: string;
  extension?: string;
  data_url?: string;
  thumb_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface ChatMessage {
  id?: string;
  content?: string;
  inbox_id?: string;
  conversation_id?: string;
  message_type?: number;
  created_at?: string;
  updated_at?: string;
  private?: boolean;
  status?: string;
  source_id?: string;
  content_type?: string;
  content_attributes?: Record<string, unknown>;
  sender_type?: string;
  sender_id?: string;
  external_source_ids?: Record<string, unknown>;
  additional_attributes?: Record<string, unknown>;
  processed_message_content?: string;
  sentiment?: Record<string, unknown>;
  conversation?: {
    assignee_id?: string;
    unread_count?: number;
    last_activity_at?: string;
    contact_inbox?: {
      source_id?: string;
    };
  };
  attachments?: MessageAttachment[];
  sender?: {
    id: 1;
    name?: string;
    available_name?: string;
    avatar_url?: string;
    type?: string;
    availability_status?: string;
    thumbnail?: string;
  };
}

export interface SendMessageRequest {
  bcc_emails?: string;
  cc_emails?: string;
  echo_id?: string;
  content?: string;
  private?: boolean;
  to_emails?: string;
  attachments?: {
    account_id?: string;
    data_url?: string;
    extension?: any;
    file_size?: number;
    file_type?: string;
    height?: number;
    id?: string;
    message_id?: string;
    thumb_url?: string;
    width?: number;
  }[];
  content_attributes?: Record<string, unknown>;
  content_type?: string;
  conversation_id?: string;
  created_at?: string;
  sender: {
    id?: string;
    available_name?: string;
    avatar_url?: string;
    name?: string;
    thumbnail?: string;
    type?: string;
  };
  source_id?: string;
  status?: string;
}

export interface LastMessage {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
}

export interface ChatConversationMetaSender {
  id?: string;
  name?: string;
  identifier?: string;
  thumbnail?: string;
  availabilityStatus?: string;
  lastActivityAt?: string;
  createdAt?: string;
}

export interface ChatConversationMetaAssignee {
  id?: string;
  availableName?: string;
  name?: string;
  email?: string;
  role?: string;
  thumbnail?: string;
  availabilityStatus?: string;
}

export interface ChatConversationMeta {
  sender?: ChatConversationMetaSender;
  channel?: string;
  assignee?: ChatConversationMetaAssignee;
  assigneeType?: string;
  hmacVerified?: boolean;
}

export interface ChatConversation {
  id: string;
  type: "direct" | "group";
  participants: string[];
  name: string;
  avatar: string;
  lastMessage: LastMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  /** Trạng thái hội thoại Chatwoot: open, resolved, pending, ... */
  status?: string;
  labels: string[];
  /** Khớp `inbox_id` từ API conversations ↔ `id` trong danh sách inboxes */
  inboxId?: number;
  meta?: ChatConversationMeta;
}

export interface ChatState {
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  users: ChatUser[];
  selectedConversation: string | null;
  searchQuery: string;
  isTyping: Record<string, boolean>;
  onlineUsers: string[];
}

export interface ChatActions {
  setConversations: (conversations: ChatConversation[]) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  setUsers: (users: ChatUser[]) => void;
  setSelectedConversation: (conversationId: string | null) => void;
  setSearchQuery: (query: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  markAsRead: (conversationId: string) => void;
  togglePin: (conversationId: string) => void;
  toggleMute: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  setOnlineUsers: (userIds: string[]) => void;
}
