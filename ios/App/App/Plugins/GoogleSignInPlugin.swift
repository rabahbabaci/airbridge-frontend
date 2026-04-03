import Foundation
import Capacitor

@objc(GoogleSignInPlugin)
public class GoogleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GoogleSignInPlugin"
    public let jsName = "GoogleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    @objc func signIn(_ call: CAPPluginCall) {
        // Google Sign-In on iOS requires the Google Sign-In SDK (GoogleSignIn-iOS SPM package).
        // For now, this is a stub that instructs the user to use web-based Google auth.
        // To enable native Google Sign-In:
        // 1. Add GoogleSignIn-iOS SPM dependency
        // 2. Configure with your iOS client ID from Google Cloud Console
        // 3. Implement GIDSignIn flow here
        call.reject("NATIVE_GOOGLE_NOT_CONFIGURED", "Native Google Sign-In requires additional iOS SDK setup. Use Apple Sign In or phone auth on iOS.")
    }
}
