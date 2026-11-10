import Foundation
import UIKit
import Security
import Capacitor

// iOS local plugins. The bundle is generated from the Capacitor 8 SPM template.
// Do not store tester tokens in WKWebView localStorage, app backups, or source files.
@objc(TesterTokenStorePlugin)
public class TesterTokenStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TesterTokenStorePlugin"
    public let jsName = "TesterTokenStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]
    private let service = "com.yechan.wordcollector.tester-token"
    private let account = "tester-token"

    private func keychainQuery() -> [String: Any] {
        return [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrSynchronizable as String: kCFBooleanFalse as Any
        ]
    }
    @objc public func save(_ call: CAPPluginCall) {
        let token = call.getString("token") ?? ""
        guard token.range(of: "^wc_[a-f0-9]{64}$", options: .regularExpression) != nil,
              let bytes = token.data(using: .utf8) else {
            call.reject("테스터 인증 코드 형식을 확인해 주세요.")
            return
        }
        var query = keychainQuery()
        SecItemDelete(query as CFDictionary)
        query[kSecValueData as String] = bytes
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let result = SecItemAdd(query as CFDictionary, nil)
        if result == errSecSuccess { call.resolve() }
        else { call.reject("인증 코드를 기기에 안전하게 저장하지 못했습니다.") }
    }
    @objc public func read(_ call: CAPPluginCall) {
        var query = keychainQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { call.resolve(["token": ""]); return }
        guard status == errSecSuccess, let data = item as? Data,
              let token = String(data: data, encoding: .utf8),
              token.range(of: "^wc_[a-f0-9]{64}$", options: .regularExpression) != nil else {
            call.reject("저장된 인증 코드를 읽지 못했습니다. 다시 등록해 주세요.")
            return
        }
        call.resolve(["token": token])
    }
    @objc public func clear(_ call: CAPPluginCall) {
        let result = SecItemDelete(keychainQuery() as CFDictionary)
        if result == errSecSuccess || result == errSecItemNotFound { call.resolve() }
        else { call.reject("인증 코드를 지우지 못했습니다.") }
    }
}

// A sandbox-safe iOS Files document picker for CSV/XLSX and JSON backups.
@objc(WordExportPlugin)
public class WordExportPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "WordExportPlugin"
    public let jsName = "WordExport"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise)
    ]
    private var pendingCall: CAPPluginCall?
    private var temporaryDirectory: URL?

    @objc public func save(_ call: CAPPluginCall) {
        guard pendingCall == nil else {
            call.reject("다른 파일 저장을 먼저 완료해 주세요.")
            return
        }
        let type = call.getString("mimeType") ?? ""
        let suffix: String
        switch type {
        case "text/csv": suffix = ".csv"
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": suffix = ".xlsx"
        case "application/json": suffix = ".json"
        default:
            call.reject("지원하지 않는 파일 형식입니다.")
            return
        }
        let encoded = call.getString("base64") ?? ""
        guard !encoded.isEmpty, encoded.count <= 32 * 1024 * 1024,
              let data = Data(base64Encoded: encoded),
              !data.isEmpty, data.count <= 24 * 1024 * 1024 else {
            call.reject("파일이 비어 있거나 24 MiB를 넘었습니다.")
            return
        }
        var name = call.getString("filename") ?? "wordcollector"
        name = name.replacingOccurrences(of: "[\\\\/:*?\"<>|\\p{Cc}]", with: "_", options: .regularExpression)
        if name.count > 120 { name = String(name.prefix(120)) }
        if !name.lowercased().hasSuffix(suffix) { name += suffix }
        do {
            let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            let url = dir.appendingPathComponent(name, isDirectory: false)
            try data.write(to: url, options: .atomic)
            pendingCall = call
            temporaryDirectory = dir
            DispatchQueue.main.async {
                let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
                picker.delegate = self
                self.bridge?.viewController?.present(picker, animated: true)
            }
        } catch {
            call.reject("파일 저장 창을 열지 못했습니다. 다시 시도해 주세요.")
        }
    }

    private func finish(cancelled: Bool) {
        let saved = pendingCall
        pendingCall = nil
        if let dir = temporaryDirectory {
            temporaryDirectory = nil
            try? FileManager.default.removeItem(at: dir)
        }
        saved?.resolve(["cancelled": cancelled])
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        finish(cancelled: true)
    }
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        finish(cancelled: false)
    }
}

@objc(WordCollectorViewController)
open class WordCollectorViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(TesterTokenStorePlugin())
        bridge?.registerPluginInstance(WordExportPlugin())
    }
}
