// Описываем одно событие из БД, после декодирования бинарных полей
export interface MessageEvent {
  id: bigint;
  refid: bigint;
  uid: number | null;
  src: number | null;
  gid: number | null;
  flags: number | null;
  ts: bigint;
  expiry: number | null;
  type: number | null;
  k: number | null;
  latitude: number | null;
  longitude: number | null;
  title: string;
  subtitle: string;
  body: string;
  url: string;
  message: string;
  status: number | null;
  rich: number | null;
  sd: boolean | null;
  ud: boolean | null;
}

export interface MesiboWebhookRequest {
  secret: string;
  type: string | null;
  events: MessageEvent[];
}

export type MesiboWebhookResponse = boolean;

// types/mesibo.ts

export interface MesiboGroupMemberPermissions {
  send: boolean;
  recv: boolean;
  pub: boolean;
  sub: boolean;
  list: boolean;
}

export interface MesiboGroupMember {
  uid: number;
  address: string;
  permissions: MesiboGroupMemberPermissions;
}

export interface MesiboGroupGetMembersResponse {
  count: number;
  gid: number;
  members: MesiboGroupMember[];
  op: 'groupgetmembers';
  result: true;
}

export interface MesiboGroupGetMembersRequest {
  op: 'groupgetmembers';
  token: string;
  count: number;
  group: { gid: number };
}

// Mesibo Token Configuration (supports both v1 and v2)
export interface MesiboTokenV2Config {
  // Core parameters (v1 and v2)
  expiry: number;          // Token expiry in MINUTES
  autorefresh?: number;    // Auto-refresh interval in MINUTES (default: 0)

  // v1 parameters
  appid?: string;          // App ID (v1 format or v2 fallback)

  // v2 format flag
  v2?: boolean;            // Enable v2 format (default: false)

  // v2 platform parameters
  android?: boolean;       // Enable Android platform
  ios?: boolean;           // Enable iOS platform
  javascript?: boolean;    // Enable JavaScript/Web platform
  python?: boolean;        // Enable Python platform
  cpp?: boolean;           // Enable C++ platform

  // v2 platform-specific identifiers
  package?: string;        // Android package name (also enables android)
  bundle?: string;         // iOS Bundle ID (also enables ios)
  url?: string;            // URL restriction for JavaScript

  // Multi-device parameters
  device?: string;         // Unique device identifier
  linkto?: string;         // Link to another user

  // Token removal (for deleteUserToken)
  remove?: boolean;        // Remove token flag
}

export interface MesiboUserAddRequest {
  op: 'useradd';
  token: string;
  user: {
    address: number | string;
    name?: string;
    permissions?: {
      retention?: boolean;
      incoming?: boolean;
      outgoing?: boolean;
      calls?: boolean;
      turn?: boolean;
      storage?: boolean;
      groupCreate?: boolean;
      webhook?: boolean;
      peers?: number;
    };
    token: MesiboTokenV2Config;
  };
}

export interface MesiboUserAddResponse {
  result: boolean;
  user: {
    uid: number;
    token: string;
  };
}
