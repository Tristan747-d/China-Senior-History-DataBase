import Foundation
#if canImport(Glibc)
import Glibc
#endif

// 内嵌 HTTP 服务器：与 server.js 同构的路由（静态资源 + events API）
// 数据文件放在 Application Support，首启从 bundle 复制
final class TimelineServer {
    static let shared = TimelineServer()
    private var server: HTTPServer?
    private(set) var port: UInt16 = 0

    static var dataDir: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("SwiftTimeline", isDirectory: true)
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        return base
    }

    var eventsURL: URL { Self.dataDir.appendingPathComponent("events.json") }
    var timemapURL: URL { Self.dataDir.appendingPathComponent("timemap.json") }

    func start() throws {
        // 首启从 bundle 复制数据
        if !FileManager.default.fileExists(atPath: eventsURL.path) {
            if let bundled = Bundle.module.url(forResource: "events", withExtension: "json", subdirectory: "data") {
                try? FileManager.default.copyItem(at: bundled, to: eventsURL)
            }
        }
        if !FileManager.default.fileExists(atPath: timemapURL.path) {
            if let bundled = Bundle.module.url(forResource: "timemap", withExtension: "json", subdirectory: "data") {
                try? FileManager.default.copyItem(at: bundled, to: timemapURL)
            }
        }

        let http = HTTPServer { [weak self] req in self?.handle(req) ?? HTTPResponse(status: 500, body: Data(), mime: "text/plain") }
        // 绑定随机可用端口
        let chosen = try http.listen(port: 0)
        port = chosen
        server = http
        NSLog("SwiftTimeline server listening on \(chosen)")
    }

    // MARK: - 路由
    private func handle(_ req: HTTPRequest) -> HTTPResponse {
        switch (req.method, req.path) {
        case ("GET", "/"), ("GET", "/index.html"):
            return staticFile("public/index.html", mime: "text/html; charset=utf-8")
        case ("GET", "/dynasty"), ("GET", "/dynasty.html"):
            return staticFile("public/dynasty.html", mime: "text/html; charset=utf-8")
        case ("GET", "/dynasty.js"):
            return staticFile("public/dynasty.js", mime: "text/javascript; charset=utf-8")
        case ("GET", "/app.js"):
            return staticFile("public/app.js", mime: "text/javascript; charset=utf-8")
        case ("GET", "/style.css"):
            return staticFile("public/style.css", mime: "text/css; charset=utf-8")
        case ("GET", "/map"), ("GET", "/map.html"):
            return staticFile("public/map.html", mime: "text/html; charset=utf-8")
        case ("GET", "/map.js"):
            return staticFile("public/map.js", mime: "text/javascript; charset=utf-8")
        case ("GET", "/aspect.js"):
            return staticFile("public/aspect.js", mime: "text/javascript; charset=utf-8")
        case ("GET", "/worldmap.jpg"):
            return staticFile("public/worldmap.jpg", mime: "image/jpeg")
        case let (_, p) where p.hasPrefix("/aspect/"):
            return staticFile("public/aspect.html", mime: "text/html; charset=utf-8")
        case ("GET", "/api/events"):
            return json(loadEvents())
        case ("GET", "/api/timemap"):
            if let data = try? Data(contentsOf: timemapURL),
               let obj = try? JSONSerialization.jsonObject(with: data) {
                return json(obj)
            }
            return json(["points": [], "minYear": 0, "maxYear": 0, "total": 0])
        case ("POST", "/api/events"):
            return handleAdd(req)
        case ("DELETE", "/api/events"):
            try? Data("[]".utf8).write(to: eventsURL)
            return json(["ok": true])
        case let (m, p) where (m == "PATCH" || m == "DELETE") && extractID(p) != nil:
            let id = extractID(p)!
            return m == "PATCH" ? handlePatch(req, id: id) : handleDelete(id)
        default:
            return HTTPResponse(status: 404, body: Data("{\"error\":\"not found\"}".utf8), mime: "application/json; charset=utf-8")
        }
    }

    private func extractID(_ path: String) -> String? {
        let parts = path.split(separator: "/").map(String.init)
        guard parts.count == 3, parts[0] == "api", parts[1] == "events" else { return nil }
        return parts[2]
    }

    // MARK: - handlers
    private func handleAdd(_ req: HTTPRequest) -> HTTPResponse {
        guard let parsed = try? JSONSerialization.jsonObject(with: req.body) else {
            return HTTPResponse(status: 400, body: Data(#"{"error":"invalid JSON"}"#.utf8), mime: "application/json; charset=utf-8")
        }
        let list: [[String: Any]] = (parsed as? [[String: Any]]) ?? [parsed as? [String: Any] ?? [:]]
        var events = loadEvents()
        var added = 0
        for raw in list {
            if let ev = validate(raw), !events.contains(where: { $0["title"] as? String == ev["title"] as? String }) {
                events.append(ev)
                added += 1
            }
        }
        saveEvents(events)
        return HTTPResponse(status: 201, body: (try? JSONSerialization.data(withJSONObject: ["added": added])) ?? Data(), mime: "application/json; charset=utf-8")
    }

    private func handlePatch(_ req: HTTPRequest, id: String) -> HTTPResponse {
        guard let patch = try? JSONSerialization.jsonObject(with: req.body) as? [String: Any] else {
            return HTTPResponse(status: 400, body: Data(), mime: "application/json")
        }
        var events = loadEvents()
        guard let idx = events.firstIndex(where: { $0["id"] as? String == id }) else {
            return HTTPResponse(status: 404, body: Data(), mime: "application/json")
        }
        let allow = ["title", "detail", "cause", "process", "impact", "location", "note", "category", "year", "month", "day", "century", "era", "scale", "regions", "aspects", "lat", "lng"]
        for k in allow where patch[k] != nil {
            if k == "year" && patch["year"] is String, let v = Int(patch["year"] as? String ?? "") { events[idx]["year"] = v }
            else if k == "month" && patch["month"] is String, let v = Int(patch["month"] as? String ?? "") { events[idx]["month"] = v }
            else if k == "day" && patch["day"] is String, let v = Int(patch["day"] as? String ?? "") { events[idx]["day"] = v }
            else { events[idx][k] = patch[k] }
        }
        // 重算 sortYear
        if let era = events[idx]["era"] as? String, let year = events[idx]["year"] as? Int {
            let sort = era == "BCE" ? -year : year
            events[idx]["sortYear"] = sort
        }
        events[idx]["updatedAt"] = ISO8601DateFormatter().string(from: Date())
        saveEvents(events)
        return json(events[idx])
    }

    private func handleDelete(_ id: String) -> HTTPResponse {
        var events = loadEvents()
        let before = events.count
        events.removeAll { $0["id"] as? String == id }
        guard events.count != before else {
            return HTTPResponse(status: 404, body: Data(), mime: "application/json")
        }
        saveEvents(events)
        return json(["ok": true])
    }

    // MARK: - 数据
    private func loadEvents() -> [[String: Any]] {
        guard let data = try? Data(contentsOf: eventsURL),
              let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return [] }
        return arr
    }

    private func saveEvents(_ events: [[String: Any]]) {
        let sorted = events.sorted { ($0["sortYear"] as? Int ?? 0) < ($1["sortYear"] as? Int ?? 0) }
        guard let data = try? JSONSerialization.data(withJSONObject: sorted, options: [.prettyPrinted, .sortedKeys]) else { return }
        try? data.write(to: eventsURL)
    }

    private func validate(_ raw: [String: Any]) -> [String: Any]? {
        let title = (raw["title"] as? String)?.trimmingCharacters(in: .whitespaces) ?? ""
        guard !title.isEmpty else { return nil }
        let scale = raw["scale"] as? String ?? "year"
        let era = raw["era"] as? String ?? "CE"
        let year = (raw["year"] as? Int) ?? Int(raw["year"] as? String ?? "") ?? 0
        let month = raw["month"] as? Int ?? Int(raw["month"] as? String ?? "") ?? nil
        let day = raw["day"] as? Int ?? Int(raw["day"] as? String ?? "") ?? nil
        let sortYear = era == "BCE" ? -year : year
        var ev: [String: Any] = [
            "id": "ev_\(Int(Date().timeIntervalSince1970 * 1000))_\(Int.random(in: 100...999))",
            "title": title, "category": raw["category"] as? String ?? "other",
            "scale": scale, "era": era, "year": year,
            "month": month ?? NSNull(), "day": day ?? NSNull(), "century": NSNull(),
            "sortYear": sortYear, "location": raw["location"] as? String ?? NSNull(),
            "note": raw["note"] as? String ?? NSNull(), "tags": [String](),
            "createdAt": ISO8601DateFormatter().string(from: Date()),
        ]
        if let regions = raw["regions"] as? [String] { ev["regions"] = regions }
        if let aspects = raw["aspects"] as? [String] { ev["aspects"] = aspects }
        if let detail = raw["detail"] as? String { ev["detail"] = detail }
        if let lat = raw["lat"] as? Double { ev["lat"] = lat; ev["lng"] = raw["lng"] as? Double ?? 0 }
        return ev
    }

    // MARK: - 工具
    private func staticFile(_ rel: String, mime: String) -> HTTPResponse {
        // rel = "public/index.html" 等，bundle 内路径为 Contents/Resources/<rel>
        let comps = rel.split(separator: "/").map(String.init)
        guard comps.count == 2 else {
            return HTTPResponse(status: 404, body: Data("missing".utf8), mime: "text/plain")
        }
        let name = (comps[1] as NSString).deletingPathExtension
        let ext = (comps[1] as NSString).pathExtension
        guard let url = Bundle.module.url(forResource: name, withExtension: ext, subdirectory: comps[0]) else {
            return HTTPResponse(status: 404, body: Data("missing".utf8), mime: "text/plain")
        }
        return HTTPResponse(status: 200, body: (try? Data(contentsOf: url)) ?? Data(), mime: mime)
    }

    private func json(_ obj: Any) -> HTTPResponse {
        let data = (try? JSONSerialization.data(withJSONObject: obj)) ?? Data("[]".utf8)
        return HTTPResponse(status: 200, body: data, mime: "application/json; charset=utf-8")
    }
}

