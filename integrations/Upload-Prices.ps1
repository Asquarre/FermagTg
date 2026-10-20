param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [Parameter(Mandatory=$true)][string]$ConfigPath
)
$ErrorActionPreference = 'Stop'
try {
    $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    $uri = [Uri]$config.url
    if ($uri.Scheme -ne 'https' -and -not ($uri.Scheme -eq 'http' -and $uri.Host -in @('127.0.0.1', 'localhost'))) {
        throw 'HTTPS required.'
    }
    if ($config.key.Length -lt 32 -or $uri.AbsolutePath -ne '/api/catalog-sync' -or $uri.Query -or $uri.UserInfo) {
        throw 'Invalid upload configuration.'
    }
    if ([IO.Path]::GetExtension($FilePath) -ne '.xlsx') { throw 'An .xlsx file is required.' }
    $before = Get-Item -LiteralPath $FilePath
    if ($before.Length -lt 1 -or $before.Length -gt 2097152) { throw 'File must be 1 byte to 2 MiB.' }
    $sourceTime = $before.LastWriteTimeUtc
    # Deny writers while taking the upload snapshot; never send a half-written workbook.
    $stream = [IO.File]::Open($FilePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
    try {
        $memory = New-Object IO.MemoryStream
        try { $stream.CopyTo($memory); $bytes = $memory.ToArray() }
        finally { $memory.Dispose() }
    } finally { $stream.Dispose() }
    $after = Get-Item -LiteralPath $FilePath
    if ($after.LastWriteTimeUtc -ne $sourceTime -or $after.Length -ne $bytes.Length) { throw 'File changed during read. Retry later.' }
    $headers = @{
        Authorization = 'Bearer ' + $config.key
        'X-Catalog-Updated-At' = $sourceTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'")
    }
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -ContentType 'application/octet-stream' -Body $bytes -TimeoutSec 90 -UseBasicParsing -MaximumRedirection 0
            $result = $response.Content | ConvertFrom-Json
            if (-not $result.ok) { throw 'Server did not confirm the upload.' }
            Write-Output ("Prices accepted: matched={0}, unchanged={1}, sourceUpdatedAt={2}" -f $result.matchedProducts, $result.unchanged, $result.sourceUpdatedAt)
            exit 0
        } catch {
            $status = 0
            if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
            if ($status -in @(400, 401, 403, 409, 413, 415, 422) -or $attempt -eq 3) {
                # Do not log configuration, request headers or the secret.
                [Console]::Error.WriteLine(("Price upload failed (HTTP {0}). Previous prices remain active." -f $status))
                if ($_.ErrorDetails.Message) {
                    try {
                        $message = [string](($_.ErrorDetails.Message | ConvertFrom-Json).error)
                        if ($message) { [Console]::Error.WriteLine($message.Substring(0, [Math]::Min($message.Length, 500))) }
                    } catch { }
                }
                exit 1
            }
            Start-Sleep -Seconds (5 * $attempt)
        }
    }
} catch {
    [Console]::Error.WriteLine('Upload not completed. Check file access, XLSX format and private configuration. Do not publish the configuration file.')
    exit 1
}
