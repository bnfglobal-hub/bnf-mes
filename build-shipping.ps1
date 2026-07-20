# ═══════════════════════════════════════════════════════════════
# 출고계획.html 생성 스크립트
#   index.html(MES)에서 출고 계획 기능을 그대로 추출해
#   독립 실행형 웹페이지(shipping.html)를 만듭니다.
#   → MES 코드가 바뀌면 이 스크립트를 다시 실행하면 됩니다.
#      실행:  powershell -ExecutionPolicy Bypass -File build-shipping.ps1
# ═══════════════════════════════════════════════════════════════
$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot 'index.html'
$out = Join-Path $PSScriptRoot 'shipping.html'
$lines = [IO.File]::ReadAllLines($src, [Text.UTF8Encoding]::new($false))

function Get-Block([string[]]$L, [string]$startPattern, [scriptblock]$isEnd) {
  $s = -1
  for ($i = 0; $i -lt $L.Count; $i++) { if ($L[$i] -match $startPattern) { $s = $i; break } }
  if ($s -lt 0) { throw "시작 지점을 찾지 못함: $startPattern" }
  for ($j = $s + 1; $j -lt $L.Count; $j++) { if (& $isEnd $L[$j]) { return $L[$s..$j] } }
  throw "끝 지점을 찾지 못함: $startPattern"
}

# 1) 스타일 블록 (<style> ... </style>)
$style = Get-Block $lines '^<style>' { param($x) $x -match '^</style>' }

# 2) 공용 헬퍼 (한 줄짜리 유틸)
$helperNames = @('fN')
$helpers = @()
foreach ($h in $helperNames) {
  $line = $lines | Where-Object { $_ -match "^const $h=" } | Select-Object -First 1
  if (-not $line) { throw "헬퍼를 찾지 못함: $h" }
  $helpers += $line
}

# 3) exportXL 헬퍼
$exportXL = Get-Block $lines '^const exportXL=' { param($x) $x -match '^\};' }

# 4) PageShipSort 컴포넌트 (다음 최상위 function 직전까지)
$s = -1
for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match '^function PageShipSort\(') { $s = $i; break } }
if ($s -lt 0) { throw 'PageShipSort를 찾지 못했습니다' }
$e = -1
for ($j = $s + 1; $j -lt $lines.Count; $j++) { if ($lines[$j] -match '^function ') { $e = $j - 1; break } }
if ($e -lt 0) { throw 'PageShipSort의 끝을 찾지 못했습니다' }
while ($e -gt $s -and [string]::IsNullOrWhiteSpace($lines[$e])) { $e-- }
$shipSort = $lines[$s..$e]

# 5) Supabase 접속 정보 (MES와 동일한 DB를 사용해 데이터 공유)
$sbUrl = ($lines | Where-Object { $_ -match "^const SB_URL=" } | Select-Object -First 1)
$sbKey = ($lines | Where-Object { $_ -match "^const SB_KEY=" } | Select-Object -First 1)
if (-not $sbUrl -or -not $sbKey) { throw 'Supabase 설정을 찾지 못했습니다' }

# 6) 의존성 검증: PageShipSort가 쓰는 최상위 정의가 모두 포함됐는지 확인
$provided = @('R','sbClient','SB_URL','SB_KEY','exportXL','useState','useRef','useEffect','useMemo','ReactDOM','React') + $helperNames
$topLevel = @{}
foreach ($l in $lines) { if ($l -match '^(?:const|function|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)') { $topLevel[$Matches[1]] = $true } }
$ssText = ($shipSort -join "`n")
# 주석 제거 후 식별자 검사 (주석 속 컴포넌트명 오탐 방지)
$ssCode = [regex]::Replace($ssText, '/\*[\s\S]*?\*/', ' ')
$missing = @()
foreach ($name in $topLevel.Keys) {
  if ($provided -contains $name) { continue }
  if ($ssCode -match "(?<![A-Za-z0-9_$])$([regex]::Escape($name))(?![A-Za-z0-9_$])") {
    # PageShipSort 내부에서 자체 정의한 이름은 제외
    if ($ssCode -notmatch "(?:const|let|var|function)\s+$([regex]::Escape($name))\b") { $missing += $name }
  }
}
if ($missing.Count -gt 0) {
  throw ("빠진 의존성이 있습니다: " + ($missing -join ', ') + "`n  → build-shipping.ps1 의 `$helperNames 에 추가하세요.")
}

$head = @'
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#D94F1E">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="출고 계획">
<link rel="manifest" href="./shipping-manifest.json">
<link rel="apple-touch-icon" href="./icon-512.png">
<title>출고 계획 · B&F Global</title>
'@

$tailScripts = @'
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
const {useState,useRef,useEffect,useMemo}=React;
const R=React.createElement;
'@

$appCode = @'

/* ═══ 카카오톡 등에서 "보내기(공유)"로 받은 PDF 처리 ═══
   서비스워커가 공유 파일을 임시 보관 → 여기서 꺼내 자동 입력합니다. */
