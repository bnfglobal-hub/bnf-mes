/** 지도 임베드 — API 키 없이 동작하는 구글맵 임베드 + 네이버/카카오 지도 바로가기.
 *  (원본 사이트는 카카오맵 SDK를 썼으나 JS 키가 필요해, 키 없이 되는 방식으로 대체) */
export default function LocationMap({
  address,
  label,
  height = 300,
  className = "",
}: {
  address: string;
  label: string;
  /** 지도 영역 높이(px). 아래 링크 줄은 이 높이에 포함되지 않는다. */
  height?: number;
  className?: string;
}) {
  const q = encodeURIComponent(address);
  return (
    <div className={className}>
      <div className="w-full border border-line" style={{ height }}>
        <iframe
          title={`${label} 위치 지도 — ${address}`}
          src={`https://maps.google.com/maps?q=${q}&hl=ko&z=16&output=embed`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="mt-2.5 flex gap-4 text-[12.5px] font-bold">
        <a
          href={`https://map.naver.com/p/search/${q}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted transition-colors hover:text-brand"
        >
          네이버 지도 ↗
        </a>
        <a
          href={`https://map.kakao.com/link/search/${q}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted transition-colors hover:text-brand"
        >
          카카오맵 ↗
        </a>
      </div>
    </div>
  );
}
