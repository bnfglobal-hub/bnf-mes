export const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장",
  PENDING: "발주 접수",
  CONFIRMED: "본사 확정",
  PICKING: "피킹 중",
  PICKED: "피킹 완료",
  SHIPPED: "출고 완료",
  PARTIALLY_SHIPPED: "부분 출고",
  DELIVERED: "배송 완료",
  CANCEL_REQUESTED: "취소 요청",
  CANCELLED: "취소",
  REJECTED: "반려",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING: "bg-orange-50 text-orange-600",
  CONFIRMED: "bg-blue-50 text-blue-600",
  PICKING: "bg-violet-50 text-violet-600",
  PICKED: "bg-violet-100 text-violet-700",
  SHIPPED: "bg-emerald-50 text-emerald-600",
  PARTIALLY_SHIPPED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCEL_REQUESTED: "bg-red-50 text-red-500",
  CANCELLED: "bg-gray-100 text-gray-500",
  REJECTED: "bg-red-50 text-red-600",
};

export const ERP_STATUS_LABEL: Record<string, string> = {
  NOT_READY: "대기 전",
  QUEUED: "전송 대기",
  SYNCING: "전송 중",
  SUCCESS: "전송 완료",
  FAILED: "실패",
  RETRYING: "재시도 중",
  MANUAL_REVIEW: "수동 확인",
};

export const ERP_STATUS_COLOR: Record<string, string> = {
  NOT_READY: "bg-gray-100 text-gray-500",
  QUEUED: "bg-orange-50 text-orange-600",
  SYNCING: "bg-blue-50 text-blue-600",
  SUCCESS: "bg-emerald-50 text-emerald-600",
  FAILED: "bg-red-50 text-red-600",
  RETRYING: "bg-amber-50 text-amber-700",
  MANUAL_REVIEW: "bg-red-100 text-red-700",
};

export const STORAGE_LABEL: Record<string, string> = {
  ROOM: "상온",
  CHILLED: "냉장",
  FROZEN: "냉동",
};

export const STORAGE_COLOR: Record<string, string> = {
  ROOM: "bg-amber-50 text-amber-700",
  CHILLED: "bg-sky-50 text-sky-600",
  FROZEN: "bg-blue-50 text-blue-700",
};

export const CLAIM_TYPE_LABEL: Record<string, string> = {
  NOT_DELIVERED: "미배송",
  WRONG_ITEM: "오배송",
  SHORTAGE: "수량 부족",
  DAMAGED: "파손",
  THAWED: "해동",
  QUALITY: "품질 이상",
  EXPIRY: "유통기한",
  OTHER: "기타",
};

export const CLAIM_STATUS_LABEL: Record<string, string> = {
  RECEIVED: "접수",
  REVIEWING: "확인 중",
  PICKUP_PLANNED: "회수 예정",
  REDELIVERY_PLANNED: "재배송 예정",
  RESOLVED: "처리 완료",
  REJECTED: "반려",
};

export const CLAIM_RESOLUTION_LABEL: Record<string, string> = {
  REDELIVERY: "재배송",
  RETURN: "반품",
  REFUND: "환불",
  NEGOTIATE: "협의",
};

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "최고 관리자",
  hq_admin: "본사 관리자",
  warehouse: "창고 담당",
  franchise_owner: "가맹점주",
  franchise_staff: "가맹점 직원",
};

export const DOW_LABEL = ["일", "월", "화", "수", "목", "금", "토"];
