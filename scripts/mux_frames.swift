import AppKit
import AVFoundation
import CoreVideo
import Foundation

let args = CommandLine.arguments
guard args.count == 7 else {
    fputs("usage: mux_frames <framesDir> <audioWav> <outputMp4> <width> <height> <fps>\n", stderr)
    exit(2)
}

let framesDir = URL(fileURLWithPath: args[1])
let audioURL = URL(fileURLWithPath: args[2])
let outputURL = URL(fileURLWithPath: args[3])
let width = Int(args[4])!
let height = Int(args[5])!
let fps = Int32(args[6])!
let tempVideoURL = outputURL.deletingLastPathComponent().appendingPathComponent("flash_ad_video_only.mov")

try? FileManager.default.removeItem(at: outputURL)
try? FileManager.default.removeItem(at: tempVideoURL)

func makePixelBuffer(from url: URL, width: Int, height: Int, pool: CVPixelBufferPool?) -> CVPixelBuffer? {
    guard let image = NSImage(contentsOf: url),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
    else {
        return nil
    }

    var buffer: CVPixelBuffer?
    let status: CVReturn
    if let pool {
        status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
    } else {
        let attrs: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true,
            kCVPixelBufferWidthKey: width,
            kCVPixelBufferHeightKey: height,
            kCVPixelBufferPixelFormatTypeKey: kCVPixelFormatType_32BGRA
        ]
        status = CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA, attrs as CFDictionary, &buffer)
    }
    guard status == kCVReturnSuccess, let pixelBuffer = buffer else {
        return nil
    }

    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

    guard let ctx = CGContext(
        data: CVPixelBufferGetBaseAddress(pixelBuffer),
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
        return nil
    }

    ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
    return pixelBuffer
}

let frameURLs = try FileManager.default.contentsOfDirectory(
    at: framesDir,
    includingPropertiesForKeys: nil
).filter { $0.lastPathComponent.hasPrefix("frame_") && $0.pathExtension == "png" }
 .sorted { $0.lastPathComponent < $1.lastPathComponent }

guard !frameURLs.isEmpty else {
    fputs("no PNG frames found\n", stderr)
    exit(3)
}

let writer = try AVAssetWriter(outputURL: tempVideoURL, fileType: .mov)
let videoSettings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.proRes422,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 60_000_000
    ]
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height
])

guard writer.canAdd(input) else {
    fputs("cannot add video input\n", stderr)
    exit(4)
}
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

for (index, url) in frameURLs.enumerated() {
    while !input.isReadyForMoreMediaData {
        Thread.sleep(forTimeInterval: 0.005)
    }
    guard let pixelBuffer = makePixelBuffer(from: url, width: width, height: height, pool: adaptor.pixelBufferPool) else {
        fputs("failed to read frame \(url.path)\n", stderr)
        exit(5)
    }
    let time = CMTime(value: CMTimeValue(index), timescale: fps)
    if !adaptor.append(pixelBuffer, withPresentationTime: time) {
        fputs("failed to append frame \(index): \(String(describing: writer.error))\n", stderr)
        exit(6)
    }
    if index % 60 == 0 {
        print("encoded \(index)/\(frameURLs.count)")
    }
}

input.markAsFinished()
let writingGroup = DispatchGroup()
writingGroup.enter()
writer.finishWriting {
    writingGroup.leave()
}
writingGroup.wait()
if writer.status != .completed {
    fputs("video writer failed: \(String(describing: writer.error))\n", stderr)
    exit(7)
}

let composition = AVMutableComposition()
let videoAsset = AVURLAsset(url: tempVideoURL)
let audioAsset = AVURLAsset(url: audioURL)
guard let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
      let compVideo = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
else {
    fputs("failed to load rendered video track\n", stderr)
    exit(8)
}
let videoRange = CMTimeRange(start: .zero, duration: videoAsset.duration)
try compVideo.insertTimeRange(videoRange, of: sourceVideo, at: .zero)
compVideo.preferredTransform = sourceVideo.preferredTransform

if let sourceAudio = audioAsset.tracks(withMediaType: .audio).first,
   let compAudio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
    let audioRange = CMTimeRange(start: .zero, duration: min(audioAsset.duration, videoAsset.duration))
    try compAudio.insertTimeRange(audioRange, of: sourceAudio, at: .zero)
}

guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetPassthrough) else {
    fputs("failed to create exporter\n", stderr)
    exit(9)
}
exporter.outputURL = outputURL
exporter.outputFileType = .mov
exporter.shouldOptimizeForNetworkUse = true

let exportGroup = DispatchGroup()
exportGroup.enter()
exporter.exportAsynchronously {
    exportGroup.leave()
}
exportGroup.wait()

if exporter.status != .completed {
    fputs("export failed: \(String(describing: exporter.error))\n", stderr)
    exit(10)
}

print("output: \(outputURL.path)")
