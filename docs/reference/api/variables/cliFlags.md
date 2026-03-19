[**av-downloader**](../README.md)

***

[av-downloader](../README.md) / cliFlags

# Variable: cliFlags

> `const` **cliFlags**: `object`

Defined in: [source/cli-metadata.ts:12](https://github.com/AstroAir/react-cli-quick-starter/blob/main/source/cli-metadata.ts#L12)

## Type Declaration

### concurrency

> `readonly` **concurrency**: `object`

#### concurrency.default

> `readonly` **default**: `12` = `downloaderDefaults.concurrency`

#### concurrency.description

> `readonly` **description**: `"Concurrent segment downloads (>=1)."` = `'Concurrent segment downloads (>=1).'`

#### concurrency.shortFlag

> `readonly` **shortFlag**: `"c"` = `'c'`

#### concurrency.type

> `readonly` **type**: `"number"` = `'number'`

### endSequence

> `readonly` **endSequence**: `object`

#### endSequence.default

> `readonly` **default**: `0` = `downloaderDefaults.endSequence`

#### endSequence.description

> `readonly` **description**: `"Optional ending segment sequence filter (>=0)."` = `'Optional ending segment sequence filter (>=0).'`

#### endSequence.type

> `readonly` **type**: `"number"` = `'number'`

### keepMergedTs

> `readonly` **keepMergedTs**: `object`

#### keepMergedTs.default

> `readonly` **default**: `false` = `downloaderDefaults.keepMergedTs`

#### keepMergedTs.description

> `readonly` **description**: `"Keep merged.ts in workdir after completion for debugging or remux replay."` = `'Keep merged.ts in workdir after completion for debugging or remux replay.'`

#### keepMergedTs.type

> `readonly` **type**: `"boolean"` = `'boolean'`

### keyUrl

> `readonly` **keyUrl**: `object`

#### keyUrl.description

> `readonly` **description**: `"Override AES-128 key URL."` = `'Override AES-128 key URL.'`

#### keyUrl.type

> `readonly` **type**: `"string"` = `'string'`

### maxMiss

> `readonly` **maxMiss**: `object`

#### maxMiss.default

> `readonly` **default**: `8` = `downloaderDefaults.maxMisses`

#### maxMiss.description

> `readonly` **description**: `"Stop sniffing after this many misses."` = `'Stop sniffing after this many misses.'`

#### maxMiss.type

> `readonly` **type**: `"number"` = `'number'`

### out

> `readonly` **out**: `object`

#### out.default

> `readonly` **default**: `"output.mp4"` = `downloaderDefaults.out`

#### out.description

> `readonly` **description**: `"Output mp4 path."` = `'Output mp4 path.'`

#### out.shortFlag

> `readonly` **shortFlag**: `"o"` = `'o'`

#### out.type

> `readonly` **type**: `"string"` = `'string'`

### overwrite

> `readonly` **overwrite**: `object`

#### overwrite.default

> `readonly` **default**: `false` = `downloaderDefaults.overwrite`

#### overwrite.description

> `readonly` **description**: `"Allow replacing an existing output file. Use --no-overwrite to enforce safe writes."` = `'Allow replacing an existing output file. Use --no-overwrite to enforce safe writes.'`

#### overwrite.type

> `readonly` **type**: `"boolean"` = `'boolean'`

### pageUrl

> `readonly` **pageUrl**: `object`

#### pageUrl.description

> `readonly` **description**: `"Page URL used for media URL discovery (typed, pasted, or interactive prompt input)."` = `'Page URL used for media URL discovery (typed, pasted, or interactive prompt input).'`

#### pageUrl.shortFlag

> `readonly` **shortFlag**: `"p"` = `'p'`

#### pageUrl.type

> `readonly` **type**: `"string"` = `'string'`

### referer

> `readonly` **referer**: `object`

#### referer.description

> `readonly` **description**: `"Override HTTP Referer header."` = `'Override HTTP Referer header.'`

#### referer.type

> `readonly` **type**: `"string"` = `'string'`

### retries

> `readonly` **retries**: `object`

#### retries.default

> `readonly` **default**: `3` = `downloaderDefaults.retries`

#### retries.description

> `readonly` **description**: `"Retries per request (>=0)."` = `'Retries per request (>=0).'`

#### retries.type

> `readonly` **type**: `"number"` = `'number'`

### retryBackoff

> `readonly` **retryBackoff**: `object`

#### retryBackoff.default

> `readonly` **default**: `250` = `downloaderDefaults.retryBackoffMs`

#### retryBackoff.description

> `readonly` **description**: `"Base backoff delay in milliseconds for retries (>=0)."` = `'Base backoff delay in milliseconds for retries (>=0).'`

#### retryBackoff.type

> `readonly` **type**: `"number"` = `'number'`

### scriptLimit

> `readonly` **scriptLimit**: `object`

#### scriptLimit.default

> `readonly` **default**: `20` = `downloaderDefaults.scriptLimit`

#### scriptLimit.description

> `readonly` **description**: `"Max script files inspected during page discovery."` = `'Max script files inspected during page discovery.'`

#### scriptLimit.type

> `readonly` **type**: `"number"` = `'number'`

### sniff

> `readonly` **sniff**: `object`

#### sniff.default

> `readonly` **default**: `true` = `downloaderDefaults.sniff`

#### sniff.description

> `readonly` **description**: `"Enable sequential segment sniffing. Use --no-sniff to disable. Warnings are shown in both interactive and non-interactive modes."` = `'Enable sequential segment sniffing. Use --no-sniff to disable. Warnings are shown in both interactive and non-interactive modes.'`

#### sniff.type

> `readonly` **type**: `"boolean"` = `'boolean'`

### startSequence

> `readonly` **startSequence**: `object`

#### startSequence.default

> `readonly` **default**: `0` = `downloaderDefaults.startSequence`

#### startSequence.description

> `readonly` **description**: `"Optional starting segment sequence filter (>=0)."` = `'Optional starting segment sequence filter (>=0).'`

#### startSequence.type

> `readonly` **type**: `"number"` = `'number'`

### timeout

> `readonly` **timeout**: `object`

#### timeout.default

> `readonly` **default**: `15000` = `downloaderDefaults.timeoutMs`

#### timeout.description

> `readonly` **description**: `"Request timeout in milliseconds (>=1)."` = `'Request timeout in milliseconds (>=1).'`

#### timeout.type

> `readonly` **type**: `"number"` = `'number'`

### url

> `readonly` **url**: `object`

#### url.description

> `readonly` **description**: `"Direct m3u8 playlist URL (typed, pasted, or interactive prompt input)."` = `'Direct m3u8 playlist URL (typed, pasted, or interactive prompt input).'`

#### url.shortFlag

> `readonly` **shortFlag**: `"u"` = `'u'`

#### url.type

> `readonly` **type**: `"string"` = `'string'`

### userAgent

> `readonly` **userAgent**: `object`

#### userAgent.default

> `readonly` **default**: `"av-downloader/0.0"` = `downloaderDefaults.userAgent`

#### userAgent.description

> `readonly` **description**: `"Override HTTP User-Agent header."` = `'Override HTTP User-Agent header.'`

#### userAgent.type

> `readonly` **type**: `"string"` = `'string'`

### workdir

> `readonly` **workdir**: `object`

#### workdir.default

> `readonly` **default**: `"tmp_download"` = `downloaderDefaults.workdir`

#### workdir.description

> `readonly` **description**: `"Temporary working directory."` = `'Temporary working directory.'`

#### workdir.type

> `readonly` **type**: `"string"` = `'string'`
