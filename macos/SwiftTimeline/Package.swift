// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "SwiftTimeline",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "SwiftTimeline",
            path: "Sources",
            resources: [
                .copy("Resources/public"),
                .copy("Resources/data")
            ]
        )
    ]
)
