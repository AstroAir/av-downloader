**av-downloader**

***

# av-downloader

## Classes

- [CliValidationError](classes/CliValidationError.md)
- [DownloaderRuntimeError](classes/DownloaderRuntimeError.md)
- [HttpStatusError](classes/HttpStatusError.md)
- [PlaylistParseError](classes/PlaylistParseError.md)

## Type Aliases

- [CliFlagDefinition](type-aliases/CliFlagDefinition.md)
- [CliFlagName](type-aliases/CliFlagName.md)
- [DiscoveryResult](type-aliases/DiscoveryResult.md)
- [DownloaderOptions](type-aliases/DownloaderOptions.md)
- [DownloadPipelineResult](type-aliases/DownloadPipelineResult.md)
- [MasterPlaylistVariant](type-aliases/MasterPlaylistVariant.md)
- [MediaPlaylistParseResult](type-aliases/MediaPlaylistParseResult.md)
- [PipelineLogger](type-aliases/PipelineLogger.md)
- [RetryPolicy](type-aliases/RetryPolicy.md)
- [SegmentKeyInfo](type-aliases/SegmentKeyInfo.md)
- [SegmentPlanItem](type-aliases/SegmentPlanItem.md)

## Variables

- [cliExamples](variables/cliExamples.md)
- [cliFlags](variables/cliFlags.md)
- [cliName](variables/cliName.md)
- [downloaderDefaults](variables/downloaderDefaults.md)

## Functions

- [App](functions/App.md)
- [buildCliHelpText](functions/buildCliHelpText.md)
- [collectMediaCandidatesFromText](functions/collectMediaCandidatesFromText.md)
- [collectScriptSrcsFromHtml](functions/collectScriptSrcsFromHtml.md)
- [decryptAes128Cbc](functions/decryptAes128Cbc.md)
- [detectSniffPattern](functions/detectSniffPattern.md)
- [fetchBuffer](functions/fetchBuffer.md)
- [fetchText](functions/fetchText.md)
- [fetchWithRetry](functions/fetchWithRetry.md)
- [hasFfmpeg](functions/hasFfmpeg.md)
- [inferSequenceOffset](functions/inferSequenceOffset.md)
- [mapLimit](functions/mapLimit.md)
- [mergeFilesSequentially](functions/mergeFilesSequentially.md)
- [normalizeDiscoveredUrl](functions/normalizeDiscoveredUrl.md)
- [normalizeKeyBuffer](functions/normalizeKeyBuffer.md)
- [parseAttributeList](functions/parseAttributeList.md)
- [parseDownloaderOptions](functions/parseDownloaderOptions.md)
- [parseIv](functions/parseIv.md)
- [parseMasterPlaylist](functions/parseMasterPlaylist.md)
- [parseMediaPlaylist](functions/parseMediaPlaylist.md)
- [remuxTsToMp4](functions/remuxTsToMp4.md)
- [resolveSegmentKey](functions/resolveSegmentKey.md)
- [runDownloadPipeline](functions/runDownloadPipeline.md)
- [sequenceToIv](functions/sequenceToIv.md)
- [sleep](functions/sleep.md)
- [sniffMoreSegments](functions/sniffMoreSegments.md)
- [sortAndDedupeSegments](functions/sortAndDedupeSegments.md)
- [toRetryPolicy](functions/toRetryPolicy.md)