// MARK: - HTTP primitives
struct HTTPRequest {
    let method: String
    let path: String
    let body: Data
}

struct HTTPResponse {
    let status: Int
    let body: Data
    let mime: String
}

final class HTTPServer {
    private let handler: (HTTPRequest) -> HTTPResponse
    private var socketFD: Int32 = -1
    private var acceptThread: Thread?
    private var running = false

    init(handler: @escaping (HTTPRequest) -> HTTPResponse) {
        self.handler = handler
    }

    func listen(port: UInt16) throws -> UInt16 {
        let fd = socket(AF_INET, SOCK_STREAM, 0)
        guard fd >= 0 else { throw ServerError.socketFailed }
        var yes: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, socklen_t(MemoryLayout<Int32>.size))

        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = port == 0 ? 0 : port.bigEndian
        addr.sin_addr = in_addr(s_addr: INADDR_ANY)

        let bindResult = withUnsafePointer(to: addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }
        guard bindResult == 0 else { close(fd); throw ServerError.bindFailed }
        guard Darwin.listen(fd, 16) == 0 else { close(fd); throw ServerError.listenFailed }

        // 读回实际端口（port=0 时内核分配）
        var actual = sockaddr_in()
        var len = socklen_t(MemoryLayout<sockaddr_in>.size)
        let rc = withUnsafeMutablePointer(to: &actual) {
            getsockname(fd, UnsafeMutableRawPointer($0).assumingMemoryBound(to: sockaddr.self), &len)
        }
        _ = rc
        let realPort = UInt16(bigEndian: actual.sin_port)

