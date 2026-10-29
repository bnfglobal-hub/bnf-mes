# BNF 업무폰 앱 빌드 → 저장소 루트 bnf-phone.apk (GitHub Pages로 배포: /bnf-mes/bnf-phone.apk)
# 도구: 문서\bnf-phone-tools (JDK 17, Gradle 8.9, 안드로이드 SDK 34) / 서명 키: 문서\bnf-phone-signing (저장소에 올리지 않음)
# 업데이트를 낼 때는 build.gradle의 versionCode를 1 올리고 실행
$ErrorActionPreference = 'Stop'
$T = Join-Path $env:USERPROFILE 'Documents\bnf-phone-tools'
$env:JAVA_HOME = (Get-ChildItem $T -Directory -Filter 'jdk-17*' | Select-Object -First 1).FullName
$env:ANDROID_HOME = Join-Path $T 'sdk'
$gradle = Join-Path $T 'gradle-8.9\bin\gradle.bat'
Push-Location $PSScriptRoot
try {
    & $gradle assembleRelease --no-daemon -q
    if ($LASTEXITCODE -ne 0) { throw "빌드 실패" }
    Copy-Item 'build\outputs\apk\release\bnf-phone-release.apk' '..\bnf-phone.apk' -Force
    Write-Output ("OK " + (Get-Item '..\bnf-phone.apk').Length + " bytes")
} finally { Pop-Location }
