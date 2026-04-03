import UIKit
import Capacitor

@objc(BridgeViewController)
class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleSignInPlugin())
        bridge?.registerPluginInstance(GoogleSignInPlugin())
    }
}
