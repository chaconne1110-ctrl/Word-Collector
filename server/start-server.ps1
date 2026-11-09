param([switch]$SetKey)

$ErrorActionPreference = 'Stop'
$wcEnvPath = Join-Path $PSScriptRoot '.env'

if ($SetKey -or -not (Test-Path -LiteralPath $wcEnvPath -PathType Leaf)) {
    $wcSecret = Read-Host 'Gemini API 키 입력 (화면에 표시되지 않음)' -AsSecureString
    $wcCredential = [System.Net.NetworkCredential]::new('', $wcSecret)
    $wcKey = $wcCredential.Password.Trim()
    try {
        if ($wcKey -notmatch '^[A-Za-z0-9_.=+\-]+$') {
            throw '키가 비어 있거나 형식이 올바르지 않습니다. AI Studio에서 복사한 키를 입력해 주세요.'
        }
        $wcLines = @()
        if (Test-Path -LiteralPath $wcEnvPath -PathType Leaf) {
            $wcLines = @([System.IO.File]::ReadAllLines($wcEnvPath) | Where-Object {
                $_ -notmatch '^\s*(?:export\s+)?GEMINI_API_KEY\s*='
            })
        }
        $wcLines += 'GEMINI_API_KEY=' + $wcKey
        [System.IO.File]::WriteAllLines($wcEnvPath, [string[]]$wcLines, [System.Text.UTF8Encoding]::new($false))
        Write-Host 'server/.env에 키를 저장했습니다. 이 파일은 GitHub에 올리지 마세요.'
    } finally {
        $wcKey = $null
        $wcCredential = $null
        $wcSecret.Dispose()
    }
}

$wcNode = Get-Command node -ErrorAction Stop
& $wcNode.Source (Join-Path $PSScriptRoot 'server.cjs')