const SHARE_CACHE='bnf-shipping-share-v1';
const SHARE_PREFIX='/__bnf_shared__/';
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw-shipping.js').catch(()=>{});
  });
}
async function pickupSharedFiles(){
  try{
    if(!('caches' in window))return[];
    const cache=await caches.open(SHARE_CACHE);
    const cntRes=await cache.match(SHARE_PREFIX+'count');
    if(!cntRes)return[];
    const n=parseInt(await cntRes.text(),10)||0;
    const out=[];
    for(let i=0;i<n;i++){
      const res=await cache.match(SHARE_PREFIX+i);
      if(!res)continue;
      const blob=await res.blob();
      let name='공유파일'+(i+1)+'.pdf';
      try{const h=res.headers.get('x-bnf-filename');if(h)name=decodeURIComponent(h);}catch(e){}
      if(!/\.pdf$/i.test(name))name=name+'.pdf';
      out.push(new File([blob],name,{type:blob.type||'application/pdf'}));
    }
    /* 한 번 꺼내면 정리 (새로고침 시 중복 입력 방지) */
    for(const key of await cache.keys()){if(key.url.indexOf(SHARE_PREFIX)!==-1)await cache.delete(key);}
    return out;
  }catch(e){return[];}
}

/* ═══ 독립 실행형 앱: MES와 같은 DB를 사용하므로 데이터가 자동 공유됩니다 ═══ */
function ShippingApp(){
  const[mats,setMats]=useState([]);
  const[hqItems,setHqItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[err,setErr]=useState('');
  const[shareMsg,setShareMsg]=useState('');

  const load=()=>{
    sbClient.from('app_state').select('state_data').eq('id',1).maybeSingle()
      .then(({data,error})=>{
        if(error)throw error;
        const sd=(data&&data.state_data)||{};
        setMats(Array.isArray(sd.mats)?sd.mats:[]);
        setHqItems(Array.isArray(sd.hqItems)?sd.hqItems:[]);
        setLoading(false);
      })
      .catch(e=>{setErr(e.message||'연결 실패');setLoading(false);});
  };
  useEffect(()=>{
    load();
    const onVis=()=>{if(!document.hidden)load();};
    document.addEventListener('visibilitychange',onVis);
    return()=>document.removeEventListener('visibilitychange',onVis);
  },[]);

  /* 공유로 들어온 PDF를 재고 로딩 후 자동 입력 */
  useEffect(()=>{
    if(loading||err)return;
    let done=false;
    const run=async()=>{
      const files=await pickupSharedFiles();
      if(done||!files.length)return;
      setShareMsg('📥 카톡에서 받은 '+files.length+'개 파일을 정리하는 중...');
      window.dispatchEvent(new CustomEvent('bnf-shared-files',{detail:files}));
      setTimeout(()=>setShareMsg(''),6000);
      /* 주소창의 ?shared=1 정리 */
      try{history.replaceState(null,'',location.pathname);}catch(e){}
    };
    run();
    return()=>{done=true;};
  },[loading,err]);

  return R('div',{className:'app'},
    R('div',{className:'hdr'},
      R('div',{style:{display:'flex',alignItems:'center',gap:9,minWidth:0}},
        R('div',{style:{width:30,height:30,borderRadius:9,background:'linear-gradient(135deg,#EE6231,#D94F1E)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}},'📦'),
        R('div',{style:{minWidth:0}},
          R('div',{style:{fontSize:14,fontWeight:800,whiteSpace:'nowrap'}},'출고 계획'),
          R('div',{style:{fontSize:9.5,color:'var(--tm)',whiteSpace:'nowrap'}},'B&F Global · 센터별 출고 정리')
        )
      ),
      R('div',{style:{flex:1}}),
      R('button',{onClick:()=>{setLoading(true);load();},title:'최신 재고 다시 불러오기',
        style:{background:'#F2EEF6',border:'1px solid #E5DEEC',borderRadius:8,padding:'6px 11px',fontSize:11,fontWeight:700,color:'#6B6B6B',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}},'↻ 새로고침')
    ),
    shareMsg&&R('div',{style:{background:'#ECFDF5',borderBottom:'1px solid #A7F3D0',color:'#15803D',fontSize:12,fontWeight:700,padding:'8px 14px',flexShrink:0}},shareMsg),
    R('div',{className:'body'},
      R('div',{className:'main'},
        loading
          ? R('div',{className:'pg'},R('div',{className:'empty'},R('div',{className:'empty-ic'},'⏳'),'재고 정보를 불러오는 중...'))
          : err
            ? R('div',{className:'pg'},R('div',{className:'empty'},R('div',{className:'empty-ic'},'⚠️'),
                R('div',{style:{fontWeight:700,color:'var(--err)'}},'서버 연결 실패'),
                R('div',{style:{fontSize:11,marginTop:6}},err),
                R('button',{className:'btn bp',style:{marginTop:14},onClick:()=>{setErr('');setLoading(true);load();}},'다시 시도'))
              )
            : R(PageShipSort,{mats,hqItems})
      )
    )
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(R(ShippingApp));
</script>
</body>
</html>
'@

$sb = @"
$sbUrl
$sbKey
const sbClient=supabase.createClient(SB_URL,SB_KEY);
"@

$parts = @()
$parts += $head
$parts += ($style -join "`n")
$parts += '</head>'
$parts += '<body>'
$parts += '<div id="root"></div>'
$parts += $tailScripts
$parts += $sb
$parts += ($helpers -join "`n")
$parts += ($exportXL -join "`n")
$parts += ''
$parts += ($shipSort -join "`n")
$parts += $appCode

$html = ($parts -join "`n")
[IO.File]::WriteAllText($out, $html, [Text.UTF8Encoding]::new($false))

$kb = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Host "생성 완료: shipping.html ($kb KB)" -ForegroundColor Green
Write-Host ("  - 스타일 {0}줄 / 출고계획 {1}줄" -f $style.Count, $shipSort.Count)
