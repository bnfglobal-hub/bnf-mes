/** 이카운트 연동 공통 타입. 서버 전용 코드에서만 import 한다. */

export interface EcountOrderLine {
  itemCode: string;
  qty: number;
  unitPrice: number;
  supplyAmount: number;
  vatAmount: number;
  warehouseCode: string;
  remark?: string;
}

export interface EcountOrderPayload {
  idempotencyKey: string;   // 내부 주문번호 기반
  orderNo: string;          // BNF-YYYYMMDD-00001
  customerCode: string;     // 이카운트 거래처코드
  orderDate: string;        // YYYYMMDD
  lines: EcountOrderLine[];
  memo?: string;
  deliveryNote?: string;
}

export interface EcountPushResult {
  ok: boolean;
  docNo?: string;           // 이카운트 전표번호
  errorCode?: string;
  errorMessage?: string;
  /** true면 성공/실패 불명확(타임아웃 등) → 재전송 금지, 수동확인 */
  indeterminate?: boolean;
  raw?: unknown;
}

export interface EcountItem {
  itemCode: string;
  itemName: string;
  spec?: string;
  unit?: string;
}

export interface EcountStockRow {
  itemCode: string;
  warehouseCode: string;
  qty: number;
}

export interface EcountClient {
  readonly mode: "MOCK" | "REAL";
  testConnection(): Promise<{ ok: boolean; message: string }>;
  pushOrder(payload: EcountOrderPayload): Promise<EcountPushResult>;
  /** 판매 입력 (출고 완료 시 정책에 따라 사용) */
  pushSale(payload: EcountOrderPayload): Promise<EcountPushResult>;
  fetchItems(): Promise<EcountItem[]>;
  fetchStocks(): Promise<EcountStockRow[]>;
  /** idempotencyKey 로 기존 등록 여부 조회 (불명확 상태 해소용) */
  findOrderByKey(key: string): Promise<{ found: boolean; docNo?: string }>;
}
