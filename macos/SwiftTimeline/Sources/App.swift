import SwiftUI
import WebKit

@main
struct SwiftTimelineApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 1000, minHeight: 680)
        }
        .windowStyle(.automatic)
        .commands {
            CommandGroup(replacing: .newItem) {} // 去掉"新建"
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // 菜单标题改为中文
        if let mainMenu = NSApp.mainMenu {
            for item in mainMenu.items {
                if item.title == "SwiftTimeline" || item.title.hasPrefix("Swift") {
                    item.title = "时间轴"
                }
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

struct ContentView: NSViewControllerRepresentable {
    func makeNSViewController(context: Context) -> WebViewController { WebViewController() }
    func updateNSViewController(_ nsViewController: WebViewController, context: Context) {}
}

final class WebViewController: NSViewController {
    private var webView: WKWebView!
    private let server = TimelineServer.shared

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        do {
            try server.start()
            if let url = URL(string: "http://127.0.0.1:\(server.port)/") {
                webView.load(URLRequest(url: url))
            }
        } catch {
            let alert = NSAlert()
            alert.messageText = "服务启动失败"
            alert.informativeText = "\(error)"
            alert.runModal()
        }
    }
}

extension WebViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // 外部链接用系统浏览器打开
        if let url = navigationAction.request.url,
           url.host != "127.0.0.1",
           navigationAction.navigationType == .linkActivated {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }
}
