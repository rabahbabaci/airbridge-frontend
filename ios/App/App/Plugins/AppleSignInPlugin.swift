import Foundation
import Capacitor
import AuthenticationServices

@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var call: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        self.call = call

        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.email, .fullName]

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? UIWindow()
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            call?.reject("Invalid credential type")
            call = nil
            return
        }

        var identityToken: String? = nil
        if let tokenData = credential.identityToken {
            identityToken = String(data: tokenData, encoding: .utf8)
        }

        guard let token = identityToken else {
            call?.reject("No identity token received")
            call = nil
            return
        }

        call?.resolve([
            "identityToken": token,
            "authorizationCode": String(data: credential.authorizationCode ?? Data(), encoding: .utf8) ?? "",
            "email": credential.email ?? "",
            "givenName": credential.fullName?.givenName ?? "",
            "familyName": credential.fullName?.familyName ?? "",
            "user": credential.user
        ])
        call = nil
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let authError = error as? ASAuthorizationError
        if authError?.code == .canceled {
            call?.reject("USER_CANCELED", "1001", error)
        } else {
            call?.reject(error.localizedDescription, nil, error)
        }
        call = nil
    }
}