        socketFD = fd
        running = true
        let t = Thread { [weak self] in
            guard let self else { return }
            while self.running {
                var clientAddr = sockaddr()
                var clientLen = socklen_t(MemoryLayout<sockaddr>.size)
                let clientFD = accept(fd, &clientAddr, &clientLen)
                guard clientFD >= 0 else { continue }
                DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                    guard let self else { return }
                    self.serve(clientFD: clientFD)
                }
            }
        }
        t.stackSize = 1 << 20
        t.start()
        acceptThread = t
        return realPort
    }

    func stop() {
        running = false
        if socketFD >= 0 { close(socketFD); socketFD = -1 }
    }

    private func serve(clientFD: Int32) {
        defer { close(clientFD) }
        var buf = [UInt8](repeating: 0, count: 65536)
        var received = Data()
        // 读请求头（至多 64KB 起步）
        var headerEnd: Range<Data.Index>? = nil
        while headerEnd == nil && received.count < 10 * 1024 * 1024 {
            let n = recv(clientFD, &buf, buf.count, 0)
            guard n > 0 else { return }
            received.append(contentsOf: buf[0..<n])
            headerEnd = received.range(of: Data("\r\n\r\n".utf8))
        }
        guard let hdrRange = headerEnd else { return }
        let headerData = received.subdata(in: received.startIndex..<hdrRange.lowerBound)
        guard let headerText = String(data: headerData, encoding: .utf8) else { return }
        let lines = headerText.components(separatedBy: "\r\n")
        guard let requestLine = lines.first else { return }
        let parts = requestLine.split(separator: " ").map(String.init)
        guard parts.count >= 2 else { return }
        let method = parts[0]
        var path = parts[1]
        if let q = path.firstIndex(of: "?") { path = String(path[..<q]) }

        // content-length
        var contentLength = 0
        for line in lines.dropFirst() {
            let kv = line.split(separator: ":", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }
            if kv.count == 2 && kv[0].lowercased() == "content-length" {
                contentLength = Int(kv[1]) ?? 0
            }
        }
        let bodyStart = hdrRange.upperBound
        var body = received.subdata(in: bodyStart..<received.endIndex)
        while body.count < contentLength {
            let n = recv(clientFD, &buf, buf.count, 0)
            guard n > 0 else { break }
            body.append(contentsOf: buf[0..<n])
        }
        if body.count > contentLength { body = body.prefix(contentLength) }

        let req = HTTPRequest(method: method, path: path, body: body)
        let resp = handler(req)
        let statusText: String
        switch resp.status {
        case 200: statusText = "OK"
        case 201: statusText = "Created"
        case 400: statusText = "Bad Request"
        case 404: statusText = "Not Found"
        case 207: statusText = "Multi-Status"
        default: statusText = "Error"
        }
        var response = Data()
        response.append(Data("HTTP/1.1 \(resp.status) \(statusText)\r\n".utf8))
        response.append(Data("Content-Type: \(resp.mime)\r\n".utf8))
        response.append(Data("Content-Length: \(resp.body.count)\r\n".utf8))
        response.append(Data("Cache-Control: no-store\r\nConnection: close\r\n\r\n".utf8))
        response.append(resp.body)
        response.withUnsafeBytes { ptr in
            _ = send(clientFD, ptr.baseAddress, ptr.count, 0)
        }
    }

    enum ServerError: Error { case socketFailed, bindFailed, listenFailed }
}
